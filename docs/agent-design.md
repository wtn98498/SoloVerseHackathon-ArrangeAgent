# Arrangement Agent — 重新设计

> 本文件是 PlayBand 编曲 agent 的重新设计文档,与 `docs/agent-arrangement.md`(原 brief)
> 形成对照。原 brief 描述"当前目标";本文描述"重新设计后的方案"。
>
> 状态:**待评审**。评审通过后,本文取代原 brief 中被覆盖的小节,并按
> `docs/contracts.md` 的规则更新契约。

## 0. TL;DR

当前 "agent" 其实不是一个会思考的 agent,而是一个写死的模板生成器套了 DeepSeek
的壳。本设计把它升级为 **LLM 做决策 + 乐理引擎做执行 + Plan 继承保证和声 + Region
级精确改写** 的结构,并支持点选单个 MIDI region 进行读/改。

核心原则一句话:

> **LLM 不写音符,写"编曲计划"。乐理引擎(确定性 TS 函数)把计划渲染成音符。**

---

## 1. 现状诊断(为什么要重新设计)

| 问题 | 证据 | 后果 |
|---|---|---|
| DeepSeek 根本没被调用 | `src/backend/services/arrangement.ts:13-15` 写死走 `generateFallbackArrangement` | "AI 编曲"实为固定模板,与智能无关 |
| Prompt 是一行废话 | `src/backend/deepseek/client.ts:45` | 真接上 DeepSeek 也会产出垃圾:无 schema、无乐理约束、无示例 |
| 没有工具,只有内联逻辑 | brief 列了 8 个工具(`deriveKeyAndScale`/`buildDrumPattern`...),均未实现成独立函数 | LLM 无任何可调用能力 |
| LLM 在"裸写 MIDI" | 整个架构假设 LLM 直接吐 128 步音符 JSON | AI 音乐经典反模式:LLM 不擅长逐音生成 |
| 音乐是写死的 I–V–vi–IV | `src/backend/arrangement/fallback.ts:178` | 能响,但谈不上编曲,更谈不上 region 级编辑 |
| 无 region 概念 | `TrackTimeline.tsx:151` 的 `MIDIClip` 无 `onClick`;`UIState` 无 `selectedClipId`;`api.ts` 只有整曲接口 | 无法"点 region → 改 region" |

结论:**当前没有 agent,只有一个 deterministic 模板生成器。**

---

## 2. 核心设计原则

> **LLM 做决策,乐理引擎做执行。LLM 不写音符,写"编曲计划"(ArrangementPlan)。**

```
❌ 当前隐含设计: LLM 直接生成 MIDI
   指令 ──→ LLM ──→ 128 个音符坐标(随机 / 跑调 / 越界 / 不连贯)

✅ 新设计: LLM 生成计划, 引擎渲染
   指令 ──→ LLM ──→ ArrangementPlan(调性 / 和弦 / 密度 / 感觉)
                          │
                          ▼
                   乐理引擎(确定性 TS 函数)
                          │
                          ▼
                     合法的音符序列
```

为什么这样设计:

1. **可靠**:引擎是确定性的,永远产出合法 MIDI,验证几乎不会失败,demo 不会崩。
2. **可解释**:LLM 返回的"决策"本身就是 `explanation` 的来源,无需编文字。
3. **Region 友好**:region 编辑 = 只改 plan 里那一段,引擎只重渲染那一个 clip——
   天然只动目标 region。
4. **快**:一次 LLM 调用出决策,而非逐音生成。
5. **音乐性**:乐理知识在引擎里,不赌 LLM 懂不懂。

---

## 3. 决策层抽象:`ArrangementPlan`

新增核心数据结构,介于自然语言和 MIDI 之间的"乐谱级意图"。声明式、高层。

```ts
// 新增: src/contracts/plan.ts
export type ScaleId = "major" | "minor" | "dorian" | "mixolydian";
export type Density = "sparse" | "medium" | "busy";
export type Register = "low" | "mid" | "high";

export interface ChordSlot {
  chord: string;        // "Cmaj7", "Am", ...
  barStart: number;     // 0, 2, 4, 6
  barLength: number;    // 2
}

export interface TrackPlan {
  drums:  { groove: GrooveId;  density: Density; fillBars: number[] };
  bass:   { pattern: BassPattern;  register: Register; density: Density };
  guitar: { pattern: GuitarPattern; strum: StrumId };
  keys:   { voicing: VoicingId; density: Density };
}

export interface RegionOverride {
  trackId: string;
  clipId: string;
  patch: Partial<TrackPlan[keyof TrackPlan]]; // 只盖这一段的参数
  intent: string;                              // "把这段 bass 加密" — 给 explanation 用
}

export interface ArrangementPlan {
  key: string;                       // "C"
  scale: ScaleId;                    // "major"
  chordProgression: ChordSlot[];     // 每 2 小节一个和弦(8 bar = 4 和弦)
  energy: number;                    // 0..1, 全局能量
  tracks: TrackPlan;                 // 每轨的演奏法
  regionOverrides?: RegionOverride[]; // ← region 级编辑就改这里
}
```

关键:`density: "busy"` 比一堆 step 坐标高级且安全得多。LLM 只需把自然语言翻译成
这些参数。

`ArrangementProject` 需新增可选字段携带其 plan,使 region 编辑能继承全局决策:

```ts
export interface ArrangementProject {
  // ...现有字段...
  _plan?: ArrangementPlan; // 后端持有,前端透传;region 编辑时回传
}
```

---

## 4. 三种操作模式

匹配 UX:整曲生成 / 点 region 改 / 全局能量。

### 模式 A — Compose(整曲,从 seed)

```
seed ──→ deriveKeyAndScale(seed) ──→ LLM 生成完整 Plan
                                       └──→ 引擎渲染全部 4 轨 ──→ Project
```

### 模式 B — Region Edit(点了一个 clip)— 核心

```
用户点 bass clip + 输入"这段再密集一点、低八度"
   │
   ├ 1. getRegionContext(trackId, clipId)
   │     → 返回该 clip 所在小节的【和弦 + 调性】+ 当前 clip 内容
   │       (agent 知道:这段在第 4-5 小节,和弦是 Am,不能跑调)
   │
   ├ 2. LLM: 看着 context,只产出一个 RegionOverride
   │     { trackId, clipId, patch: { density:"busy", register:"low" }, intent }
   │
   ├ 3. 引擎用【全局 plan + 此 override】只重渲染这一个 clip
   │     → notes 必落在 Am 和弦内,因为引擎从和弦推导
   │
   └ 4. 返回单个 clip ──→ 前端只 patch 这一个,其余原封不动
```

这就是"读整曲、改单段":agent 通过 context 看到整曲调性和声,但只写一个 clip。
和声一致性由引擎保证,不靠 LLM 自觉。

### 模式 C — Global Energy(升级现有 increase/soften)

```
direction ──→ 修改 plan.energy + 各轨 density ──→ 引擎重渲染
```

现状只做 `velocity × 1.2`(`fallback.ts:104`),过于粗糙;新方案会真的改变鼓点密度
与各轨密度,而不仅是力度。

---

## 5. 工具集

四类,均为确定性 TS 函数(LLM 通过 function calling 调用,或编排器代为执行):

```ts
// ── 读工具(给 agent 看上下文) ──
getArrangement(): ArrangementProject
getRegionContext(trackId, clipId): {
  clip: Clip;
  chords: ChordSlot[];      // 这段在和弦进行里的位置
  key: string; scale: ScaleId;
}
analyzeClip(clip): ClipProfile;   // "稀疏 / 只弹根音 / 低力度"

// ── 乐理引擎(把 plan 渲染成音符,确定性) ──
deriveKeyAndScale(seed): { key, scale }
buildDrumClip(style, mood, trackPlan, bars): DrumHit[]
buildBassClip(chords, style, trackPlan, bars): NoteEvent[]
buildGuitarClip(chords, style, trackPlan, bars): NoteEvent[]
buildKeysClip(chords, style, trackPlan, bars): NoteEvent[]
snapToScale(notes, key, scale): NoteEvent[]   // 安全网:跑调音吸到音阶上

// ── 写工具(执行 plan / override) ──
renderPlan(plan): ArrangementProject     // 整曲
renderClip(plan, override): Clip         // 只渲染一个 clip ← region 编辑用

// ── MCP 工具(外部,midi-mcp-server) ──
export_midi(target): { url, bytes }      // 整曲或单 clip 导出 .mid
```

`buildXxxClip` 即 brief 一直要写但没写的工具,现从 `fallback.ts` 内联代码抽出,
变成可复用、可被 region 调用的函数。

---

## 6. 编排循环(Orchestrator)

匹配 brief 的"custom lightweight orchestrator,不上 LangGraph"。Compose 单次;
Region Edit 为一个小 ReAct 循环(有上限)。

```ts
// compose: 单次
async function compose(seed) {
  const key = deriveKeyAndScale(seed);
  const plan = await llmGeneratePlan({ seed, key }); // 1 次 LLM 调用
  return renderPlan(plan);
}

// region edit: 看 → 想 → 改(最多 2 轮)
async function editRegion({ project, target, instruction }) {
  const ctx = getRegionContext(project, target);         // 看上下文(无 LLM)
  const override = await llmPlanOverride({               // 想(1 次 LLM)
    instruction, ctx, currentPlan: project._plan,
  });
  const clip = renderClip(project._plan, override);      // 改(确定性)
  const ok = validateClip(clip, ctx.chords);             // 必须落在和弦内
  return ok ? clip : deterministicFallback(ctx);         // 失败只回退单 clip
}
```

**Hackathon 纪律**:region edit 失败只回退那一个 clip(用和弦内音生成保险段),
绝不影响整曲。符合"demo path 永远可恢复"。

---

## 7. Prompt 设计

替换 `client.ts:45` 那行废话。分两个 prompt:`PLAN_PROMPT`(整曲)与
`REGION_OVERRIDE_PROMPT`(单段)。Region 版本示例:

```text
你是 PlayBand 的编曲决策器。你不写音符,只输出【编曲参数】。

【调性上下文】key=C, scale=major
【目标 region】bass 轨, 第 4-5 小节, 当前和弦 Am
【当前 clip 摘要】稀疏, 只弹根音 A2, 力度 0.6
【用户指令】"这段再密集一点、低八度"

输出 JSON(严格遵守 schema):
{
  "patch": {
    "density": "busy" | "medium" | "sparse",
    "register": "low" | "mid" | "high",
    "pattern": "root" | "walking" | "octave"
  },
  "intent": "一句话说明改了什么"
}

规则:patch 只填要改的字段。不碰 key / scale / 和弦。
```

配合 `response_format` + JSON schema,LLM 几乎不可能产出非法结构。

---

## 8. 验证升级

现有验证只查结构(`validation/arrangement.ts`:step 0-127、velocity 0-1、4 轨齐全)。
新增**音乐性验证**:

- `snapToScale`:跑调音吸到最近音阶音(**修复**,不拒绝)。
- `clipFitsChords`:region clip 的音必须落在其小节和弦的 chord tones 上,否则用
  chord 内音替换。
- 时值 / 重叠 clamp。

这样即使 LLM 决策有偏差,引擎 + 验证会把它拉回"听得过去"的范围内——demo 可靠性
的关键。

---

## 9. MCP 接入(midi-mcp-server)

`export_midi` 走 MCP。两种接法:

- **方案 1(轻,推荐先做)**:自建最小 MCP,用 `@tonejs/midi` 渲染。
  agent 调 `export_midi(plan 或 project)` → `.mid` 文件 → 前端下载。
- **方案 2(重)**:接 `tubone24/midi-mcp-server`,复用其 text→MIDI。

MVP 用方案 1:我们的数据已是结构化 plan/notes,不需要 text→MIDI 那步。约 100 行
MCP server。`tubone24` 更适合"从零文本生成"的场景;后期要更丰富 MIDI 功能(控制器、
弯音)再接它的。

---

## 10. 模块布局

```
src/backend/agent/
  ├── plan.ts              ← ArrangementPlan 类型 + 默认 plan
  ├── orchestrator.ts      ← compose / editRegion / adjustEnergy 三个入口
  ├── llm/
  │   ├── client.ts        ← 现有改造:接 function calling / schema
  │   ├── planPrompt.ts    ← PLAN_PROMPT + REGION_OVERRIDE_PROMPT
  │   └── parse.ts         ← LLM 输出 → ArrangementPlan / RegionOverride
  ├── theory/
  │   ├── key.ts           ← deriveKeyAndScale
  │   ├── chords.ts        ← 和弦进行库 (pop/lofi/rock × mood)
  │   ├── drums.ts         ← buildDrumClip(从 fallback.ts 抽出 + 泛化)
  │   ├── bass.ts guitar.ts keys.ts ← 同上
  │   └── scale.ts         ← snapToScale
  ├── render.ts            ← renderPlan / renderClip(plan + override → notes)
  └── mcp/
      └── midi-export.ts   ← export_midi (@tonejs/midi)
```

`services/arrangement.ts` 改为薄封装,调 `orchestrator`。现有 `complete` / `energy`
接口签名不变(保 demo path),新增 `editRegion`。

---

## 11. 落地阶段(对齐 mock-first 纪律)

| 阶段 | 交付 | 可演示? | 风险 |
|---|---|---|---|
| **0. 抽理论引擎** | `fallback.ts` 内联逻辑抽成 `theory/*.ts` 独立函数 | ✅ 行为不变 | 低,纯重构 |
| **1. Plan 抽象 + renderPlan** | 引擎改为吃 plan,而非直接吃 seed | ✅ 仍能整曲生成 | 低 |
| **2. Region 渲染** | `renderClip` + `getRegionContext`;前端 clip 可点击 + `selectedClipId` | ✅ 点 region → 确定性改(无 LLM) | 中,前端动 |
| **3. 接 DeepSeek 决策** | LLM 出 plan/override,引擎渲染 | ✅ 真正"AI 编曲" | 中,需 key |
| **4. MCP 导出 MIDI** | `export_midi` → `.mid` 下载 | ✅ 评委能拿文件进 DAW | 低 |

每阶段结束 commit + 打 tag。**阶段 0-2 完全不需要 DeepSeek key 就能演示 region 编辑**,
保证 demo 不依赖网络/API。

---

## 12. 契约变更预告(评审通过后执行)

按 `docs/contracts.md` 规则,以下变更需先改契约再改代码:

1. `src/contracts/index.ts`:`ArrangementProject` 新增可选 `_plan?: ArrangementPlan`。
2. `src/contracts/plan.ts`:新建,放 Plan / RegionOverride / TrackPlan 等类型。
3. `src/contracts/api.ts`:新增 `EditRegionRequest` / `EditRegionResponse`。
4. `src/frontend/types.ts`:`UIState` 新增 `selectedClipId: string | null`。
5. `docs/contracts.md`:补 region 编辑接口、plan 模型、ownership 调整。
6. `docs/agent-arrangement.md`:标注被本文覆盖的小节。
```
