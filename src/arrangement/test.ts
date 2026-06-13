/**
 * Simple inline test for arrangement functions
 * This can be run directly to verify functionality
 */

import {
  generateArrangement,
  completeArrangement,
  increaseEnergyAction,
  softenArrangementAction
} from './index';
import { ArrangementProject, SeedPattern } from '../contracts';
import { validateArrangementProject } from '../backend/validation/arrangement';

// Helper function to calculate average energy
function calculateEnergy(project: any): number {
  let totalVelocity = 0;
  let totalEvents = 0;

  project.tracks.forEach((track: any) => {
    track.clips.forEach((clip: any) => {
      clip.drumHits.forEach((hit: any) => {
        totalVelocity += hit.velocity;
        totalEvents++;
      });
      clip.notes.forEach((note: any) => {
        totalVelocity += note.velocity;
        totalEvents++;
      });
    });
  });

  return totalEvents > 0 ? totalVelocity / totalEvents : 0;
}

// Basic validation function
function validateProject(project: any, label: string): boolean {
  console.log(`\n=== ${label} ===`);
  console.log(`ID: ${project.id}`);
  console.log(`Style: ${project.style}, Mood: ${project.mood}`);
  console.log(`Tempo: ${project.tempo}`);
  console.log(`Bars: ${project.bars}`);
  console.log(`Tracks: ${project.tracks.length}`);

  if (project.bars !== 8) {
    console.error('❌ Wrong bar count');
    return false;
  }

  if (project.tracks.length !== 4) {
    console.error('❌ Wrong track count');
    return false;
  }

  const trackKinds = project.tracks.map((t: any) => t.kind);
  const requiredKinds = ['drums', 'bass', 'guitar', 'keys'];

  for (const kind of requiredKinds) {
    if (!trackKinds.includes(kind)) {
      console.error(`❌ Missing ${kind} track`);
      return false;
    }
  }

  console.log('✅ Valid structure');
  return true;
}

function assertPitchesInThreeOctaves(project: ArrangementProject, label: string): boolean {
  const invalidPitches = project.tracks.flatMap(track => track.clips.flatMap(clip =>
    clip.notes
      .filter(note => !/^[A-G][2-4]$/.test(note.pitch))
      .map(note => `${track.kind}:${note.pitch}`)
  ));

  if (invalidPitches.length > 0) {
    console.error(`❌ ${label} has notes outside C2-B4: ${invalidPitches.join(', ')}`);
    return false;
  }

  console.log(`✅ ${label} stays within C2-B4`);
  return true;
}

// Run basic tests
export async function runBasicTests() {
  console.log('🚀 Running Basic Arrangement Tests');

  try {
    // Test 1: Generate basic arrangements
    console.log('\n🧪 TEST 1: Generate arrangements for different styles');
    const styles = [
      ['pop', 'bright'],
      ['lofi', 'soft'],
      ['rock', 'energetic']
    ];

    for (const [style, mood] of styles) {
      const project = generateArrangement({}, style as any, mood as any);
      if (!validateProject(project, `${style}-${mood} arrangement`)) {
        return false;
      }
      if (!assertPitchesInThreeOctaves(project, `${style}-${mood} arrangement`)) {
        return false;
      }
    }

    // Test 2: Complete arrangement from seed
    console.log('\n🧪 TEST 2: Complete arrangement from seed');
    const seed: Partial<SeedPattern> = {
      sourceTrackKind: 'drums',
      capturedAt: new Date().toISOString(),
      drumHits: [{ id: 'test-1', drum: 'kick', step: 0, velocity: 0.8 }],
      notes: [],
      style: 'pop',
      mood: 'bright',
      tempo: 120
    };

    const completeResult = await completeArrangement(seed);
    console.log(`   Source: ${completeResult.source}`);
    console.log(`   Summary: ${completeResult.explanation.summary}`);

    if (!validateProject(completeResult.project, 'Complete arrangement')) {
      return false;
    }

    if (!assertPitchesInThreeOctaves(completeResult.project, 'Complete arrangement')) {
      return false;
    }

    // Test 2b: Reject pitches outside the MVP piano-roll range
    console.log('\n🧪 TEST 2b: Reject out-of-range piano-roll notes');
    const invalidProject: ArrangementProject = JSON.parse(JSON.stringify(completeResult.project));
    const pitchedTrack = invalidProject.tracks.find(track => track.kind !== 'drums');
    const pitchedClip = pitchedTrack?.clips[0];
    if (!pitchedClip) {
      console.error('❌ Missing pitched clip for validation test');
      return false;
    }
    pitchedClip.notes.push({
      id: 'invalid-high-note',
      pitch: 'C5',
      step: 0,
      durationSteps: 4,
      velocity: 0.7,
    });

    const validationErrors = validateArrangementProject(invalidProject);
    if (!validationErrors.some(error => error.path.endsWith('.pitch'))) {
      console.error('❌ Out-of-range note pitch was not rejected');
      return false;
    }
    console.log('✅ Out-of-range note pitch rejected');

    // Test 3: Increase energy
    console.log('\n🧪 TEST 3: Increase energy');
    const baseProject = generateArrangement({}, 'pop', 'soft');
    const baseEnergy = calculateEnergy(baseProject);

    const increasedResult = await increaseEnergyAction(baseProject);
    const increasedEnergy = calculateEnergy(increasedResult.project);

    console.log(`   Base energy: ${baseEnergy.toFixed(3)}`);
    console.log(`   Increased energy: ${increasedEnergy.toFixed(3)}`);
    console.log(`   Summary: ${increasedResult.explanation.summary}`);

    if (increasedEnergy <= baseEnergy) {
      console.error('❌ Energy did not increase');
      return false;
    }

    // Test 4: Soften arrangement
    console.log('\n🧪 TEST 4: Soften arrangement');
    const rockProject = generateArrangement({}, 'rock', 'energetic');
    const rockEnergy = calculateEnergy(rockProject);

    const softenedResult = await softenArrangementAction(rockProject);
    const softenedEnergy = calculateEnergy(softenedResult.project);

    console.log(`   Base energy: ${rockEnergy.toFixed(3)}`);
    console.log(`   Softened energy: ${softenedEnergy.toFixed(3)}`);
    console.log(`   Summary: ${softenedResult.explanation.summary}`);

    if (softenedEnergy >= rockEnergy) {
      console.error('❌ Energy did not decrease');
      return false;
    }

    console.log('\n🎉 All basic tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Tests failed:', error);
    return false;
  }
}

// Export for use in other contexts
export default { runBasicTests, calculateEnergy, validateProject };
