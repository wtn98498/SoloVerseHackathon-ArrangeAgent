# PlayBand AI 需求设计与开发计划

## 1. 总基调

PlayBand AI 是一个给普通人玩的 AI 编曲 App。它面向的是“有音乐感觉，但不会乐理、不会 DAW”的用户。

核心承诺：

> Play first. Arrange later.

用户不是从空白专业时间线开始，也不是只输入一句 prompt 等 AI 出歌。用户先用简单、玩具式的乐器控件玩几秒，Agent 再把这段“玩出来的感觉”扩成一段 8 小节编曲。

产品气质：

- 音乐游乐场，而不是专业 DAW。
- 创作副驾驶，而不是黑箱歌曲生成器。
- 像 Cursor 帮程序员写代码一样，帮普通人把音乐直觉编成歌。
- 视觉和交互借鉴 Nintendo 式玩具感，但不复制任何 Nintendo IP。

## 2. 目标用户

核心用户是 A 类用户：

- 想玩音乐，但不懂乐理的人。
- 能说出“我想要开心、松弛、热血、轻快”，但不知道怎么写和弦、鼓点、贝斯的人。
- 被 GarageBand、Logic、Ableton、FL Studio 这类工具吓退的人。

产品文案尽量不用专业术语。优先使用“更明亮”“更有劲”“更柔和”“加点律动”“更像开场”这类自然语言。

## 3. MVP 范围

黑客松 MVP 只服务一个记得住的瞬间：

1. 用户选择风格，或直接开始玩。
2. 用户在一个乐器上玩 5-10 秒。
3. Agent 把这段输入扩成一段 8 小节乐队 loop。
4. 用户可以继续让 Agent 改编，例如“更有能量”或“更柔和”。

### 核心乐器

默认乐队只做四个乐器轨道：

- 鼓
- 贝斯
- 吉他
- 电子琴 / 合成器

这四个乐器足够支撑绝大多数流行编曲场景，也足够让评委一眼理解。

### 核心 Agent 动作

第一版只做两个清晰动作：

- 补全编曲
- 更有能量

每个动作都要真正改变编曲数据，并在右侧 Agent 面板里用一句话解释“我改了什么”。

### 明确不做

第一版不做：

- 完整 MIDI 编辑器。
- 完整钢琴卷帘。
- 真实 DAW 插件集成。
- 云端工程同步。
- 多人协作。
- 账号系统。
- 移动端适配。
- 高级导出。
- 大型采样库管理。
- 十几种乐器。
- 古风 / 民族乐器风格包。

### 后续方向

如果 MVP 主流程足够稳定，再把“古风 Style Pack”作为后续扩展。它应该以风格包形式出现，而不是让第一版承担民族乐器系统、额外音色资源和复杂风格转换。

## 4. App 布局

整体是桌面 App 布局：

- 顶部：播放控制、BPM、风格选择、情绪选择。
- 中央：四条乐器轨道，显示 8 小节 clip 和播放指针。
- 底部：当前乐器的玩具式控制器。
- 右侧：Agent bar，参考 Cursor 的侧边助手。

编曲画布必须是主角。Agent 是副驾驶，不是整个产品。

## 5. 交互流程

### 首次体验路径

1. 用户选择一个风格，例如 Pop、Lo-fi、Rock。
2. 用户选择一个乐器轨道。
3. 用户用大按钮玩 5-10 秒。
4. App 把用户输入记录为 seed pattern。
5. 用户点击“补全编曲”。
6. Agent 根据 seed 生成 8 小节乐队 loop。
7. 用户点击“更有能量”或“更柔和”。
8. 编曲更新，但仍然可以继续播放和修改。

### 乐器控制器

控制器要像玩具一样直接：

- 鼓：kick、snare、hi-hat、clap 大 pad。
- 贝斯：4-8 个低音按钮。
- 吉他：几个扫弦 / riff 按钮。
- 电子琴：8 个音阶按钮。

任何控件都不要求用户懂五线谱、钢琴卷帘或和弦级数。

## 6. 技术方案

推荐技术栈：

- 桌面壳：Tauri
- 前端：React + TypeScript
- 音频引擎：Tone.js
- 样式：CSS modules 或 Tailwind，按脚手架速度决定
- Agent API：OpenAI / Claude / 赞助商模型 API
- 编曲格式：JSON-based pattern model

关键原则：

- 先把 React 浏览器版本做成可用。
- 主流程跑通后再包 Tauri。
- 保留浏览器 fallback，避免桌面打包出问题时无法演示。

### 编曲数据模型

核心状态应该是一个结构化 arrangement object，包含：

- `tempo`
- `style`
- `mood`
- `bars`
- `tracks`
- `clips`
- `notes`
- `drumHits`
- `instrumentPreset`

Agent 必须输出结构化 JSON，前端验证后再应用。不要让 Agent 输出自由文本再靠字符串解析改音乐。

### Agent 工具形态

内部动作建议：

- `completeArrangement(seedPattern, style, mood)`
- `increaseEnergy(project)`
- `softenArrangement(project)`
- `explainChanges(before, after)`

第一版可以先做本地规则生成器作为 fallback。等播放、状态更新、UI 都稳定后，再把 API Agent 接上去。

## 7. 音频资源需求

最小资源清单：

- 鼓采样：kick、snare、hi-hat、clap。
- 吉他 pluck / strum 采样或 synth preset。
- 合成贝斯 preset。
- 电子琴 / pad preset。

为了压缩两天周期，优先用 Tone.js synth 解决贝斯、电子琴和部分 pluck。只有鼓和吉他这类“声音特征很明显”的地方再用短采样。

## 8. UI 风格

设计语言：Nintendo-inspired music toy。

原则：

- 大按钮。
- 强反馈。
- 乐器颜色清晰。
- 低门槛。
- 少文字。
- 不做专业 DAW 那种密集参数面板。
- 不做常见 AI 工具的紫蓝渐变大屏风格。

建议颜色角色：

- 鼓：红 / 橙。
- 贝斯：青绿 / 绿色。
- 吉他：黄色。
- 电子琴：蓝 / 紫。

整体要有玩具感，但不要幼稚。它应该像一个好玩的创作工具，而不是儿童早教软件。

## 9. 两天开发计划

### Day 1：可播放核心

目标：

- 创建 App 骨架。
- 渲染主布局。
- 能播放一个循环的 8 小节 arrangement。
- 至少能让用户玩一个乐器。
- 能把用户输入记录为 seed pattern。
- 能用本地规则补全编曲。

任务：

- 搭 Tauri + React + TypeScript 项目。
- 接入 Tone.js。
- 实现播放 / 停止 / BPM 控制。
- 实现 4 轨编曲画布。
- 实现播放指针。
- 实现鼓和电子琴玩具控制器。
- 定义 arrangement JSON 类型。
- 实现本地 arrangement generator。
- 实现“补全编曲”动作，先走 deterministic fallback。

### Day 2：Agent、变化、质感

目标：

- 做出右侧 Agent bar。
- 做出“更有能量”和“更柔和”两种可听变化。
- 做出自然语言解释。
- 增强 UI 反馈。
- 稳定完整演示路径。

任务：

- 实现 Agent 面板 UI。
- 实现“更有能量”动作。
- 实现“更柔和”动作。
- 接入简单 AI API route 或 agent adapter。
- 验证并应用 Agent JSON。
- 加 loading、success、fallback 状态。
- 打磨间距、颜色、按钮反馈、播放动画。
- 验证浏览器 fallback 和 Tauri 启动。

## 10. 初始 TODO List

### Product

- [ ] 确定 App 名称：PlayBand AI、MuseToy 或其他。
- [ ] 确定第一版风格列表：Pop、Lo-fi、Rock。
- [ ] 确定入口是先选风格，还是直接 free play。
- [ ] 写一句 App header tagline。

### Engineering

- [ ] 创建 Tauri + React + TypeScript 项目。
- [ ] 加入 Tone.js 并验证基础播放。
- [ ] 定义 arrangement JSON types。
- [ ] 实现播放控制。
- [ ] 实现 4 轨 timeline。
- [ ] 实现鼓 pad 控制器。
- [ ] 实现电子琴控制器。
- [ ] 捕获用户输入并转成 seed pattern。
- [ ] 实现本地编曲生成器。
- [ ] 实现能量变化转换器。
- [ ] 实现右侧 Agent panel。
- [ ] 加入 Agent action buttons。
- [ ] 加入 API-backed agent generation。
- [ ] 加入 API 失败时的本地 fallback。
- [ ] 加入播放指针和 clip 反馈。
- [ ] 验证浏览器运行。
- [ ] 验证 Tauri 运行。

### Assets

- [ ] 收集或制作基础鼓采样。
- [ ] 收集或合成吉他 pluck / strum。
- [ ] 确认 demo 使用的资源授权安全。

### Demo Safety

现在先不做演示材料，但实现时必须保留演示安全线：

- [ ] 准备一条稳定 seed input。
- [ ] 准备一条稳定补全编曲结果。
- [ ] 准备一条稳定“更有能量”变化结果。
- [ ] 保证完整流程不依赖 API 也能跑。
- [ ] 保留浏览器 fallback，防止桌面包临场出问题。

## 11. 成功标准

MVP 成功的标准：

- 非音乐人不看说明也能玩出几个音或节奏。
- App 能把输入扩成一段可听的 8 小节 loop。
- 至少三个乐器轨道会随着 Agent 动作可视化更新。
- “更有能量”的听感差异足够明显。
- Agent 能用普通人听得懂的话解释改动。
- 核心流程可以在 90 秒内讲清楚并跑完。
