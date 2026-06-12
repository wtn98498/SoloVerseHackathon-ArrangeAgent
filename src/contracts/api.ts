import { ArrangementProject, SeedPattern, AgentExplanation } from './index';

export interface CompleteArrangeRequest {
  seed: SeedPattern;
  currentProject?: ArrangementProject;
}

export interface CompleteArrangeResponse {
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: "deepseek" | "fallback";
}

export interface EnergyArrangeRequest {
  project: ArrangementProject;
  direction: "increase" | "soften";
}

export interface EnergyArrangeResponse {
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: "deepseek" | "fallback";
}
