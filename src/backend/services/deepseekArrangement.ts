import { ArrangementProject, MoodId, SeedPattern, StyleId } from '../../contracts';
import { generateFallbackArrangement, generateEnergyTransformation } from '../arrangement/fallback';

export interface DeepSeekArrangementPlan {
  style?: StyleId;
  mood?: MoodId;
  tempo?: number;
  summary?: string;
  changes?: string[];
}

interface DeepSeekChatChoice {
  message?: {
    content?: string;
  };
}

interface DeepSeekChatResponse {
  choices?: DeepSeekChatChoice[];
}

export type DeepSeekTransport = (body: unknown) => Promise<DeepSeekChatResponse>;

const TIMEOUT_MS = 15000;
const DEFAULT_MODEL = 'deepseek-chat';

const VALID_STYLES: StyleId[] = ['pop', 'lofi', 'rock'];
const VALID_MOODS: MoodId[] = ['bright', 'soft', 'energetic'];

function browserTransport(body: unknown): Promise<DeepSeekChatResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  return fetch('/llm/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout)).then(async (response) => {
    if (!response.ok) {
      throw new Error(`DeepSeek returned ${response.status}`);
    }
    return response.json() as Promise<DeepSeekChatResponse>;
  });
}

export async function completeArrangementWithDeepSeek(
  seed: SeedPattern,
  currentProject?: ArrangementProject,
  transport: DeepSeekTransport = browserTransport
) {
  const plan = await requestPlan(
    [
      '你是 PlayBand AI 的编曲 Agent。根据用户 seed 选择一个可录 demo 的编曲计划。',
      '只返回 JSON：{"style":"pop|lofi|rock","mood":"bright|soft|energetic","tempo":number,"summary":string,"changes":string[]}',
      '不要输出 markdown。changes 用中文，2 到 4 条。必须保留用户 seed 的感觉。',
    ].join('\n'),
    {
      action: 'complete',
      seed,
      currentTempo: currentProject?.tempo,
      currentStyle: currentProject?.style,
      currentMood: currentProject?.mood,
    },
    transport
  );

  const style = normalizeStyle(plan.style, seed.style);
  const mood = normalizeMood(plan.mood, seed.mood);
  const tempo = normalizeTempo(plan.tempo, seed.tempo);
  const { project, explanation } = generateFallbackArrangement({ ...seed, style, mood, tempo });

  return {
    project: {
      ...project,
      title: `DeepSeek ${style} ${mood} arrangement`,
      lastExplanation: {
        summary: plan.summary?.trim() || explanation.summary,
        changes: normalizeChanges(plan.changes, explanation.changes),
      },
    },
    explanation: {
      summary: plan.summary?.trim() || explanation.summary,
      changes: normalizeChanges(plan.changes, explanation.changes),
    },
  };
}

export async function energyWithDeepSeek(
  project: ArrangementProject,
  direction: 'increase' | 'soften',
  transport: DeepSeekTransport = browserTransport
) {
  const plan = await requestPlan(
    [
      '你是 PlayBand AI 的编曲 Agent。根据用户要求给出能量变换计划。',
      '只返回 JSON：{"mood":"bright|soft|energetic","tempo":number,"summary":string,"changes":string[]}',
      'increase 需要更抓耳、更推进；soften 需要更留白、更柔和。不要输出 markdown。',
    ].join('\n'),
    {
      action: 'energy',
      direction,
      project: {
        tempo: project.tempo,
        style: project.style,
        mood: project.mood,
        trackCount: project.tracks.length,
      },
    },
    transport
  );

  const { project: transformed, explanation } = generateEnergyTransformation(project, direction);
  const tempo = normalizeTempo(plan.tempo, transformed.tempo);
  const mood = normalizeMood(plan.mood, transformed.mood);
  const deepseekExplanation = {
    summary: plan.summary?.trim() || explanation.summary,
    changes: normalizeChanges(plan.changes, explanation.changes),
  };

  return {
    project: {
      ...transformed,
      title: `DeepSeek ${direction} arrangement`,
      tempo,
      mood,
      lastExplanation: deepseekExplanation,
    },
    explanation: deepseekExplanation,
  };
}

async function requestPlan(system: string, payload: unknown, transport: DeepSeekTransport): Promise<DeepSeekArrangementPlan> {
  const response = await transport({
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(payload) },
    ],
    temperature: 0.7,
    stream: false,
    response_format: { type: 'json_object' },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek returned empty arrangement plan');
  }

  const parsed = JSON.parse(content) as DeepSeekArrangementPlan;
  return parsed;
}

function normalizeStyle(style: unknown, fallback: StyleId): StyleId {
  return VALID_STYLES.includes(style as StyleId) ? style as StyleId : fallback;
}

function normalizeMood(mood: unknown, fallback: MoodId): MoodId {
  return VALID_MOODS.includes(mood as MoodId) ? mood as MoodId : fallback;
}

function normalizeTempo(tempo: unknown, fallback: number): number {
  if (typeof tempo !== 'number' || Number.isNaN(tempo)) return fallback;
  return Math.max(60, Math.min(200, Math.round(tempo)));
}

function normalizeChanges(changes: unknown, fallback: string[]): string[] {
  if (!Array.isArray(changes)) return fallback;
  const normalized = changes
    .filter((change): change is string => typeof change === 'string' && change.trim().length > 0)
    .map((change) => change.trim())
    .slice(0, 4);
  return normalized.length > 0 ? normalized : fallback;
}
