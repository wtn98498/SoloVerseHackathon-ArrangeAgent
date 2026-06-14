import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { ArrangementProject, AgentExplanation } from '../../contracts';
import { createClip } from '../../contracts/clip';
import { completeArrangementEndpoint, energyEndpoint } from '../../backend';
import { INSTRUMENT_THEME } from '../theme';
import { sendChat, type ChatMessage } from '../llm/chat';

interface AgentResponse {
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: 'deepseek' | 'fallback';
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: '你好！我是你的编曲助手 👋\n左侧选乐器敲 pad，再点「补全编曲」就能生成一段 loop；也可以直接在下面问我关于风格、乐器、编曲的问题。',
};

export function AgentPanel() {
  const { project, setProject, seedPattern, ui, setUi } = useEditor();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastSource, setLastSource] = useState<'deepseek' | 'fallback' | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading]);

  const pushAssistant = (content: string) =>
    setMessages((m) => [...m, { role: 'assistant', content }]);

  /* ── Music actions (still mutate the project, now also narrated in chat) ── */
  const handleComplete = async () => {
    if (!seedPattern || !project) return;
    setActionLoading(true);
    try {
      const data: AgentResponse = await completeArrangementEndpoint({
        seed: seedPattern,
        currentProject: project,
      });
      setProject(data.project);
      setLastSource(data.source);
      pushAssistant(`✨ ${data.explanation.summary}\n${data.explanation.changes.map((c) => '· ' + c).join('\n')}`);
    } catch {
      const fallbackProject = generateFallbackComplete(seedPattern);
      setProject(fallbackProject);
      setLastSource('fallback');
      pushAssistant('已使用本地备用编曲方案：基于你的输入生成了鼓、贝斯、吉他、键盘四轨。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnergy = async (direction: 'increase' | 'soften') => {
    if (!project) return;
    setActionLoading(true);
    try {
      const data: AgentResponse = await energyEndpoint({ project, direction });
      setProject(data.project);
      setLastSource(data.source);
      pushAssistant(`${direction === 'increase' ? '⚡' : '🌊'} ${data.explanation.summary}（${data.explanation.changes[0]}）`);
    } catch {
      const fallbackProject = generateFallbackEnergy(project, direction);
      setProject(fallbackProject);
      setLastSource('fallback');
      pushAssistant(direction === 'increase' ? '已增加能量：速度 +10 BPM。' : '已柔和化：速度 -10 BPM。');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Free-form chat with the LLM (via dev proxy) ── */
  const handleSend = async () => {
    const text = draft.trim();
    if (!text || chatLoading) return;
    setDraft('');
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
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
