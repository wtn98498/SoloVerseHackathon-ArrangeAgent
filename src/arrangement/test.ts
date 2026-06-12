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
import { SeedPattern } from '../contracts';

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