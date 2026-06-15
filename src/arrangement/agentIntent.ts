import { MoodId, StyleId } from '../contracts';

export type AgentIntent =
  | { kind: 'off_topic'; reply: string }
  | { kind: 'needs_clarification'; questions: string[] }
  | { kind: 'transform'; direction: 'increase' | 'soften'; prompt: string }
  | { kind: 'compose'; style: StyleId; mood: MoodId; prompt: string; referenceQuery?: string; safetyNote?: string };

const MUSIC_DOMAIN_TERMS = [
  '编曲', '音乐', '歌', '歌曲', '作曲', '创作', '谱', '写一段', '来段', '做一段', '做个',
  '旋律', '和弦', '和声', '调性', '音阶', '音高', '音符', '根音', '主音', '复调',
  '鼓', '鼓组', '鼓点', '贝斯', '吉他', '键盘', '钢琴', '合成器', 'pad', 'riff', '扫弦',
  '节奏', '律动', 'groove', '拍', '拍子', '切分', '反拍', '摇摆', 'swing', 'trap',
  '前奏', '开头', '开场', '主歌', '副歌', '桥段', '间奏', '尾奏', 'drop', 'hook', '抓耳',
  'loop', 'midi', 'clip', '轨', '音轨', '小节', 'bpm', '速度', '量化', '试听',
  'jazz', '爵士', 'blues', '蓝调', 'rock', '摇滚', 'pop', '流行', 'lofi', 'r&b', 'funk', '电子',
  '更有能量', '更柔和', '生成', '改编', '风格', '快', '慢', '快一点', '慢一点', '再快', '再次快',
  '有劲', '柔和', '松弛', '热闹', '短视频', '背景', '氛围', '舞台感',
];

const BROAD_COMPOSE_TERMS = ['爵士', 'jazz', '摇滚', 'rock', '流行', 'pop', 'lofi', '音乐', '编曲'];
const COMPOSE_SCENE_TERMS = ['开场', '开头', '前奏', 'intro', '背景', '主歌', '副歌', 'loop', '短视频', '晚上', '散步'];

export function classifyAgentIntent(text: string): AgentIntent {
  const prompt = text.trim();
  const lower = prompt.toLowerCase();

  if (!isMusicRelated(lower)) {
    return {
      kind: 'off_topic',
      reply: '我只能帮你处理 PlayBand AI 里的编曲、风格、乐器和试听修改。我们可以从一段 loop 开始。',
    };
  }

  const style = inferStyle(lower);
  const mood = inferMood(lower);
  const artistSafePrompt = rewriteLivingArtistStyle(prompt);
  const safePrompt = artistSafePrompt.prompt;
  const hasSpecificComposeTarget = hasExplicitStyle(lower) || COMPOSE_SCENE_TERMS.some((term) => lower.includes(term));
  const transformDirection = inferTransformDirection(lower);
  if (transformDirection && !hasSpecificComposeTarget) {
    return {
      kind: 'transform',
      direction: transformDirection,
      prompt: safePrompt,
    };
  }

  const isBroad =
    safePrompt.length < 18 &&
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
    prompt: safePrompt,
    referenceQuery: buildReferenceQuery(safePrompt, style, mood),
    safetyNote: artistSafePrompt.safetyNote,
  };
}

function isMusicRelated(lower: string): boolean {
  return MUSIC_DOMAIN_TERMS.some((term) => lower.includes(term.toLowerCase()));
}

function inferStyle(lower: string): StyleId {
  if (lower.includes('lofi') || lower.includes('lo-fi')) return 'lofi';
  if (lower.includes('rock') || lower.includes('摇滚')) return 'rock';
  return 'pop';
}

function inferMood(lower: string): MoodId {
  if (lower.includes('柔和') || lower.includes('轻松') || lower.includes('松弛') || lower.includes('晚上') || lower.includes('散步') || lower.includes('soft')) return 'soft';
  if (lower.includes('高能') || lower.includes('热闹') || lower.includes('有劲') || lower.includes('能量') || lower.includes('开场') || lower.includes('intro') || lower.includes('energetic')) return 'energetic';
  return 'bright';
}

function hasExplicitStyle(lower: string): boolean {
  return ['lofi', 'lo-fi', 'rock', '摇滚', 'pop', '流行', '爵士', 'jazz', '蓝调', 'blues', 'funk', 'r&b'].some((term) => lower.includes(term));
}

function rewriteLivingArtistStyle(prompt: string): { prompt: string; safetyNote?: string } {
  if (!prompt.includes('周杰伦')) {
    return { prompt };
  }
  return {
    prompt: prompt.replace(
      /周杰伦风格|周杰伦的风格|像周杰伦|周杰伦/gu,
      '华语流行/R&B 质感、爵士和声、切分律动',
    ),
    safetyNote: '我不能直接模仿在世艺人的个人风格，已改成更宽泛的华语流行/R&B 与爵士编曲特征。',
  };
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
