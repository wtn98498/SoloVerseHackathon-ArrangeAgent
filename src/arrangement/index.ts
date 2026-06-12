// Main arrangement agent exports
export {
  runArrangementAgent,
  completeArrangement,
  increaseEnergyAction,
  softenArrangementAction,
  type AgentInput,
  type AgentOutput,
  type AgentAction
} from './agent';

// Core generators
export {
  generateArrangement,
  generateDrumHits,
  generateBassline,
  generateGuitarPart,
  generateKeysPart,
  generateId
} from './generators';

// Transformers
export {
  increaseEnergy,
  softenArrangement,
  explainChanges
} from './transformers';

// Music rules and constants
export {
  CHORD_PROGRESSIONS,
  DRUM_PATTERNS,
  BASE_VELOCITIES,
  ENERGY_INCREASE_MULTIPLIER,
  SOFTEN_MULTIPLIER,
  getChordProgression,
  getDrumPattern,
  getRootPitch
} from './music-rules';