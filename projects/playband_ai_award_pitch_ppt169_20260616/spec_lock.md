# Execution Lock

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

## colors
- bg: #FFF7E8
- stage_bg: #24212B
- surface: #FFFFFF
- primary: #FF5A3D
- accent: #20C997
- secondary_accent: #FFD43B
- tertiary_accent: #5C7CFA
- text: #24212B
- reverse_text: #FFF7E8
- text_secondary: #6D6577
- border: #E7DCC7
- success: #20C997
- warning: #FF5A3D

## typography
- font_family: Arial, Microsoft YaHei, sans-serif
- title_family: Impact, Arial Black, SimHei, Microsoft YaHei, sans-serif
- emphasis_family: Arial Black, SimHei, Microsoft YaHei, sans-serif
- code_family: Consolas, Courier New, monospace
- body: 20
- title: 40
- subtitle: 28
- annotation: 15
- cover_title: 88
- hero: 64
- footnote: 12

## icons
- library: phosphor-duotone
- inventory: music-notes, cursor-click, magic-wand, robot, stack-simple, flow-arrow, play-circle, target, rocket-launch, users, code, waveform, lightning, brain, monitor-play, sliders-horizontal

## images
- product_hero: images/playband-ai-demo.png | no-crop
- start_screen: images/01-start.png | no-crop
- capture_seed: images/03-capture-seed.png | no-crop
- agent_candidate: images/05-agent-candidate.png | no-crop
- multiturn_agent: images/06-multiturn-agent.png | no-crop
- blank_studio: images/02-blank-studio.png | no-crop

## page_rhythm
- P01: anchor
- P02: anchor
- P03: dense
- P04: dense
- P05: breathing
- P06: dense
- P07: anchor
- P08: dense
- P09: anchor
- P10: anchor

## page_charts
- P07: process_flow
- P09: pipeline_with_stages

## forbidden
- Mixing icon libraries
- Gradient backgrounds
- rgba()
- `<linearGradient>`, `<radialGradient>`
- `<style>`, `class`, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<script>`, `<iframe>`, `<symbol>`+`<use>`
- `<g opacity>` (set opacity on each child element individually)
- HTML named entities in text; XML reserved chars must be escaped as `&amp; &lt; &gt; &quot; &apos;`
