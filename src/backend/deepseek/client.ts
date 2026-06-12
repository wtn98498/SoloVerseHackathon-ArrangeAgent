export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse<T> {
  success: true;
  data: T;
}

export interface DeepSeekError {
  success: false;
  error: string;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';
const TIMEOUT_MS = 15000; // 15 second timeout for demo safety

export async function callDeepSeekJson<T>(messages: DeepSeekMessage[]): Promise<DeepSeekResponse<T> | DeepSeekError> {
  const apiKey = typeof process !== 'undefined' ? process.env.DEEPSEEK_API_KEY : undefined;

  if (!apiKey) {
    return {
      success: false,
      error: 'DEEPSEEK_API_KEY not configured'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a music arrangement assistant. Always respond with valid JSON only. No markdown, no code blocks, no explanations outside the JSON.'
          },
          ...messages
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `DeepSeek API error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: 'Empty response from DeepSeek'
      };
    }

    let parsed: T;
    try {
      parsed = JSON.parse(content) as T;
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse DeepSeek response as JSON'
      };
    }

    return {
      success: true,
      data: parsed
    };

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'DeepSeek request timeout'
        };
      }
      return {
        success: false,
        error: `DeepSeek request failed: ${error.message}`
      };
    }
    return {
      success: false,
      error: 'Unknown DeepSeek error'
    };
  }
}
