import { AgentAction, ArrangementProject, SeedPattern, AgentExplanation, MidiEdit } from './index';

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

export interface MidiEditRequest {
  project: ArrangementProject;
  edits: MidiEdit[];
}

export interface MidiEditResponse {
  project: ArrangementProject;
  explanation: AgentExplanation;
  source: "local";
}

export interface AgentActionRequest {
  action: AgentAction;
  project: ArrangementProject;
  seed?: SeedPattern;
  targetTrackId?: string;
  targetClipId?: string;
}
