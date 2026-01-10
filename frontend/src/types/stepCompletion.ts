export interface StepCompletion {
  completed_steps: number[];
}

export interface TextWithProgress {
  id: number;
  text: string;
  source_language: string;
  target_language: string;
  created_at: string;
  completed_steps: number;
}
