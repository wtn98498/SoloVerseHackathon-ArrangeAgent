import { MoodId, StyleId } from '../contracts';

export interface ArrangementReference {
  summary: string;
  tempoHint?: number;
  grooveHints: string[];
  instrumentHints: string[];
  source: 'local' | 'web';
}

const LOCAL_REFERENCES: Record<StyleId, Record<MoodId, ArrangementReference>> = {
  pop: {
    bright: {
      summary: '明亮流行 loop，鼓点清楚，贝斯跟根音，键盘给短促和弦。',
      tempoHint: 120,
      grooveHints: ['four-on-the-floor hint', 'clean backbeat', 'short upbeat keys'],
      instrumentHints: ['drums lead the pulse', 'bass follows roots', 'guitar adds simple strums', 'keys add bright chords'],
      source: 'local',
    },
    soft: {
      summary: '柔和流行 loop，减少镲片密度，贝斯更长，键盘像铺垫。',
      tempoHint: 96,
      grooveHints: ['half-time feel', 'light backbeat', 'more space'],
      instrumentHints: ['soft drums', 'sustained bass', 'muted guitar', 'warm keys'],
      source: 'local',
    },
    energetic: {
      summary: '高能流行 loop，鼓和贝斯更密，吉他/键盘做短音型。',
      tempoHint: 132,
      grooveHints: ['strong downbeat', 'extra hats', 'syncopated accents'],
      instrumentHints: ['punchy drums', 'active bass', 'rhythmic guitar', 'staccato keys'],
      source: 'local',
    },
  },
  lofi: {
    bright: {
      summary: '明亮 lo-fi loop，节奏松弛但不拖，键盘保持温暖和弦。',
      tempoHint: 88,
      grooveHints: ['laid-back swing', 'soft snare', 'simple hats'],
      instrumentHints: ['dusty drums', 'round bass', 'sparse guitar', 'warm keys'],
      source: 'local',
    },
    soft: {
      summary: '柔和 lo-fi loop，慢速、留白、长音和弦。',
      tempoHint: 82,
      grooveHints: ['lazy pocket', 'minimal hats', 'wide space'],
      instrumentHints: ['quiet drums', 'long bass notes', 'small guitar answers', 'pad-like keys'],
      source: 'local',
    },
    energetic: {
      summary: '偏有动感的 lo-fi loop，保持松弛但增加切分。',
      tempoHint: 94,
      grooveHints: ['swung hats', 'snare backbeat', 'light syncopation'],
      instrumentHints: ['textured drums', 'moving bass', 'short guitar chops', 'syncopated keys'],
      source: 'local',
    },
  },
  rock: {
    bright: {
      summary: '明亮摇滚 loop，鼓稳定，吉他扫弦突出。',
      tempoHint: 124,
      grooveHints: ['straight eighths', 'clear backbeat', 'open chorus feel'],
      instrumentHints: ['solid drums', 'root bass', 'steady guitar', 'support keys'],
      source: 'local',
    },
    soft: {
      summary: '柔和摇滚 loop，像主歌铺垫，动态更低。',
      tempoHint: 104,
      grooveHints: ['restrained backbeat', 'less hats', 'verse pocket'],
      instrumentHints: ['controlled drums', 'long bass', 'muted guitar', 'simple keys'],
      source: 'local',
    },
    energetic: {
      summary: '高能摇滚 loop，鼓点更密，贝斯和吉他更咬合。',
      tempoHint: 144,
      grooveHints: ['driving eighths', 'strong snare', 'extra kick pushes'],
      instrumentHints: ['loud drums', 'driving bass', 'repeated guitar hits', 'percussive keys'],
      source: 'local',
    },
  },
};

export async function getArrangementReference(
  style: StyleId,
  mood: MoodId,
  _query?: string,
): Promise<ArrangementReference> {
  // Hook for a future web-search implementation. The demo path deliberately
  // stays local-first so a missing network/search key never blocks generation.
  return LOCAL_REFERENCES[style][mood];
}
