import { ArrangementProject, SeedPattern, AgentExplanation } from '../contracts';
import { generateArrangement } from './generators';
import { increaseEnergy, softenArrangement, explainChanges } from './transformers';

export type AgentAction = 'complete' | 'increase' | 'soften';

export interface AgentInput {
  action: AgentAction;
  seed?: Partial<SeedPattern>;
  project?: ArrangementProject;
  direction?: 'increase' | 'soften';
}

export interface AgentOutput {
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: 'deepseek' | 'fallback';
}

/**
 * Main arrangement agent orchestrator
 * For MVP, this uses deterministic fallback generation
 * DeepSeek integration would be added here in future versions
 */
export async function runArrangementAgent(input: AgentInput): Promise<AgentOutput> {
  let project: ArrangementProject;
  let explanation: AgentExplanation;
  let source: 'deepseek' | 'fallback' = 'fallback';

  switch (input.action) {
    case 'complete': {
      if (!input.seed) {
        throw new Error('Seed pattern required for complete action');
      }

      const style = input.seed.style || 'pop';
      const mood = input.seed.mood || 'bright';

      project = generateArrangement(input.seed, style, mood);
      explanation = {
        summary: `根据你的输入生成了 ${style} 风格的 ${mood} 编曲`,
        changes: [
          '创建了 8 小节编曲',
          '添加了鼓、贝斯、吉他和键盘四个音轨',
          '基于你的输入风格配置了和弦进行'
        ]
      };
      break;
    }

    case 'increase': {
      if (!input.project) {
        throw new Error('Project required for increase action');
      }

      const beforeProject = JSON.parse(JSON.stringify(input.project));
      project = increaseEnergy(input.project);
      explanation = explainChanges(beforeProject, project);
      break;
    }

    case 'soften': {
      if (!input.project) {
        throw new Error('Project required for soften action');
      }

      const beforeProject = JSON.parse(JSON.stringify(input.project));
      project = softenArrangement(input.project);
      explanation = explainChanges(beforeProject, project);
      break;
    }

    default:
      throw new Error(`Unknown action: ${input.action}`);
  }

  return {
    project,
    explanation,
    source
  };
}

/**
 * Wrapper functions for specific actions
 * These match the tool names specified in the brief
 */
export async function completeArrangement(
  seed: Partial<SeedPattern>,
  style?: 'pop' | 'lofi' | 'rock',
  mood?: 'bright' | 'soft' | 'energetic'
): Promise<AgentOutput> {
  const enhancedSeed = {
    ...seed,
    style: style || seed.style || 'pop',
    mood: mood || seed.mood || 'bright'
  };

  return runArrangementAgent({
    action: 'complete',
    seed: enhancedSeed
  });
}

export async function increaseEnergyAction(project: ArrangementProject): Promise<AgentOutput> {
  return runArrangementAgent({
    action: 'increase',
    project
  });
}

export async function softenArrangementAction(project: ArrangementProject): Promise<AgentOutput> {
  return runArrangementAgent({
    action: 'soften',
    project
  });
}