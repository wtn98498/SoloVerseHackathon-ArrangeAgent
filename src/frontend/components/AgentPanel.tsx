import { useState } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { ArrangementProject, AgentExplanation } from '../../contracts';
import { completeArrangementEndpoint, energyEndpoint } from '../../backend';

interface AgentResponse {
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: 'deepseek' | 'fallback';
}

const STYLE_LABELS: Record<string, string> = {
  pop: 'Pop',
  lofi: 'Lo-fi',
  rock: 'Rock',
};

export function AgentPanel() {
  const { project, setProject, seedPattern } = useEditor();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!seedPattern || !project) return;
    setIsLoading(true);
    setError(null);

    try {
      const data: AgentResponse = await completeArrangementEndpoint({
        seed: seedPattern,
        currentProject: project,
      });
      setProject(data.project);
      setLastResponse(data);
    } catch {
      setError('无法连接服务器，已使用本地备用方案');
      const fallbackProject = generateFallbackComplete(seedPattern);
      const fallbackResponse: AgentResponse = {
        project: fallbackProject,
        explanation: {
          summary: '已使用本地备用编曲方案',
          changes: ['基于你的输入生成了完整编曲', '添加了鼓点、贝斯、吉他和键盘轨道'],
        },
        source: 'fallback',
      };
      setProject(fallbackResponse.project);
      setLastResponse(fallbackResponse);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnergy = async (direction: 'increase' | 'soften') => {
    if (!project) return;
    setIsLoading(true);
    setError(null);

    try {
      const data: AgentResponse = await energyEndpoint({ project, direction });
      setProject(data.project);
      setLastResponse(data);
    } catch {
      setError('无法连接服务器，已使用本地备用方案');
      const fallbackProject = generateFallbackEnergy(project, direction);
      const fallbackResponse: AgentResponse = {
        project: fallbackProject,
        explanation: {
          summary: direction === 'increase' ? '已增加能量' : '已柔和化',
          changes: [direction === 'increase' ? '提高了速度和音量' : '降低了速度和音量'],
        },
        source: 'fallback',
      };
      setProject(fallbackResponse.project);
      setLastResponse(fallbackResponse);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="agent-panel" role="complementary" aria-label="AI 编曲助手">
      {/* Header */}
      <div className="agent-header">
        <h3>AI 助手</h3>
        {lastResponse && (
          <span className={`source-badge ${lastResponse.source}`}>
            {lastResponse.source === 'deepseek' ? 'AI' : '本地方案'}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="agent-actions">
        <button
          className="agent-action-button complete"
          onClick={handleComplete}
          disabled={!seedPattern || isLoading}
          aria-label="补全编曲"
        >
          {isLoading ? '处理中…' : '✨ 补全编曲'}
        </button>

        <button
          className="agent-action-button energy"
          onClick={() => handleEnergy('increase')}
          disabled={!project || isLoading}
          aria-label="更有能量"
        >
          {isLoading ? '处理中…' : '🔥 更有能量'}
        </button>

        <button
          className="agent-action-button soften"
          onClick={() => handleEnergy('soften')}
          disabled={!project || isLoading}
          aria-label="更柔和"
        >
          {isLoading ? '处理中…' : '🌊 更柔和'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="agent-warning" role="alert">
          {error}
        </div>
      )}

      {/* Explanation */}
      {lastResponse && (
        <div className="agent-explanation">
          <h4>最近操作</h4>
          <p className="explanation-summary">{lastResponse.explanation.summary}</p>
          <ul className="explanation-changes">
            {lastResponse.explanation.changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Status footer */}
      <div className="agent-status">
        <div className="status-item">
          <span className="status-label">状态</span>
          <span className="status-value">
            {project ? (isLoading ? '生成中' : '就绪') : '等待输入'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">速度</span>
          <span className="status-value">{project?.tempo ?? 120} BPM</span>
        </div>
        <div className="status-item">
          <span className="status-label">风格</span>
          <span className="status-value">
            {project ? (STYLE_LABELS[project.style] ?? project.style) : '–'}
          </span>
        </div>
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
        color: '#FF5E5B',
        muted: false,
        clips: [{
          id: 'clip-drums',
          barStart: 0,
          barLength: 8,
          notes: [],
          drumHits: Array.from({ length: 16 }, (_, i) => ({
            id: `dh-${i}`,
            drum: ['kick', 'snare', 'hihat', 'clap'][i % 4] as any,
            step: i * 8,
            velocity: 0.7,
          })),
        }],
      },
      {
        id: 'track-bass',
        kind: 'bass',
        name: 'Bass',
        color: '#00B4A0',
        muted: false,
        clips: [{
          id: 'clip-bass',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'bn-1', pitch: 'C2', step: 0, durationSteps: 16, velocity: 0.7 },
            { id: 'bn-2', pitch: 'G2', step: 32, durationSteps: 16, velocity: 0.7 },
            { id: 'bn-3', pitch: 'A2', step: 64, durationSteps: 16, velocity: 0.7 },
            { id: 'bn-4', pitch: 'F2', step: 96, durationSteps: 16, velocity: 0.7 },
          ],
          drumHits: [],
        }],
      },
      {
        id: 'track-guitar',
        kind: 'guitar',
        name: 'Guitar',
        color: '#FFBE0B',
        muted: false,
        clips: [{
          id: 'clip-guitar',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'gn-1', pitch: 'C3', step: 0, durationSteps: 32, velocity: 0.6 },
            { id: 'gn-2', pitch: 'E3', step: 32, durationSteps: 32, velocity: 0.6 },
            { id: 'gn-3', pitch: 'G3', step: 64, durationSteps: 32, velocity: 0.6 },
            { id: 'gn-4', pitch: 'C3', step: 96, durationSteps: 32, velocity: 0.6 },
          ],
          drumHits: [],
        }],
      },
      {
        id: 'track-keys',
        kind: 'keys',
        name: 'Keys',
        color: '#8338EC',
        muted: false,
        clips: [{
          id: 'clip-keys',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'kn-1', pitch: 'C4', step: 0, durationSteps: 64, velocity: 0.5 },
            { id: 'kn-2', pitch: 'G4', step: 64, durationSteps: 64, velocity: 0.5 },
          ],
          drumHits: [],
        }],
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
