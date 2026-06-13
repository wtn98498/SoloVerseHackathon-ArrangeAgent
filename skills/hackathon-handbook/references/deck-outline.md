# 路演 deck 逐页映射 + pptxgenjs 最小示例

## 逐页内容映射（从创意 skill 产出填进去）

| 页 | 标题 | 主体内容来源 | 视觉建议 |
|----|------|--------------|----------|
| 1 封面 | 项目名 | 电梯宣言（副标题）、队名 | 深底大标题，一个主色块 |
| 2 问题 | 一句话点出根问题 | 场景化叙事里的真人 + before 场景 | 一张冲击图 或 一个大数字（60–72pt） |
| 3 方案 | 我们怎么解决 | 解决方案一句话 + after 场景 | 产品示意 / 两栏 before→after |
| 4 Demo | 看它跑起来 | 时机A：mockup；时机B：截图+链接 | "记得住的瞬间"特写放大 |
| 5 技术/关联(可选) | 怎么做到的 | AI 能力、赞助商技术一句话 | 3 个图标行，别写架构图 |
| 6 影响力 | 还能走多远 | 衍生模式/人群/社会价值 | 大字一句话 + 留白 |
| 7 结尾 | 金句 | 回扣电梯宣言 + 链接/二维码 | 深底，呼应封面 |

原则：一页一个信息点；能用图就别用三行字；正文左对齐。

## pptxgenjs 最小示例（改内容即可）

```js
// make_deck.js —— node make_deck.js 生成 pitch.pptx
const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.defineLayout({ name: "W", width: 13.33, height: 7.5 });
p.layout = "W";

const NAVY = "1E2761", ICE = "CADCFC", WHITE = "FFFFFF", INK = "1A1A1A";

// 1 封面（深底）
let s = p.addSlide();
s.background = { color: NAVY };
s.addText("项目名", { x:0.7, y:2.6, w:11.9, h:1.2, fontFace:"Georgia", fontSize:54, bold:true, color:WHITE });
s.addText("一句话电梯宣言放这里，15 秒能讲完", { x:0.7, y:3.9, w:11.9, h:0.8, fontFace:"Calibri", fontSize:22, color:ICE });
s.addText("队名 / 作者", { x:0.7, y:6.4, w:6, h:0.5, fontSize:14, color:ICE });

// 2 问题（浅底，大数字）
s = p.addSlide(); s.background = { color: WHITE };
s.addText("老人有微信，却没人说话", { x:0.7, y:0.6, w:11.9, h:1, fontFace:"Georgia", fontSize:36, bold:true, color:INK, align:"left" });
s.addText("1.2 亿", { x:0.7, y:2.6, w:5, h:1.6, fontSize:96, bold:true, color:NAVY });
s.addText("独居老人，多数每天说不到几句话。\n这不是孤独，是被高速城市化甩下的结构性空巢。",
  { x:6, y:2.8, w:6.6, h:2, fontSize:16, color:INK, align:"left", lineSpacingMultiple:1.2 });

// 3 方案（两栏 before→after）
s = p.addSlide(); s.background = { color: WHITE };
s.addText("我们怎么解决", { x:0.7, y:0.6, w:11.9, h:1, fontFace:"Georgia", fontSize:36, bold:true, color:INK });
s.addText("一句话讲清方案，不要技术术语。", { x:0.7, y:1.7, w:11.9, h:0.6, fontSize:18, color:NAVY });
s.addShape(p.ShapeType.rect, { x:0.7, y:2.6, w:5.7, h:3.6, fill:{color:"F2F2F2"} });
s.addShape(p.ShapeType.rect, { x:6.9, y:2.6, w:5.7, h:3.6, fill:{color:ICE} });
s.addText("现在", { x:0.9, y:2.8, w:5, h:0.5, fontSize:14, bold:true, color:INK });
s.addText("用了之后", { x:7.1, y:2.8, w:5, h:0.5, fontSize:14, bold:true, color:NAVY });

// 4 Demo（截图占位 / mockup）
s = p.addSlide(); s.background = { color: WHITE };
s.addText("看它跑起来", { x:0.7, y:0.6, w:11.9, h:1, fontFace:"Georgia", fontSize:36, bold:true, color:INK });
// 时机B：把截图换成 s.addImage({ path:"shot.png", x:.., y:.., w:.., h:.. })
s.addShape(p.ShapeType.rect, { x:0.7, y:1.8, w:11.9, h:4.4, fill:{color:"ECECEC"}, line:{color:"CCCCCC", width:1} });
s.addText("[ 这里放 demo 截图 / 概念图 ]\n线上链接：your-project.vercel.app",
  { x:0.7, y:3.6, w:11.9, h:1, fontSize:18, color:"666666", align:"center" });

// 7 结尾（深底，呼应封面）
s = p.addSlide(); s.background = { color: NAVY };
s.addText("一句让评委投票时还记得的金句", { x:0.9, y:3, w:11.5, h:1.4, fontFace:"Georgia", fontSize:34, bold:true, color:WHITE });
s.addText("your-project.vercel.app · 联系方式", { x:0.9, y:5.2, w:11.5, h:0.6, fontSize:16, color:ICE });

p.writeFile({ fileName: "pitch.pptx" }).then(f => console.log("done:", f));
```

中间的"技术/关联"和"影响力"页按需照样式补。时间紧就只留封面/问题/方案/demo/结尾 5 页。

## 自查清单

- [ ] 封面副标题 = 那句 15 秒电梯宣言？
- [ ] 每页只有一个核心信息点，没堆字？
- [ ] 标题下没有误加装饰横线？
- [ ] 正文左对齐、只有标题居中？
- [ ] 配色是刻意选的、不是默认蓝？
- [ ] 时机 B：截图清晰、链接能点开？
- [ ] 导成图片逐页看过，无溢出/重叠/低对比？
