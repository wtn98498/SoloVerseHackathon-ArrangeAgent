# PlayBand AI

音乐游乐场 - AI 编曲应用。

PlayBand AI 面向不会 DAW、但想玩音乐的人：用户先用鼓 pad 或按键玩出一个
seed，Agent 再把它扩成一段可听、可见的 8 小节乐队 loop。

MVP 采用 lightweight MIDI-like JSON 作为底层编曲数据。界面可以有 MIDI 卷帘味道，
但本项目不是完整 DAW，也不做完整 MIDI 编辑器。

## 当前方向

- Demo 核心：play seed -> complete arrangement -> increase/soften energy。
- 底层：`ArrangementProject` / `Track` / `Clip` / `NoteEvent` / `DrumHit`。
- 视觉参考：two-moons / MoaRoll 的卷帘质感，只借鉴不接入。
- 不接入：openDAW、GridSound DAW 或其他大型 DAW 子系统。
- 安全线：没有 `DEEPSEEK_API_KEY` 时仍然走 deterministic fallback。

## 项目结构

### 核心文件夹所有权

- `src/contracts/` - 共享数据契约和 API 类型定义
- `src/fixtures/` - 测试数据和演示项目
- `src/frontend/` - 前端组件和 UI (Frontend Agent 负责)
- `src/backend/` - 后端 API 和服务 (App Backend Agent 负责)
- `src/arrangement/` - 编曲生成逻辑 (Arrangement Agent 负责)

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 构建生产版本
npm run build
```

## 环境变量

复制 `.env.example` 到 `.env` 并配置：

```
DEEPSEEK_API_KEY=your_api_key_here
```

## 技术栈

- React + TypeScript + Vite
- Tone.js (音频引擎)
- DeepSeek (AI 编曲)

## 开发规则

- 每个 Agent 只编辑自己负责的文件夹
- 如需修改共享契约，先更新 `src/contracts/`
- 提交前运行 `npm run typecheck`
- 使用中文提交信息
