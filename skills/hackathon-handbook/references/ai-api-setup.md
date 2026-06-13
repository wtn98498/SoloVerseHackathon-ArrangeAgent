# AI API 配置（Next.js）

按用户选的 provider 套用。核心原则不变：**key 放环境变量、服务端调用、上线时在 Vercel 同步填一遍。** 优先用赞助商指定/赠额度的 provider。

## 通用步骤

1. 项目根目录建 `.env.local`（开发用，不提交）：
   ```
   OPENAI_API_KEY=sk-...
   # 或 ANTHROPIC_API_KEY=sk-ant-...
   ```
2. 确认 `.gitignore` 含 `.env*`（`create-next-app` 默认已含）。**别把 key 推到 GitHub。**
3. 在服务端 route handler 里调用，前端只 fetch 自己的 `/api/...`，key 不进浏览器。
4. 上线：Vercel 项目 → Settings → Environment Variables 填同样的 key → Deployments 里 Redeploy。

## 拿 key 的地方

- OpenAI：platform.openai.com → API keys。
- Anthropic：console.anthropic.com → API keys。
- 赞助商自有模型 / 网关：找比赛页面或赞助商发的文档，通常给一个 base_url + key，多数兼容 OpenAI 格式（把 baseURL 换掉即可）。
- 额度：黑客松常有赞助商免费额度 / 赠金，先问主办方，别自己烧钱。

## 示例 A：OpenAI（或任何 OpenAI 兼容网关）

```bash
npm install openai
```

`app/api/generate/route.ts`：
```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // 赞助商网关：baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return Response.json({ text: r.choices[0].message.content });
}
```

## 示例 B：Anthropic

```bash
npm install @anthropic-ai/sdk
```

`app/api/generate/route.ts`：
```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const msg = await client.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.map((b: any) => b.text ?? "").join("");
  return Response.json({ text });
}
```

## 前端调用（两个示例通用）

```tsx
async function run(prompt: string) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const { text } = await res.json();
  return text;
}
```

## demo 常见坑

- **本地能跑、线上 500**：八成是 Vercel 没填环境变量，或填了没 Redeploy。
- **额度耗尽 / 报 429**：演示前留 buffer，关键路径可以预生成一份结果兜底，别现场翻车。
- **key 泄露**：只在 route handler 用 `process.env`，绝不写进客户端组件或 `NEXT_PUBLIC_` 变量。
- **延迟太长**：demo 用更快的小模型（如 `gpt-4o-mini` / haiku），或加 loading 动画把等待变成体验的一部分。
