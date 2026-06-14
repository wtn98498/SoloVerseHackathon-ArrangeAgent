/**
 * Browser chat client. Talks to the Vite dev proxy at /llm/* which forwards to
 * DeepSeek and injects the API key server-side — so the key never reaches the
 * client bundle and there is no CORS problem.
 *
 * Returns a discriminated union so callers can render a friendly fallback
 * (demo safety: the UI must keep working even if the model is unreachable).
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT =
  '你是 PlayBand AI 的音乐编曲助手，只服务这个应用里的编曲、风格、乐器、试听和修改。' +
  '如果用户聊天气、百科、代码、人生建议或其他项目外话题，简短拒答并把话题拉回编曲。' +
  '如果用户只说很宽泛的风格，例如“爵士音乐”，先反问 1 到 2 个问题来限定情绪和用途。' +
  '用简洁、友好、口语化的中文回答，不要输出 JSON 或代码块。每次回答控制在 3 句以内。';

const TIMEOUT_MS = 20000;

export async function sendChat(history: ChatMessage[]): Promise<ChatResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('/llm/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
        temperature: 0.7,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, error: `服务返回 ${res.status}` };
    }

    const data = await res.json();
    const reply: string | undefined = data?.choices?.[0]?.message?.content;
    if (!reply || !reply.trim()) {
      return { ok: false, error: '空回复' };
    }
    return { ok: true, reply: reply.trim() };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: '请求超时' };
    }
    return { ok: false, error: err instanceof Error ? err.message : '请求失败' };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
