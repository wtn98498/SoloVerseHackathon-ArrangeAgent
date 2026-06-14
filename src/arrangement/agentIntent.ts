import { MoodId, StyleId } from '../contracts';

export type AgentIntent =
  | { kind: 'off_topic'; reply: string }
  | { kind: 'needs_clarification'; questions: string[] }
  | { kind: 'transform'; direction: 'increase' | 'soften'; prompt: string }
  | { kind: 'compose'; style: StyleId; mood: MoodId; prompt: string; referenceQuery?: string };

const PROJECT_TERMS = [
  '编曲', '音乐', '旋律', '和弦', '鼓', '贝斯', '吉他', '键盘', '节奏', '律动',
  'loop', 'midi', 'jazz', '爵士', 'rock', '摇滚', 'pop', '流行', 'lofi',
  '更有能量', '更柔和', '试听', '生成', '改编', '风格', '快', '慢', '速度', 'bpm',
  '快一点', '慢一点', '再快', '再次快', '有劲', '柔和',
];

const BROAD_COMPOSE_TERMS = ['爵士', 'jazz', '摇滚', 'rock', '流行', 'pop', 'lofi', '音乐', '编曲'];

export function classifyAgentIntent(text: string): AgentIntent {
  const prompt = text.trim();
  const lower = prompt.toLowerCase();

  if (!PROJECT_TERMS.some((term) => lower.includes(term.toLowerCase()))) {
    return {
      kind: 'off_topic',
      reply: '我只能帮你处理 PlayBand AI 里的编曲、风格、乐器和试听修改。我们可以从一段 loop 开始。',
    };
  }

  const style = inferStyle(lower);
  const mood = inferMood(lower);
  const transformDirection = inferTransformDirection(lower);
  if (transformDirection) {
    return {
      kind: 'transform',
      direction: transformDirection,
      prompt,
    };
  }

  const isBroad =
    prompt.length < 18 &&
    BROAD_COMPOSE_TERMS.some((term) => lower.includes(term.toLowerCase())) &&
    !lower.includes('开场') &&
    !lower.includes('背景') &&
    !lower.includes('主歌') &&
    !lower.includes('副歌') &&
    !lower.includes('轻松') &&
    !lower.includes('热闹') &&
    !lower.includes('柔和') &&
    !lower.includes('有劲');

  if (isBroad) {
    return {
      kind: 'needs_clarification',
      questions: [
        '这段更想要轻松摇摆，还是更热闹有舞台感？',
        '它更像开场、主歌，还是可以一直循环的背景？',
      ],
    };
  }

  return {
    kind: 'compose',
    style,
    mood,
    prompt,
    referenceQuery: buildReferenceQuery(prompt, style, mood),
  };
}

function inferStyle(lower: string): StyleId {
  if (lower.includes('lofi') || lower.includes('lo-fi')) return 'lofi';
  if (lower.includes('rock') || lower.includes('摇滚')) return 'rock';
  return 'pop';
}

function inferMood(lower: string): MoodId {
  if (lower.includes('柔和') || lower.includes('轻松') || lower.includes('松弛') || lower.includes('soft')) return 'soft';
  if (lower.includes('热闹') || lower.includes('有劲') || lower.includes('能量') || lower.includes('energetic')) return 'energetic';
  return 'bright';
}

function inferTransformDirection(lower: string): 'increase' | 'soften' | null {
  if (
    lower.includes('快') ||
    lower.includes('提速') ||
    lower.includes('加速') ||
    lower.includes('有劲') ||
    lower.includes('更燃') ||
    lower.includes('更有能量') ||
    lower.includes('energ')
  ) {
    return 'increase';
  }
  if (
    lower.includes('慢') ||
    lower.includes('降速') ||
    lower.includes('柔和') ||
    lower.includes('轻一点') ||
    lower.includes('松弛') ||
    lower.includes('soft')
  ) {
    return 'soften';
  }
  return null;
}

function buildReferenceQuery(prompt: string, style: StyleId, mood: MoodId): string {
  return `PlayBand arrangement reference: ${prompt}; style=${style}; mood=${mood}; return tempo groove instrumentation hints only`;
}
