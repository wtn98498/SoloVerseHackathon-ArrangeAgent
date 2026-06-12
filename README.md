# PlayBand AI

音乐游乐场 - AI 编曲应用

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
