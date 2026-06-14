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
  '你是 PlayBand AI 的音乐编曲助手，服务不懂乐理的普通用户。用简洁、友好、口语化的中文回答。' +
  '帮助用户理解风格、情绪、乐器、编曲思路。正常对话即可，不要输出 JSON 或代码块。每次回答控制在 3 句以内。';

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
