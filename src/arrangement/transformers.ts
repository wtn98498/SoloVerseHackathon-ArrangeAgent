import { ArrangementProject, AgentExplanation, TrackKind } from '../contracts';
import { ENERGY_INCREASE_MULTIPLIER, SOFTEN_MULTIPLIER } from './music-rules';

// Increase energy by adding more notes and increasing velocity
export function increaseEnergy(project: ArrangementProject): ArrangementProject {
  const newProject = JSON.parse(JSON.stringify(project)) as ArrangementProject;

  newProject.tracks.forEach(track => {
    track.clips.forEach(clip => {
      // Increase velocities
      clip.drumHits.forEach(hit => {
        hit.velocity = Math.min(1, hit.velocity * ENERGY_INCREASE_MULTIPLIER);
      });

      clip.notes.forEach(note => {
        note.velocity = Math.min(1, note.velocity * ENERGY_INCREASE_MULTIPLIER);
      });

      // Add more notes/hits based on track type
      if (track.kind === 'drums') {
        // Add extra hi-hats
        const existingHiHats = clip.drumHits.filter(h => h.drum === 'hihat');
        const newHiHats = existingHiHats.map(h => ({
          ...h,
          id: `hh-extra-${Date.now()}-${Math.random()}`,
          step: (h.step + 2) % 128,
          velocity: h.velocity * 0.7
        }));
        clip.drumHits.push(...newHiHats);
      } else if (track.kind === 'bass') {
        // Add more bass notes
        const existingNotes = [...clip.notes];
        existingNotes.forEach(note => {
          if (note.durationSteps > 4) {
            clip.notes.push({
              ...note,
              id: `bass-extra-${Date.now()}-${Math.random()}`,
              step: (note.step + 8) % 128,
              durationSteps: Math.max(2, note.durationSteps / 2),
              velocity: note.velocity * 0.8
            });
          }
        });
      } else if (track.kind === 'guitar') {
        // Add more strums
        const existingNotes = [...clip.notes];
        existingNotes.forEach(note => {
          clip.notes.push({
            ...note,
            id: `guitar-extra-${Date.now()}-${Math.random()}`,
            step: (note.step + 2) % 128,
            durationSteps: Math.max(1, note.durationSteps / 2),
            velocity: note.velocity * 0.7
          });
        });
      } else if (track.kind === 'keys') {
        // Add more key textures
        const existingNotes = [...clip.notes];
        existingNotes.forEach(note => {
          if (note.durationSteps > 8) {
            clip.notes.push({
              ...note,
              id: `keys-extra-${Date.now()}-${Math.random()}`,
              step: (note.step + 4) % 128,
              durationSteps: note.durationSteps / 2,
              velocity: note.velocity * 0.8
            });
          }
        });
      }
    });
  });

  return newProject;
}

// Soften arrangement by reducing notes and velocities
export function softenArrangement(project: ArrangementProject): ArrangementProject {
  const newProject = JSON.parse(JSON.stringify(project)) as ArrangementProject;

  newProject.tracks.forEach(track => {
    track.clips.forEach(clip => {
      // Decrease velocities
      clip.drumHits.forEach(hit => {
        hit.velocity = hit.velocity * SOFTEN_MULTIPLIER;
      });

      clip.notes.forEach(note => {
        note.velocity = note.velocity * SOFTEN_MULTIPLIER;
      });

      // Remove some notes to soften
      if (track.kind === 'drums') {
        // Remove some hi-hats and claps
        clip.drumHits = clip.drumHits.filter(hit => {
          if (hit.drum === 'hihat' || hit.drum === 'clap') {
            return hit.step % 16 === 4;
          }
          return true;
        });
      } else if (track.kind === 'guitar' || track.kind === 'keys') {
        // Remove some notes to create space
        clip.notes = clip.notes.filter((note, index) => {
          if (note.durationSteps < 4) {
            return index % 2 === 0;
          }
          return true;
        });
      } else if (track.kind === 'bass') {
        // Lengthen notes for smoother feel
        clip.notes.forEach(note => {
          note.durationSteps = Math.min(16, note.durationSteps * 1.2);
        });
      }
    });
  });

  return newProject;
}

export function fillClip(project: ArrangementProject, targetClipId?: string): ArrangementProject {
  const newProject = JSON.parse(JSON.stringify(project)) as ArrangementProject;
  const targets = findTargetClips(newProject, targetClipId);

  targets.forEach(({ trackKind, clip }) => {
    if (trackKind === 'drums') {
      const existingSteps = new Set(clip.drumHits.map(hit => `${hit.drum}:${hit.step}`));
      for (let step = 0; step < 128; step += 8) {
        if (!existingSteps.has(`kick:${step}`)) {
          clip.drumHits.push({ id: `fill-kick-${step}`, drum: 'kick', step, velocity: 0.72 });
        }
        if (step % 16 === 8 && !existingSteps.has(`snare:${step}`)) {
          clip.drumHits.push({ id: `fill-snare-${step}`, drum: 'snare', step, velocity: 0.66 });
        }
      }
    } else {
      const pitch = defaultPitchForTrack(trackKind);
      const occupied = new Set(clip.notes.map(note => note.step));
      for (let step = 0; step < 128; step += 16) {
        if (!occupied.has(step)) {
          clip.notes.push({
            id: `fill-${trackKind}-${step}`,
            pitch,
            step,
            durationSteps: trackKind === 'bass' ? 8 : 12,
            velocity: trackKind === 'keys' ? 0.52 : 0.64,
          });
        }
      }
    }
  });

  return newProject;
}

export function createVariation(project: ArrangementProject, targetClipId?: string): ArrangementProject {
  const newProject = JSON.parse(JSON.stringify(project)) as ArrangementProject;
  const targets = findTargetClips(newProject, targetClipId);

  targets.forEach(({ trackKind, clip }) => {
    if (trackKind === 'drums') {
      clip.drumHits = clip.drumHits.map(hit => ({
        ...hit,
        velocity: Math.min(1, hit.velocity + (hit.step % 16 === 0 ? 0.08 : -0.03)),
      }));
      return;
    }

    clip.notes = clip.notes.map((note, index) => ({
      ...note,
      step: Math.min(127, note.step + (index % 2 === 0 ? 2 : 0)),
      velocity: Math.min(1, Math.max(0, note.velocity + (index % 2 === 0 ? 0.08 : -0.04))),
    }));
  });

  return newProject;
}

// Generate explanations for changes
export function explainChanges(before: ArrangementProject, after: ArrangementProject): AgentExplanation {
  const changes: string[] = [];

  // Compare overall energy
  const beforeEnergy = calculateAverageEnergy(before);
  const afterEnergy = calculateAverageEnergy(after);

  if (afterEnergy > beforeEnergy * 1.1) {
    changes.push('增加了鼓点和音符密度');
    changes.push('提高了整体力度');
    changes.push('添加了更多节奏元素');
  } else if (afterEnergy < beforeEnergy * 0.9) {
    changes.push('简化了节奏模式');
    changes.push('降低了整体力度');
    changes.push('增加了空间感');
  }

  // Compare track complexity
  before.tracks.forEach((track, index) => {
    const beforeNotes = countTrackNotes(track);
    const afterNotes = countTrackNotes(after.tracks[index]);

    if (afterNotes > beforeNotes * 1.2) {
      changes.push(`${track.name} 轨增加了音符数量`);
    } else if (afterNotes < beforeNotes * 0.8) {
      changes.push(`${track.name} 轨减少了音符，更简洁`);
    }
  });

  return {
    summary: afterEnergy > beforeEnergy ? '编曲更有能量了' : '编曲变得更柔和了',
    changes: changes.length > 0 ? changes : ['进行了微调']
  };
}

// Helper function to calculate average energy
function calculateAverageEnergy(project: ArrangementProject): number {
  let totalVelocity = 0;
  let totalEvents = 0;

  project.tracks.forEach(track => {
    track.clips.forEach(clip => {
      clip.drumHits.forEach(hit => {
        totalVelocity += hit.velocity;
        totalEvents++;
      });
      clip.notes.forEach(note => {
        totalVelocity += note.velocity;
        totalEvents++;
      });
    });
  });

  return totalEvents > 0 ? totalVelocity / totalEvents : 0;
}

// Helper function to count notes in a track
function countTrackNotes(track: { clips: Array<{ notes: Array<any>; drumHits: Array<any> }> }): number {
  let count = 0;
  track.clips.forEach(clip => {
    count += clip.notes.length + clip.drumHits.length;
  });
  return count;
}

function findTargetClips(project: ArrangementProject, targetClipId?: string) {
  return project.tracks.flatMap(track => track.clips
    .filter(clip => !targetClipId || clip.id === targetClipId)
    .map(clip => ({ trackKind: track.kind, clip })));
}

function defaultPitchForTrack(trackKind: TrackKind): string {
  if (trackKind === 'bass') return 'C2';
  if (trackKind === 'guitar') return 'C3';
  return 'C4';
}
