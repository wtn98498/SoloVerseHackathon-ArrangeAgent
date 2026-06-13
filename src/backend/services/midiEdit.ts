import { AgentExplanation, ArrangementProject, MidiEdit, NoteEvent } from '../../contracts';
import { MidiEditResponse } from '../../contracts/api';
import { validateArrangementProject } from '../validation/arrangement';

const MAX_STEP = 127;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampNote(note: NoteEvent): NoteEvent {
  return {
    ...note,
    step: clamp(Math.round(note.step), 0, MAX_STEP),
    durationSteps: Math.max(1, Math.round(note.durationSteps)),
    velocity: clamp(note.velocity, 0, 1),
  };
}

export async function applyMidiEdits(
  project: ArrangementProject,
  edits: MidiEdit[],
): Promise<MidiEditResponse> {
  const nextProject = structuredClone(project);
  const applied: string[] = [];

  for (const edit of edits) {
    const track = nextProject.tracks.find(item => item.id === edit.trackId);
    const clip = track?.clips.find(item => item.id === edit.clipId);
    if (!track || !clip) continue;

    if (edit.type === 'add_note' && edit.note) {
      clip.notes.push(clampNote(edit.note));
      applied.push('添加 MIDI 音符');
    }

    if (edit.type === 'remove_note' && edit.noteId) {
      clip.notes = clip.notes.filter(note => note.id !== edit.noteId);
      applied.push('删除 MIDI 音符');
    }

    if (edit.type === 'move_note' && edit.noteId && edit.step !== undefined) {
      clip.notes = clip.notes.map(note => note.id === edit.noteId
        ? clampNote({ ...note, step: edit.step ?? note.step })
        : note);
      applied.push('移动 MIDI 音符');
    }

    if (edit.type === 'resize_note' && edit.noteId && edit.durationSteps !== undefined) {
      clip.notes = clip.notes.map(note => note.id === edit.noteId
        ? clampNote({ ...note, durationSteps: edit.durationSteps ?? note.durationSteps })
        : note);
      applied.push('调整 MIDI 音符长度');
    }

    if (edit.type === 'set_velocity' && edit.noteId && edit.velocity !== undefined) {
      clip.notes = clip.notes.map(note => note.id === edit.noteId
        ? clampNote({ ...note, velocity: edit.velocity ?? note.velocity })
        : note);
      applied.push('调整 MIDI 力度');
    }
  }

  const errors = validateArrangementProject(nextProject);
  if (errors.length > 0) {
    const explanation: AgentExplanation = {
      summary: 'MIDI 编辑未应用',
      changes: ['编辑结果未通过校验，已保留原工程'],
    };

    return { project, explanation, source: 'local' };
  }

  return {
    project: nextProject,
    explanation: {
      summary: applied.length > 0 ? '已更新 MIDI 片段' : '没有可应用的 MIDI 编辑',
      changes: applied.length > 0 ? Array.from(new Set(applied)) : ['未找到目标音符或片段'],
    },
    source: 'local',
  };
}
