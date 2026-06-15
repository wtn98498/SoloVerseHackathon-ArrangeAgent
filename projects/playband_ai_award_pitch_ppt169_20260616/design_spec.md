# playband_ai_award_pitch - Design Spec

> Human-readable design narrative for a hackathon award pitch deck. Machine-readable execution contract lives in `spec_lock.md`; if the two diverge, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | PlayBand AI 获奖路演 |
| **Canvas Format** | PPT 16:9 (1280x720) |
| **Page Count** | 8 slides |
| **Design Style** | A) General Versatile + Nintendo-inspired music toy pitch |
| **Target Audience** | 黑客松评委、赞助方技术评审、现场观众 |
| **Use Case** | 3 分钟获奖导向项目路演，衔接现场 live demo |
| **Team / Author** | 欧比克莱歌剧院 · 温添宁 · 参赛假名 scala |
| **Created Date** | 2026-06-16 |

---

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | PPT 16:9 |
| **Dimensions** | 1280x720 |
| **viewBox** | `0 0 1280 720` |
| **Margins** | 56px left/right, 48px top/bottom; hero pages may use full bleed |
| **Content Area** | 1168x624 inside safe margins |

---

## III. Visual Theme

### Theme Style

- **Style**: Nintendo-inspired music toy pitch
- **Theme**: Bright warm pages with dark stage anchors
- **Tone**: 明亮、玩具感、音乐感、可信、适合现场 demo

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#FFF7E8` | Warm toy-like content background |
| **Stage background** | `#24212B` | Cover, demo emphasis, closing |
| **Secondary bg** | `#FFFFFF` | Screenshot panels, card surfaces |
| **Primary** | `#FF5A3D` | Drum / energy / main attention |
| **Accent** | `#20C997` | Bass / generation success |
| **Secondary accent** | `#FFD43B` | Guitar / highlighted idea |
| **Tertiary accent** | `#5C7CFA` | Keys / AI / candidate state |
| **Body text** | `#24212B` | Main text |
| **Reverse text** | `#FFF7E8` | Text on dark stage |
| **Secondary text** | `#6D6577` | Captions and footers |
| **Border/divider** | `#E7DCC7` | Light structure |
| **Success** | `#20C997` | Confirmed candidate, stable fallback |
| **Warning** | `#FF5A3D` | Pain points and friction |

### Gradient Scheme

```xml
<linearGradient id="stageGlow" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#FF5A3D" stop-opacity="0.26"/>
  <stop offset="48%" stop-color="#5C7CFA" stop-opacity="0.18"/>
  <stop offset="100%" stop-color="#20C997" stop-opacity="0.22"/>
</linearGradient>
```

---

## IV. Typography System

### Font Plan

**Typography direction**: bold toy-keynote display plus clean CJK-safe body.

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | `SimHei`, `"Microsoft YaHei"` | `Impact`, `"Arial Black"` | `sans-serif` |
| **Body** | `"Microsoft YaHei"` | `Arial` | `sans-serif` |
| **Emphasis** | `SimHei` | `"Arial Black"` | `sans-serif` |
| **Code** | — | `Consolas`, `"Courier New"` | `monospace` |

**Per-role font stacks**

- Title: `Impact, Arial Black, SimHei, Microsoft YaHei, sans-serif`
- Body: `Arial, Microsoft YaHei, sans-serif`
- Emphasis: `Arial Black, SimHei, Microsoft YaHei, sans-serif`
- Code: `Consolas, Courier New, monospace`

### Font Size Hierarchy

**Baseline**: Body font size = 20px.

| Purpose | Ratio to body | Current Project | Weight |
| ------- | ------------- | --------------- | ------ |
| Cover title | 3.8-4.6x | 76-92px | Heavy |
| Page title | 1.8-2.2x | 36-44px | Heavy |
| Hero number / phrase | 2.4-3.8x | 48-76px | Heavy |
| Subtitle | 1.2-1.5x | 24-30px | SemiBold |
| Body content | 1x | 20px | Regular |
| Annotation / caption | 0.7-0.85x | 14-17px | Regular |
| Page number / footnote | 0.55-0.65x | 11-13px | Regular |

Formula rendering policy: `text-only`.

---

## V. Layout Principles

### Page Structure

- **Header area**: 48-120px, used for page title and tiny progress dots when needed.
- **Content area**: 500-600px, driven by screenshots, large statements, or compact architecture diagrams.
- **Footer area**: 32-48px, optional demo link or quiet page number.

### Layout Pattern Library

Use a rhythm of dark anchor pages, warm content pages, and screenshot-led product pages. Avoid a uniform card grid. Screenshots should be treated as real product evidence, not decoration.

| Pattern | Use in this deck |
| ------- | ---------------- |
| Full-bleed + floating text | Cover, closing, demo handoff |
| Figure-text overlap | Memorable moment and demo screenshot emphasis |
| Asymmetric split | Problem, solution, future planning |
| Pipeline / process | Demo journey and technical architecture |
| Layered architecture | Technical architecture page |
| Image-as-canvas native overlay | Demo page and agent candidate explanation |
| Negative-space-driven | Core insight page |

### Spacing Specification

**Universal**

| Element | Current Project |
| ------- | --------------- |
| Safe margin from canvas edge | 56px |
| Content block gap | 28-40px |
| Icon-text gap | 10-14px |

**Card-based layouts**

| Element | Current Project |
| ------- | --------------- |
| Card gap | 20-28px |
| Card padding | 22-28px |
| Card border radius | 8px |
| Single-row card height | 430-520px |
| Three-column card width | 350-370px |

**Non-card containers**

- Use colored rails, sticker tags, and rounded screenshot frames instead of nested cards.
- Line-height: 1.35-1.55x body font.
- Product screenshots use `no-crop` unless a deliberate hero crop is called out.

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `phosphor-duotone`
- **Usage method**: SVG placeholder `<use data-icon="phosphor-duotone/icon-name" .../>`
- **Style rule**: one icon library only.

### Recommended Icon List

| Purpose | Icon Path | Page |
| ------- | --------- | ---- |
| Music creation | `phosphor-duotone/music-notes` | P01, P03 |
| Human tap / interaction | `phosphor-duotone/cursor-click` | P02, P05 |
| Agent magic | `phosphor-duotone/magic-wand` | P04, P05 |
| AI music director | `phosphor-duotone/robot` | P05, P06 |
| Structured data | `phosphor-duotone/stack-simple` | P04, P06 |
| Flow | `phosphor-duotone/flow-arrow` | P05, P06 |
| Playback | `phosphor-duotone/play-circle` | P05 |
| Reliability | `phosphor-duotone/target` | P07 |
| Future launch | `phosphor-duotone/rocket-launch` | P08 |
| Users | `phosphor-duotone/users` | P02, P07 |
| Code boundary | `phosphor-duotone/code` | P06 |
| Audio waveform | `phosphor-duotone/waveform` | P03 |
| Control sliders | `phosphor-duotone/sliders-horizontal` | P02 |

---

## VII. Visualization Reference List

Catalog read: 71 templates

| Page | Template | Path | Summary-quote (verbatim from `charts_index.json`) | Usage |
| ---- | -------- | ---- | ------------------------------------------------- | ----- |
| P05 | process_flow | `templates/charts/process_flow.svg` | "Pick for 3-8 sequential steps connected by simple arrows — approval workflows, customer onboarding, request handling, lifecycle stages. Skip if cyclical (use circular_stages) or stages produce named outputs (use pipeline_with_stages)." | Demo journey: tap seed → MIDI clip → agent candidate → apply → follow-up |
| P06 | layered_architecture | `templates/charts/layered_architecture.svg` | "Pick for 3-4 horizontal architecture layers (presentation/service/data), 2-4 module cards per layer, each card = title + 1-line description (description required, even if source brief). Skip if no per-module descriptions (use icon_grid) or no horizontal layering (use module_composition)." | Technical architecture: UI, music engine, agent boundary, data model |
| P08 | pipeline_with_stages | `templates/charts/pipeline_with_stages.svg` | "Pick for 3-5 horizontal pipeline stages, each = title + 1-line description + output artifact, connected by arrows (data pipelines, ETL, build pipelines). Skip if any stage lacks an artifact (use process_flow or numbered_steps)." | Future roadmap from reliable MVP to model integration and style packs |

**Runners-up considered**

- `numbered_steps` | rejected for P05: demo path needs arrows and state transitions, not just equal numbered steps.
- `icon_grid` | rejected for P06: architecture is layered and contract-based, not parallel feature cards.
- `roadmap_vertical` | rejected for P08: the future plan is a product pipeline with outputs, not a date-based milestone list.

---

## VIII. Image Resource List

| Filename | Dimensions | Ratio | Purpose | Type | Layout pattern | Acquire Via | Status | Reference | text_policy | page_role |
| -------- | ---------- | ----- | ------- | ---- | -------------- | ----------- | ------ | --------- | ----------- | --------- |
| playband-ai-demo.png | 2560x1353 | 1.89 | Hero product screenshot for opening promise | Product Screenshot | #1 Full-bleed background with floating title + #29 Two-stop scrim — opaque on text side, transparent on focal side | user | Existing | Existing PlayBand AI product screenshot used as proof of real demo | | |
| 01-start.png | 1440x1050 | 1.37 | Start screen / toy-like first impression | Product Screenshot | #4 Right image bleeding off the canvas edge + #66 Image fading into the solid background | user | Existing | Existing opening screen screenshot | | |
| 03-capture-seed.png | 1440x1050 | 1.37 | Human seed capture proof | Product Screenshot | #45 Background image + numbered hotspots with sidebar legend + #21 Rounded rectangle crop | user | Existing | Existing capture pad screenshot | | |
| 05-agent-candidate.png | 1440x1050 | 1.37 | Agent candidate and explanation proof | Product Screenshot | #38 Background image + annotation cards with bezier leader lines + #21 Rounded rectangle crop | user | Existing | Existing agent-generated candidate screenshot | | |
| 06-multiturn-agent.png | 1440x1050 | 1.37 | Multi-turn music direction proof | Product Screenshot | #48 Side-by-side comparison (before/after, A/B, then/now) + #21 Rounded rectangle crop | user | Existing | Existing multi-turn agent screenshot | | |
| 02-blank-studio.png | 1440x1050 | 1.37 | Backup screenshot for blank studio state | Product Screenshot | #19 Image floating in whitespace with thin frame and caption | user | Existing | Existing blank studio screenshot, backup for alternate demo slide | | |

Image-as-canvas coverage is satisfied by P05 using #38/#45 style native overlay on top of real product screenshots.

---

## IX. Content Outline

### Part 1: Hook

#### Slide 01 - Cover

- **Layout**: Full-bleed product screenshot with dark stage scrim and bright music blocks.
- **Title**: PlayBand AI
- **Subtitle**: 先玩出一点灵感，再让 AI 音乐导演把它编成一支乐队。
- **Info**: 欧比克莱歌剧院 · 温添宁 · 参赛假名 scala · 在线演示：wenwen.zone/playband
- **Core message**: 这不是黑箱生成歌曲，而是一个可以上手玩的 AI 音乐导演。

#### Slide 02 - Problem

- **Layout**: Asymmetric split: left pain statement, right playful UI image edge.
- **Title**: AI 音乐忘了第一件事：先玩起来
- **Core message**: 普通人被迫在专业复杂度和 prompt-only 被动生成之间二选一。
- **Content**:
  - 专业 DAW 一上来就要求用户懂乐理、轨道、插件和编辑术语。
  - Prompt-to-song 工具很轻松，但跳过了用户的手，结果不像“我做出来的”。
  - 中间缺的是：给有乐感但不会编曲的人，一个能先玩、再被 AI 放大的入口。

#### Slide 03 - Core Insight

- **Layout**: Negative-space hero phrase with four colorful track tokens.
- **Title**: 产品洞察
- **Core message**: 灵感种子应该来自人，编曲扩展可以交给 Agent。
- **Content**:
  - 人负责：品味、节奏感、身体上的“玩一下”。
  - Agent 负责：结构、配器、变化和补全。
  - 界面负责：把结果变成看得见、听得到、能继续改的 MIDI-like clip。

### Part 2: Product

#### Slide 04 - Solution

- **Layout**: Before/after composition, toy input on left, band arrangement on right.
- **Title**: 几下敲击，变成四轨乐队 loop
- **Core message**: PlayBand AI 捕捉一小段节奏种子，并扩展成鼓、贝斯、吉他、键盘的 8 小节编曲。
- **Content**:
  - 捕捉：大 pad 把敲击变成 lightweight MIDI-like events。
  - 编曲：音乐导演补全一个 8 小节乐队 loop。
  - 控制：生成结果先作为候选试听，用户确认后才放进编曲。

#### Slide 05 - Demo

- **Layout**: Product screenshot as canvas with numbered hotspots and flow overlay.
- **Title**: 60 秒评委演示
- **Core message**: 记忆点足够简单：我敲了几下，它变成一支乐队。
- **Visualization**: process_flow
- **Content**:
  - 1 敲一段短鼓点。
  - 2 捕捉成 MIDI-like 数据。
  - 3 让 Agent 补全整支乐队。
  - 4 先试听候选，再应用，然后继续说：更快一点、更柔一点、更像路演开场。
  - 在线演示：`https://wenwen.zone/playband/`

### Part 3: Build

#### Slide 06 - Technical Architecture

- **Layout**: Layered architecture diagram with bright track-color rails.
- **Title**: 为可靠演示而建，不是脆弱的 AI 表演
- **Core message**: 即使没有模型 key，demo 也能跑；同时保留清晰的 DeepSeek-ready 接入边界。
- **Visualization**: layered_architecture
- **Content**:
  - React + TypeScript 渲染编辑器、pad、候选卡片和钢琴卷帘式信任视图。
  - Tone.js 在浏览器里播放 loop。
  - Lightweight MIDI-like JSON 让每个 Agent 结果都可见、可听、可变换。
  - 本地确定性音乐导演提供 fallback；DeepSeek 可以接在同一组动作后面。

#### Slide 07 - Why It Stands Out

- **Layout**: Three proof pillars plus one big quote-like takeaway.
- **Title**: 为什么它有机会赢
- **Core message**: 它把 AI 生成变成了评委能理解、能测试、能记住的协作创作循环。
- **Content**:
  - 好记：一句话就能复述——几下敲击变成一支乐队。
  - 可信：生成的是结构化音乐数据，不是隐藏的音频黑箱。
  - 稳定：本地 fallback 让路演不怕网络和 API key 出问题。
  - 符合黑客松：范围窄、交互真、未来空间清楚。

### Part 4: Future

#### Slide 08 - Future & Close

- **Layout**: Dark stage closing with roadmap pipeline and final line.
- **Title**: 从音乐玩具，到创作副驾驶
- **Core message**: MVP 证明了交互成立；下一步是在同一个安全候选循环里接入更强的音乐智能。
- **Visualization**: pipeline_with_stages
- **Content**:
  - 模型编曲：更细的风格理解和 taste interpretation。
  - 风格包：lo-fi、rock、pop、古风/民族乐器包。
  - 导出：核心 loop 稳定后支持 MIDI / stems。
  - 社区种子：小 riff 变成可 remix 的创作起点。
  - 收尾金句：先玩，再编曲。

---

## X. Speaker Notes Requirements

- **Filename**: match SVG name, then split from `notes/total.md`.
- **Total duration**: 3 分钟。
- **Notes style**: 中文口语化、自信、强 demo 导向。
- **Presentation purpose**: 说服评委这个项目有可记忆的交互、可靠的演示、可信的未来路径。

---

## XI. Technical Constraints Reminder

### SVG Generation Must Follow

1. viewBox: `0 0 1280 720`
2. Background uses `<rect>` elements.
3. Text wrapping uses `<tspan>`; `<foreignObject>` is forbidden.
4. Transparency uses `fill-opacity` / `stroke-opacity`; `rgba()` is forbidden.
5. Forbidden: `mask`, `<style>`, `class`, `foreignObject`, `textPath`, `animate*`, `script`.
6. XML reserved characters in text must be escaped.

### PPT Compatibility Rules

- `<g opacity="...">` is forbidden; set opacity on each child.
- Inline attributes only.
- Use product screenshots with `preserveAspectRatio="xMidYMid meet"` unless intentionally cropped.
