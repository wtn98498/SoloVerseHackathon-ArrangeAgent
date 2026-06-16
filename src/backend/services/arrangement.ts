import { ArrangementProject, SeedPattern, AgentExplanation } from '../../contracts';
import { createClip } from '../../contracts/clip';
import { CompleteArrangeRequest, CompleteArrangeResponse, EnergyArrangeRequest, EnergyArrangeResponse } from '../../contracts/api';
import { validateSeedPattern, validateArrangementProject } from '../validation/arrangement';
import { generateFallbackArrangement, generateEnergyTransformation } from '../arrangement/fallback';
import { completeArrangementWithDeepSeek, energyWithDeepSeek } from './deepseekArrangement';

export async function completeArrangementEndpoint(request: CompleteArrangeRequest): Promise<CompleteArrangeResponse> {
  // Validate request
  const validationErrors = validateSeedPattern(request.seed);
  if (validationErrors.length > 0) {
    console.warn('Seed validation errors:', validationErrors);
  }

  try {
    const { project, explanation } = await completeArrangementWithDeepSeek(request.seed, request.currentProject);
    const deepSeekErrors = validateArrangementProject(project);
    if (deepSeekErrors.length === 0) {
      return {
        project,
        explanation,
        source: 'deepseek'
      };
    }
    console.warn('DeepSeek arrangement validation errors:', deepSeekErrors);
  } catch (error) {
    console.warn('DeepSeek arrangement failed, using fallback:', error);
  }

  const { project, explanation } = generateFallbackArrangement(request.seed);

  // Validate response
  const projectErrors = validateArrangementProject(project);
  if (projectErrors.length > 0) {
    console.error('Generated project validation errors:', projectErrors);
    // If validation fails, return a safe fallback
    return getSafeFallback(request.seed);
  }

  return {
    project,
    explanation,
    source: 'fallback'
  };
}

export async function energyEndpoint(request: EnergyArrangeRequest): Promise<EnergyArrangeResponse> {
  // Validate request project
  const validationErrors = validateArrangementProject(request.project);
  if (validationErrors.length > 0) {
    console.warn('Project validation errors:', validationErrors);
  }

  try {
    const { project, explanation } = await energyWithDeepSeek(request.project, request.direction);
    const deepSeekErrors = validateArrangementProject(project);
    if (deepSeekErrors.length === 0) {
      return {
        project,
        explanation,
        source: 'deepseek'
      };
    }
    console.warn('DeepSeek energy validation errors:', deepSeekErrors);
  } catch (error) {
    console.warn('DeepSeek energy failed, using fallback:', error);
  }

  const { project, explanation } = generateEnergyTransformation(request.project, request.direction);

  // Validate response
  const projectErrors = validateArrangementProject(project);
  if (projectErrors.length > 0) {
    console.error('Transformed project validation errors:', projectErrors);
    // Return original project if transformation breaks validation
    return {
      project: request.project,
      explanation: {
        summary: '保持原样（转换验证失败）',
        changes: []
      },
      source: 'fallback'
    };
  }

  return {
    project,
    explanation,
    source: 'fallback'
  };
}

function getSafeFallback(_seed: SeedPattern): CompleteArrangeResponse {
  // This should never happen, but it's a last-resort safety net
  const project: ArrangementProject = {
    id: 'safe-fallback',
    title: 'Safe Fallback',
    tempo: 120,
    bars: 8,
    beatsPerBar: 4,
    subdivision: 4,
    style: 'pop',
    mood: 'bright',
    tracks: [
      {
        id: 'track-drums',
        kind: 'drums',
        name: 'Drums',
        color: '#ff6b6b',
        muted: false,
        clips: [createClip({
          id: 'clip-drums',
          kind: 'drum',
          name: 'Drums MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [],
          drumHits: [
            { id: 'dh-1', drum: 'kick', step: 0, velocity: 0.8 },
            { id: 'dh-2', drum: 'snare', step: 8, velocity: 0.7 },
          ]
        })]
      },
      {
        id: 'track-bass',
        kind: 'bass',
        name: 'Bass',
        color: '#4ecdc4',
        muted: false,
        clips: [createClip({
          id: 'clip-bass',
          kind: 'midi',
          name: 'Bass MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'bn-1', pitch: 'C2', step: 0, durationSteps: 8, velocity: 0.7 }
          ],
          drumHits: []
        })]
      },
      {
        id: 'track-guitar',
        kind: 'guitar',
        name: 'Guitar',
        color: '#ffe66d',
        muted: false,
        clips: [createClip({
          id: 'clip-guitar',
          kind: 'midi',
          name: 'Guitar MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'gn-1', pitch: 'C3', step: 0, durationSteps: 16, velocity: 0.6 }
          ],
          drumHits: []
        })]
      },
      {
        id: 'track-keys',
        kind: 'keys',
        name: 'Keys',
        color: '#a8dadc',
        muted: false,
        clips: [createClip({
          id: 'clip-keys',
          kind: 'midi',
          name: 'Keys MIDI Clip',
          barStart: 0,
          barLength: 8,
          notes: [
            { id: 'kn-1', pitch: 'C4', step: 0, durationSteps: 32, velocity: 0.5 }
          ],
          drumHits: []
        })]
      }
    ],
    lastExplanation: undefined
  };

  const explanation: AgentExplanation = {
    summary: '使用安全回退方案',
    changes: ['生成了最小有效编曲']
  };

  return {
    project,
    explanation,
    source: 'fallback'
  };
}
