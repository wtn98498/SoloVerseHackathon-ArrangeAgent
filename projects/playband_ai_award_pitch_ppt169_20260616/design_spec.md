# playband_ai_award_pitch - Design Spec

> Human-readable design narrative for a hackathon award pitch deck. Machine-readable execution contract lives in `spec_lock.md`; if the two diverge, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | PlayBand AI 获奖路演 |
| **Canvas Format** | PPT 16:9 (1280x720) |
| **Page Count** | 10 slides |
| **Design Style** | General Flexible Style + Flat Toy Keynote |
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
| **Margins** | 64px left/right, 54px top/bottom |
| **Content Area** | 1152x612 inside safe margins |

---

## III. Visual Theme

### Theme Style

- **Style**: Flat Toy Keynote
- **Theme**: Nintendo-inspired toy blocks without gradients
- **Tone**: 明亮、干净、玩具感、现场友好、评委可快速扫读
- **Anti-AI rule**: no gradient backgrounds, no decorative glow, no dense filler copy.

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#FFF7E8` | Warm flat content background |
| **Stage background** | `#24212B` | Cover, demo frame, thanks page |
| **Surface** | `#FFFFFF` | Main content panels |
| **Primary** | `#FF5A3D` | Drum / energy / main attention |
| **Accent** | `#20C997` | Bass / generation success |
| **Secondary accent** | `#FFD43B` | Guitar / highlighted idea |
| **Tertiary accent** | `#5C7CFA` | Keys / Agent state |
| **Text** | `#24212B` | Main text |
| **Reverse text** | `#FFF7E8` | Text on dark stage |
| **Secondary text** | `#6D6577` | Captions and footers |
| **Border** | `#E7DCC7` | Light structure |

### Background Rule

Use only solid color rectangles, circles, and simple polygons. Do not use `<linearGradient>`, `<radialGradient>`, glow overlays, or fade scrims.

---

## IV. Typography System

### Font Plan

**Typography direction**: bold keynote display plus clean CJK-safe body.

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

| Purpose | Current Project | Weight |
| ------- | --------------- | ------ |
| Cover title | 76-92px | Heavy |
| Page title | 50-60px | Heavy |
| Subtitle | 22-32px | Bold |
| Body content | 17-20px | Regular / Bold |
| Annotation / caption | 14-16px | Regular |
| Page number / footnote | 12px | Bold |

Formula rendering policy: `text-only`.

---

## V. Layout Principles

### Page Structure

- **Header area**: 80-210px, one title and one short support sentence.
- **Content area**: 360-420px, built from large blocks, screenshots, or simple flows.
- **Footer area**: 40-70px, only page number or one quiet line.

### Text Fit Rules

- Every colored block holds at most two text lines.
- Long statements must be outside small blocks.
- Minimum horizontal padding inside text boxes: 26px.
- No paragraph smaller than 15px.
- Prefer fewer words over smaller type.

### Layout Pattern Library

| Pattern | Use in this deck |
| ------- | ---------------- |
| Flat framed hero | Cover, thanks |
| TOC blocks | Directory page |
| Inspiration cards | Inspiration source |
| Two pain cards | Problem page |
| Three role blocks | Product insight |
| Toy flow | Solution, demo, Agent |
| Solid roadmap | Future page |

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
| Human tap / interaction | `phosphor-duotone/cursor-click` | P03, P07 |
| Agent | `phosphor-duotone/robot` | P03, P08 |
| Control sliders | `phosphor-duotone/sliders-horizontal` | P04 |
| Playback | `phosphor-duotone/play-circle` | P07 |
| Future | `phosphor-duotone/rocket-launch` | P09 |
| Users | `phosphor-duotone/users` | P09 |

---

## VII. Visualization Reference List

Catalog read: 71 templates

| Page | Template | Path | Usage |
| ---- | -------- | ---- | ----- |
| P07 | process_flow | `templates/charts/process_flow.svg` | Demo journey: tap seed → MIDI clip → Agent candidate |
| P09 | pipeline_with_stages | `templates/charts/pipeline_with_stages.svg` | Future roadmap from model arrangement to style packs and exports |

The SVG pages implement these as simplified flat toy flows rather than copying the chart templates verbatim.

---

## VIII. Image Resource List

| Filename | Dimensions | Ratio | Purpose | Type | Acquire Via | Status | Reference |
| -------- | ---------- | ----- | ------- | ---- | ----------- | ------ | --------- |
| playband-ai-demo.png | 2560x1353 | 1.89 | Hero product screenshot for opening promise | Product Screenshot | user | Existing | Existing PlayBand AI product screenshot |
| 01-start.png | 1440x1050 | 1.37 | Start screen / toy-like first impression | Product Screenshot | user | Existing | Existing opening screen screenshot |
| 03-capture-seed.png | 1440x1050 | 1.37 | Human seed capture proof | Product Screenshot | user | Existing | Existing capture pad screenshot |
| 05-agent-candidate.png | 1440x1050 | 1.37 | Agent candidate and explanation proof | Product Screenshot | user | Existing | Existing agent-generated candidate screenshot |
| 06-multiturn-agent.png | 1440x1050 | 1.37 | Multi-turn music direction proof | Product Screenshot | user | Existing | Existing multi-turn agent screenshot |
| 02-blank-studio.png | 1440x1050 | 1.37 | Backup screenshot for blank studio state | Product Screenshot | user | Existing | Existing blank studio screenshot |

---

## IX. Content Outline

### Part 1: Hook

#### Slide 01 - Cover

- **Title**: PlayBand AI
- **Subtitle**: 先玩，再编曲。
- **Core message**: 几下敲击，让 AI 音乐导演补成一支乐队。
- **Info**: 欧比克莱歌剧院 · 温添宁 · scala · wenwen.zone/playband

#### Slide 02 - TOC

- **Title**: 今天只讲一件事
- **Core message**: 普通人的一小段灵感，怎么被 Agent 编成歌。
- **Sections**: 背景、产品、Agent、未来。

#### Slide 03 - Inspiration

- **Title**: 我想要的是音乐版 Cursor
- **Core message**: 不是替我创作，而是把我的直觉变成可继续修改的作品。
- **Content**:
  - Cursor：人写意图，Agent 补结构。
  - GarageBand：好玩，但新手仍会被术语拦住。
  - AI 生成歌：轻松，但人的手感消失了。

### Part 2: Problem And Product

#### Slide 04 - Problem

- **Title**: AI 音乐忘了第一件事
- **Core message**: 先玩起来。
- **Content**:
  - 专业 DAW 太重。
  - Prompt 又太轻。
  - 中间缺一个入口：先表达手感，再被 AI 放大。

#### Slide 05 - Core Insight

- **Title**: 灵感来自人，编曲交给 Agent
- **Core message**: 这不是黑箱音频，而是可继续创作的音乐结构。
- **Content**:
  - 人负责：品味、节奏感、玩一下。
  - Agent 负责：结构、配器、变化。
  - 界面负责：看得见、听得到、能改。

#### Slide 06 - Solution

- **Title**: 几下敲击，变成四轨乐队 loop
- **Core message**: 用户敲一段 seed，Agent 补成 8 小节四轨 loop，候选试听后再应用。
- **Content**:
  - 敲一下：大 pad 捕捉手感。
  - 补全：生成 8 小节四轨。
  - 试听：满意后再应用。

#### Slide 07 - Demo

- **Title**: 我敲了几下，它变成一支乐队。
- **Core message**: 60 秒现场 demo，评委能看到候选、试听、应用。
- **Visualization**: process_flow
- **Content**: 敲短鼓点 → 记 MIDI seed → 补四轨乐队。

### Part 3: Agent

#### Slide 08 - Agent Director

- **Title**: 它不是“生成器”，而是音乐导演
- **Core message**: 会听、会补、会解释，也能继续接受指挥。
- **Content**:
  - 听见种子：从敲击开始。
  - 补全乐队：四轨 loop。
  - 解释变化：告诉你改了什么。
  - 继续指挥：更快 / 更柔。

### Part 4: Future And Thanks

#### Slide 09 - Future

- **Title**: 从音乐玩具，到创作副驾驶
- **Core message**: MVP 证明 Agent 协作循环成立；下一步让音乐导演更懂风格、更懂人。
- **Visualization**: pipeline_with_stages
- **Content**:
  - 模型编曲：更懂风格和 taste。
  - 风格包：lo-fi / rock / 古风。
  - 导出：MIDI / stems。
  - 社区种子：小 riff 变成可 remix 的起点。

#### Slide 10 - Thanks

- **Title**: 谢谢大家
- **Core message**: PlayBand AI 把普通人的音乐直觉，留在创作循环里。
- **Contact**: 欧比克莱歌剧院 · 温添宁 · scala · wenwen.zone/playband

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
5. Forbidden: gradients, `mask`, `<style>`, `class`, `foreignObject`, `textPath`, `animate*`, `script`.
6. XML reserved characters in text must be escaped.

### PPT Compatibility Rules

- `<g opacity="...">` is forbidden; set opacity on each child.
- Inline attributes only.
- Use product screenshots with `preserveAspectRatio="xMidYMid meet"` unless intentionally cropped.
