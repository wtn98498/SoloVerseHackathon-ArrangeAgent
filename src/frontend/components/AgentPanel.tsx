import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { ArrangementProject, AgentExplanation } from '../../contracts';
import { createClip } from '../../contracts/clip';
import { completeArrangementEndpoint, energyEndpoint } from '../../backend';
import { INSTRUMENT_THEME } from '../theme';
import { sendChat, type ChatMessage } from '../llm/chat';
import { classifyAgentIntent } from '../../arrangement/agentIntent';
import { getArrangementReference } from '../../arrangement/reference';
import { audioEngine } from '../audio/AudioEngine';

interface AgentResponse {
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: 'deepseek' | 'fallback';
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: '你好！我是 PlayBand AI 的编曲助手。\n敲一段律动，或告诉我你想要的风格；我会先给你试听，满意后再放进编曲。',
};

export function AgentPanel() {
  const { project, setProject, seedPattern, ui, setUi } = useEditor();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastSource, setLastSource] = useState<'deepseek' | 'fallback' | null>(null);
  const [preview, setPreview] = useState<AgentResponse | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading]);

  const pushAssistant = (content: string) =>
    setMessages((m) => [...m, { role: 'assistant', content }]);

  const setCandidate = (data: AgentResponse) => {
    audioEngine.stopSequence();
    setPreviewPlaying(false);
    setPreview(data);
    setLastSource(data.source);
    pushAssistant(`先给你一版试听：${data.explanation.summary}`);
  };

  /* ── Music actions (still mutate the project, now also narrated in chat) ── */
  const handleComplete = async () => {
    if (!seedPattern || !project) return;
    setActionLoading(true);
    try {
      const data: AgentResponse = await completeArrangementEndpoint({
        seed: seedPattern,
        currentProject: project,
      });
      setCandidate(data);
    } catch {
      const fallbackProject = generateFallbackComplete(seedPattern);
      setCandidate({
        project: fallbackProject,
        explanation: fallbackProject.lastExplanation ?? {
          summary: '已使用本地备用编曲方案',
          changes: ['基于你的输入生成了鼓、贝斯、吉他、键盘四轨'],
        },
        source: 'fallback',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnergy = async (direction: 'increase' | 'soften') => {
    const baseProject = preview?.project ?? project;
    if (!baseProject) return;
    setActionLoading(true);
    try {
      const data: AgentResponse = await energyEndpoint({ project: baseProject, direction });
      setCandidate(data);
    } catch {
      const fallbackProject = generateFallbackEnergy(baseProject, direction);
      setCandidate({
        project: fallbackProject,
        explanation: fallbackProject.lastExplanation ?? {
          summary: direction === 'increase' ? '已增加能量' : '已柔和化',
          changes: [direction === 'increase' ? '提高了速度和音量' : '降低了速度和音量'],
        },
        source: 'fallback',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewPlay = async () => {
    if (!preview) return;
    if (previewPlaying) {
      audioEngine.stopSequence();
      setPreviewPlaying(false);
      return;
    }
    await audioEngine.initialize();
    audioEngine.setTempo(preview.project.tempo);
    audioEngine.playProject(preview.project, 0, null);
    setPreviewPlaying(true);
  };

  const handleApplyPreview = () => {
    if (!preview) return;
    audioEngine.stopSequence();
    setPreviewPlaying(false);
    setProject(preview.project);
    setLastSource(preview.source);
    pushAssistant(`已放进编曲：${preview.explanation.changes.join('、')}`);
    setPreview(null);
  };

  const handleDiscardPreview = () => {
    audioEngine.stopSequence();
    setPreviewPlaying(false);
    setPreview(null);
    pushAssistant('好的，这版先不要。');
  };

  /* ── Free-form chat with the LLM (via dev proxy) ── */
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || chatLoading) return;
    setDraft('');
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    const intent = classifyAgentIntent(text);
    if (intent.kind === 'off_topic') {
      setMessages((m) => [...m, { role: 'assistant', content: intent.reply }]);
      return;
    }
    if (intent.kind === 'needs_clarification') {
      setMessages((m) => [...m, { role: 'assistant', content: intent.questions.join('\n') }]);
      return;
    }
    if (intent.kind === 'transform' && project) {
      setChatLoading(true);
      try {
        const baseProject = preview?.project ?? project;
        const data: AgentResponse = await energyEndpoint({ project: baseProject, direction: intent.direction });
        setCandidate({
          ...data,
          explanation: {
            summary: intent.direction === 'increase' ? '按你的意思，让它更快更有能量。' : '按你的意思，让它更慢更柔和。',
            changes: data.explanation.changes,
          },
        });
      } catch {
        const baseProject = preview?.project ?? project;
        const fallbackProject = generateFallbackEnergy(baseProject, intent.direction);
        setCandidate({
          project: fallbackProject,
          explanation: fallbackProject.lastExplanation ?? {
            summary: intent.direction === 'increase' ? '已用本地方案让它更快更有能量。' : '已用本地方案让它更慢更柔和。',
            changes: [intent.direction === 'increase' ? '提高了速度和音量' : '降低了速度和音量'],
          },
          source: 'fallback',
        });
      } finally {
        setChatLoading(false);
      }
      return;
    }
    if (intent.kind === 'compose' && project) {
      setChatLoading(true);
      try {
        const reference = await getArrangementReference(intent.style, intent.mood, intent.referenceQuery);
        const seed = seedPattern ?? {
          sourceTrackKind: 'keys' as const,
          capturedAt: new Date().toISOString(),
          notes: [],
          drumHits: [],
          style: intent.style,
          mood: intent.mood,
          tempo: reference.tempoHint ?? project.tempo,
        };
        const data: AgentResponse = await completeArrangementEndpoint({
          seed: { ...seed, style: intent.style, mood: intent.mood, tempo: reference.tempoHint ?? seed.tempo },
          currentProject: project,
        });
        setCandidate({
          ...data,
          explanation: {
            summary: `${intent.safetyNote ? `${intent.safetyNote} ` : ''}${data.explanation.summary}。参考：${reference.summary}`,
            changes: [...data.explanation.changes, ...reference.grooveHints.slice(0, 2)],
          },
        });
      } catch {
        setMessages((m) => [...m, { role: 'assistant', content: '生成时出了点问题，但动作按钮仍可用。' }]);
      } finally {
        setChatLoading(false);
      }
      return;
    }

    setChatLoading(true);
    const res = await sendChat(next);
    setChatLoading(false);
    if (res.ok) {
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } else {
      setMessages((m) => [...m, { role: 'assistant', content: `（${res.error}，暂时离线。音乐动作按钮仍可用。）` }]);
    }
  };

  const close = () => setUi({ ...ui, showAgentPanel: false });

  return (
    <div className="agent-panel" role="complementary" aria-label="AI 编曲助手">
      {/* Header */}
      <div className="agent-header">
        <h3>
          <span className="material-symbols-outlined" aria-hidden>auto_awesome</span>
          AI 助手
        </h3>
        {lastSource && (
          <span className={`source-badge ${lastSource}`}>
            {lastSource === 'deepseek' ? 'AI' : '本地方案'}
          </span>
        )}
        <button className="agent-close" onClick={close} aria-label="收起助手" title="收起">
          <span className="material-symbols-outlined" aria-hidden>chevron_right</span>
        </button>
      </div>

      {/* Music action buttons */}
      <div className="agent-actions">
        <button
          className="agent-action-button complete"
          onClick={handleComplete}
          disabled={!seedPattern || actionLoading}
          aria-label="补全编曲"
        >
          <span className="material-symbols-outlined" aria-hidden>auto_awesome</span>
          {actionLoading ? '处理中…' : '补全编曲'}
        </button>
        <button
          className="agent-action-button energy"
          onClick={() => handleEnergy('increase')}
          disabled={!project || actionLoading}
          aria-label="更有能量"
        >
          <span className="material-symbols-outlined" aria-hidden>bolt</span>
          更有能量
        </button>
        <button
          className="agent-action-button soften"
          onClick={() => handleEnergy('soften')}
          disabled={!project || actionLoading}
          aria-label="更柔和"
        >
          <span className="material-symbols-outlined" aria-hidden>waves</span>
          更柔和
        </button>
      </div>

      {preview && (
        <div className="agent-preview-card">
          <div className="agent-preview-head">
            <span className="material-symbols-outlined" aria-hidden>graphic_eq</span>
            <div>
              <strong>试听版本</strong>
              <span>{preview.project.style} · {preview.project.mood} · {preview.project.tempo} BPM</span>
            </div>
          </div>
          <p>{preview.explanation.summary}</p>
          <div className="agent-preview-actions">
            <button onClick={handlePreviewPlay} className="preview-btn listen">
              <span className="material-symbols-outlined" aria-hidden>{previewPlaying ? 'stop' : 'play_arrow'}</span>
              {previewPlaying ? '停止' : '试听'}
            </button>
            <button onClick={handleApplyPreview} className="preview-btn apply">
              <span className="material-symbols-outlined" aria-hidden>library_add_check</span>
              放进编曲
            </button>
            <button onClick={handleComplete} className="preview-btn retry" disabled={actionLoading || !seedPattern}>
              <span className="material-symbols-outlined" aria-hidden>autorenew</span>
              再来
            </button>
            <button onClick={handleDiscardPreview} className="preview-btn discard">
              <span className="material-symbols-outlined" aria-hidden>close</span>
              不要
            </button>
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="chat-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.role === 'assistant' && (
              <span className="chat-avatar material-symbols-outlined" aria-hidden>smart_toy</span>
            )}
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {chatLoading && (
          <div className="chat-msg assistant">
            <span className="chat-avatar material-symbols-outlined" aria-hidden>smart_toy</span>
            <div className="chat-bubble typing">正在思考…</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="agent-input">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="问点什么，比如“怎么让节奏更有劲”…"
          aria-label="向 AI 发送消息"
        />
        <button className="send-btn" onClick={handleSend} disabled={chatLoading || !draft.trim()} aria-label="发送">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>send</span>
        </button>
      </div>
      <div className="agent-online">
        <span className="dot" />
        {chatLoading ? '思考中…' : '在线 · 可聊天'}
      </div>
    </div>
  );
}

/* ── Fallback generators for demo safety ── */
function generateFallbackComplete(seed: any): ArrangementProject {
  return {
    id: `project-${Date.now()}`,
    title: '新生成的编曲',
    tempo: seed.tempo,
    bars: 8,
    beatsPerBar: 4,
    subdivision: 4,
    style: seed.style,
    mood: seed.mood,
    tracks: [
      {
        id: 'track-drums',
        kind: 'drums',
        name: 'Drums',
        color: INSTRUMENT_THEME.drums.color,
        muted: false,
        clips: [createClip({
          id: 'clip-drums',
          kind: 'drum',
          name: 'Drums MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [],
          drumHits: Array.from({ length: 16 }, (_, i) => ({
            id: `dh-${i}`,
            drum: ['kick', 'snare', 'hihat', 'clap'][i % 4] as any,
            step: i * 8,
            velocity: 0.7,
          })),
        })],
      },
      {
        id: 'track-bass',
        kind: 'bass',
        name: 'Bass',
        color: INSTRUMENT_THEME.bass.color,
        muted: false,
        clips: [createClip({
          id: 'clip-bass',
          kind: 'midi',
          name: 'Bass MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'bn-1', pitch: 'C2', step: 0, durationSteps: 16, velocity: 0.7 },
            { id: 'bn-2', pitch: 'G2', step: 32, durationSteps: 16, velocity: 0.7 },
            { id: 'bn-3', pitch: 'A2', step: 64, durationSteps: 16, velocity: 0.7 },
            { id: 'bn-4', pitch: 'F2', step: 96, durationSteps: 16, velocity: 0.7 },
          ],
          drumHits: [],
        })],
      },
      {
        id: 'track-guitar',
        kind: 'guitar',
        name: 'Guitar',
        color: INSTRUMENT_THEME.guitar.color,
        muted: false,
        clips: [createClip({
          id: 'clip-guitar',
          kind: 'midi',
          name: 'Guitar MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'gn-1', pitch: 'C3', step: 0, durationSteps: 32, velocity: 0.6 },
            { id: 'gn-2', pitch: 'E3', step: 32, durationSteps: 32, velocity: 0.6 },
            { id: 'gn-3', pitch: 'G3', step: 64, durationSteps: 32, velocity: 0.6 },
            { id: 'gn-4', pitch: 'C3', step: 96, durationSteps: 32, velocity: 0.6 },
          ],
          drumHits: [],
        })],
      },
      {
        id: 'track-keys',
        kind: 'keys',
        name: 'Keys',
        color: INSTRUMENT_THEME.keys.color,
        muted: false,
        clips: [createClip({
          id: 'clip-keys',
          kind: 'midi',
          name: 'Keys MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'kn-1', pitch: 'C4', step: 0, durationSteps: 64, velocity: 0.5 },
            { id: 'kn-2', pitch: 'G4', step: 64, durationSteps: 64, velocity: 0.5 },
          ],
          drumHits: [],
        })],
      },
    ],
    lastExplanation: {
      summary: '已使用本地备用编曲方案',
      changes: ['基于你的输入生成了完整编曲', '添加了鼓点、贝斯、吉他和键盘轨道'],
    },
  };
}

function generateFallbackEnergy(
  project: ArrangementProject,
  direction: 'increase' | 'soften'
): ArrangementProject {
  const delta = direction === 'increase' ? 10 : -10;
  return {
    ...project,
    tempo: Math.max(60, Math.min(200, project.tempo + delta)),
    lastExplanation: {
      summary: direction === 'increase' ? '已增加能量' : '已柔和化',
      changes: [direction === 'increase' ? '提高了速度和音量' : '降低了速度和音量'],
    },
  };
}
