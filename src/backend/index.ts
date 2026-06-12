// Main backend service exports
// These can be imported directly by frontend during hackathon

export { completeArrangementEndpoint, energyEndpoint } from './services/arrangement';

// Validation utilities (exported for testing)
export { validateSeedPattern, validateArrangementProject } from './validation/arrangement';

export type { ValidationError } from './validation/arrangement';
