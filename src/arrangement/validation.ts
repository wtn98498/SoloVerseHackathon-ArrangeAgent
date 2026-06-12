import {
  completeArrangement,
  increaseEnergyAction,
  softenArrangementAction,
  generateArrangement
} from './index';
import { ArrangementProject, SeedPattern, StyleId, MoodId } from '../contracts';

/**
 * Simple validation tests for the arrangement system
 * These are basic self-checks to ensure the system produces valid output
 */

function validateProject(project: ArrangementProject, label: string): boolean {
  console.log(`\n=== Validating ${label} ===`);

  // Check structure
  if (!project.id || !project.title) {
    console.error('❌ Missing id or title');
    return false;
  }

  if (project.tempo < 60 || project.tempo > 200) {
    console.error('❌ Invalid tempo:', project.tempo);
    return false;
  }

  if (project.bars !== 8) {
    console.error('❌ Wrong bar count:', project.bars);
    return false;
  }

  if (project.tracks.length !== 4) {
    console.error('❌ Wrong track count:', project.tracks.length);
    return false;
  }

  // Check each track
  const requiredKinds = ['drums', 'bass', 'guitar', 'keys'];
  for (const kind of requiredKinds) {
    const track = project.tracks.find(t => t.kind === kind);
    if (!track) {
      console.error(`❌ Missing ${kind} track`);
      return false;
    }

    if (track.clips.length === 0) {
      console.error(`❌ ${kind} track has no clips`);
      return false;
    }

    // Validate steps are within 0-127
    track.clips.forEach(clip => {
      clip.notes.forEach(note => {
        if (note.step < 0 || note.step > 127) {
          console.error(`❌ ${kind} note out of range:`, note.step);
          return false;
        }
        if (note.velocity < 0 || note.velocity > 1) {
          console.error(`❌ ${kind} note invalid velocity:`, note.velocity);
          return false;
        }
      });

      clip.drumHits.forEach(hit => {
        if (hit.step < 0 || hit.step > 127) {
          console.error(`❌ ${kind} drum hit out of range:`, hit.step);
          return false;
        }
        if (hit.velocity < 0 || hit.velocity > 1) {
          console.error(`❌ ${kind} drum hit invalid velocity:`, hit.velocity);
          return false;
        }
      });
    });
  }

  console.log(`✅ ${label} is valid`);
  console.log(`   - Style: ${project.style}, Mood: ${project.mood}`);
  console.log(`   - Tempo: ${project.tempo}`);
  console.log(`   - Tracks: ${project.tracks.length}`);

  return true;
}

// Test 1: Complete arrangement from seed
async function testCompleteArrangement() {
  console.log('\n🧪 TEST 1: Complete Arrangement');

  const seed: Partial<SeedPattern> = {
    sourceTrackKind: 'drums',
    capturedAt: new Date().toISOString(),
    drumHits: [
      { id: 'test-1', drum: 'kick', step: 0, velocity: 0.8 }
    ],
    notes: [],
    style: 'pop',
    mood: 'bright',
    tempo: 120
  };

  const result = await completeArrangement(seed);
  console.log(`Source: ${result.source}`);
  console.log(`Summary: ${result.explanation.summary}`);

  return validateProject(result.project, 'Complete Arrangement');
}

// Test 2: Increase energy
async function testIncreaseEnergy() {
  console.log('\n🧪 TEST 2: Increase Energy');

  const baseProject = generateArrangement({
    style: 'pop',
    tempo: 120
  }, 'pop', 'soft');

  const result = await increaseEnergyAction(baseProject);
  console.log(`Summary: ${result.explanation.summary}`);

  // Check that energy actually increased
  const baseEnergy = calculateAverageEnergy(baseProject);
  const newEnergy = calculateAverageEnergy(result.project);

  console.log(`Base energy: ${baseEnergy.toFixed(3)}`);
  console.log(`New energy: ${newEnergy.toFixed(3)}`);

  if (newEnergy <= baseEnergy) {
    console.error('❌ Energy did not increase');
    return false;
  }

  return validateProject(result.project, 'Increased Energy Arrangement');
}

// Test 3: Soften arrangement
async function testSoftenArrangement() {
  console.log('\n🧪 TEST 3: Soften Arrangement');

  const baseProject = generateArrangement({
    style: 'rock',
    tempo: 140
  }, 'rock', 'energetic');

  const result = await softenArrangementAction(baseProject);
  console.log(`Summary: ${result.explanation.summary}`);

  // Check that energy actually decreased
  const baseEnergy = calculateAverageEnergy(baseProject);
  const newEnergy = calculateAverageEnergy(result.project);

  console.log(`Base energy: ${baseEnergy.toFixed(3)}`);
  console.log(`New energy: ${newEnergy.toFixed(3)}`);

  if (newEnergy >= baseEnergy) {
    console.error('❌ Energy did not decrease');
    return false;
  }

  return validateProject(result.project, 'Softened Arrangement');
}

// Test 4: Different style combinations
async function testStyleCombinations() {
  console.log('\n🧪 TEST 4: Style Combinations');

  const combinations: Array<[StyleId, MoodId]> = [
    ['pop', 'bright'],
    ['lofi', 'soft'],
    ['rock', 'energetic']
  ];

  for (const [style, mood] of combinations) {
    const project = generateArrangement({ style, tempo: 120 }, style, mood);
    if (!validateProject(project, `${style}-${mood} arrangement`)) {
      return false;
    }
  }

  return true;
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

// Run all tests
export async function runValidationTests(): Promise<boolean> {
  console.log('🚀 Starting Arrangement System Validation Tests');

  try {
    const test1 = await testCompleteArrangement();
    const test2 = await testIncreaseEnergy();
    const test3 = await testSoftenArrangement();
    const test4 = await testStyleCombinations();

    const allPassed = test1 && test2 && test3 && test4;

    console.log('\n🎯 FINAL RESULTS:');
    console.log(`   Test 1 (Complete): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Test 2 (Increase): ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Test 3 (Soften): ${test3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Test 4 (Styles): ${test4 ? '✅ PASS' : '❌ FAIL'}`);

    if (allPassed) {
      console.log('\n🎉 All validation tests passed!');
    } else {
      console.log('\n❌ Some validation tests failed');
    }

    return allPassed;
  } catch (error) {
    console.error('\n❌ Validation tests crashed:', error);
    return false;
  }
}

// Export a simple browser-friendly test runner
export function runBrowserValidation(): void {
  runValidationTests().then(success => {
    console.log(success ? 'All tests passed!' : 'Some tests failed!');
  });
}