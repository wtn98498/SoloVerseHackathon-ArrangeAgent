import { completeArrangementEndpoint, energyEndpoint } from '../services/arrangement';
import { SeedPattern } from '../../contracts/index';

// Simple verification tests (can be run with node or ts-node)

const testSeed: SeedPattern = {
  sourceTrackKind: 'drums',
  capturedAt: new Date().toISOString(),
  notes: [],
  drumHits: [
    { id: 'test-1', drum: 'kick', step: 0, velocity: 0.8 },
    { id: 'test-2', drum: 'snare', step: 8, velocity: 0.7 }
  ],
  style: 'pop',
  mood: 'bright',
  tempo: 120
};

async function runTests() {
  console.log('🧪 Testing Backend Services...\n');

  // Test 1: Complete Arrangement
  console.log('Test 1: completeArrangementEndpoint');
  try {
    const result = await completeArrangementEndpoint({ seed: testSeed });
    console.log('✅ PASS: Returns valid response');
    console.log(`   - Project ID: ${result.project.id}`);
    console.log(`   - Tracks: ${result.project.tracks.length}`);
    console.log(`   - Source: ${result.source}`);
    console.log(`   - Summary: ${result.explanation.summary}\n`);
  } catch (error) {
    console.log('❌ FAIL:', error);
  }

  // Test 2: Energy Increase
  console.log('Test 2: energyEndpoint (increase)');
  try {
    const firstResult = await completeArrangementEndpoint({ seed: testSeed });
    const result = await energyEndpoint({
      project: firstResult.project,
      direction: 'increase'
    });
    console.log('✅ PASS: Returns valid response');
    console.log(`   - New mood: ${result.project.mood}`);
    console.log(`   - Source: ${result.source}`);
    console.log(`   - Summary: ${result.explanation.summary}\n`);
  } catch (error) {
    console.log('❌ FAIL:', error);
  }

  // Test 3: Energy Soften
  console.log('Test 3: energyEndpoint (soften)');
  try {
    const firstResult = await completeArrangementEndpoint({ seed: testSeed });
    const result = await energyEndpoint({
      project: firstResult.project,
      direction: 'soften'
    });
    console.log('✅ PASS: Returns valid response');
    console.log(`   - New mood: ${result.project.mood}`);
    console.log(`   - Source: ${result.source}`);
    console.log(`   - Summary: ${result.explanation.summary}\n`);
  } catch (error) {
    console.log('❌ FAIL:', error);
  }

  // Test 4: Validation - Check 4 tracks exist
  console.log('Test 4: Validation (4 required tracks)');
  try {
    const result = await completeArrangementEndpoint({ seed: testSeed });
    const trackKinds = result.project.tracks.map(t => t.kind);
    const hasAll = trackKinds.includes('drums') &&
                  trackKinds.includes('bass') &&
                  trackKinds.includes('guitar') &&
                  trackKinds.includes('keys');
    if (hasAll && result.project.tracks.length === 4) {
      console.log('✅ PASS: All 4 required tracks present');
      console.log(`   - Tracks: ${trackKinds.join(', ')}\n`);
    } else {
      console.log('❌ FAIL: Missing required tracks');
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
  }

  // Test 5: 8-bar / 128-step validation
  console.log('Test 5: Validation (8 bars / 128 steps)');
  try {
    const result = await completeArrangementEndpoint({ seed: testSeed });
    const validBars = result.project.bars === 8;
    const allNotesInRange = result.project.tracks.every(track =>
      track.clips.every(clip =>
        clip.notes.every(note => note.step >= 0 && note.step <= 127)
      )
    );
    if (validBars && allNotesInRange) {
      console.log('✅ PASS: 8 bars and all notes in 0-127 range');
      console.log(`   - Bars: ${result.project.bars}`);
      console.log(`   - Total notes: ${result.project.tracks.reduce((sum, t) => sum + t.clips.reduce((s, c) => s + c.notes.length, 0), 0)}\n`);
    } else {
      console.log('❌ FAIL: Validation failed');
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
  }

  console.log('✨ All tests completed!');
}

// Run tests
runTests().catch(console.error);
