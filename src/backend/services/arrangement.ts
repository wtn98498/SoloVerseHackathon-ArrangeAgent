import { CompleteArrangeRequest, CompleteArrangeResponse, EnergyArrangeRequest, EnergyArrangeResponse } from '../../contracts/api';
import { validateSeedPattern, validateArrangementProject } from '../validation/arrangement';
import { completeArrangementWithDeepSeek, energyWithDeepSeek } from './deepseekArrangement';

export async function completeArrangementEndpoint(request: CompleteArrangeRequest): Promise<CompleteArrangeResponse> {
  // Validate request
  const validationErrors = validateSeedPattern(request.seed);
  if (validationErrors.length > 0) {
    console.warn('Seed validation errors:', validationErrors);
  }

  const { project, explanation } = await completeArrangementWithDeepSeek(request.seed, request.currentProject);
  const deepSeekErrors = validateArrangementProject(project);
  if (deepSeekErrors.length > 0) {
    console.error('DeepSeek arrangement validation errors:', deepSeekErrors);
    throw new Error('DeepSeek arrangement failed validation');
  }

  return {
    project,
    explanation,
    source: 'deepseek'
  };
}

export async function energyEndpoint(request: EnergyArrangeRequest): Promise<EnergyArrangeResponse> {
  // Validate request project
  const validationErrors = validateArrangementProject(request.project);
  if (validationErrors.length > 0) {
    console.warn('Project validation errors:', validationErrors);
  }

  const { project, explanation } = await energyWithDeepSeek(request.project, request.direction);
  const deepSeekErrors = validateArrangementProject(project);
  if (deepSeekErrors.length > 0) {
    console.error('DeepSeek energy validation errors:', deepSeekErrors);
    throw new Error('DeepSeek energy transform failed validation');
  }

  return {
    project,
    explanation,
    source: 'deepseek'
  };
}
