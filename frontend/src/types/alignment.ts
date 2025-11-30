export type AlignmentItem = {
  order: number;
  source: string;
  target: string;
  audio_url?: string;
  occurrence_count?: number;
};

export type AlignmentSentence = {
  id: number;
  source_sentence: string;
  target_sentence: string;
  audio_url?: string;
  items: AlignmentItem[];
};

export type AlignmentData = {
  source_language: string;
  target_language: string;
  original_text: string;
  translation_data: string;
  sentences: AlignmentSentence[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type StepConfig = {
  showTokens: boolean;
  showSource: boolean;
  showTarget: boolean | "conditional";
  showAudioBtn: boolean;
  audioBtnStyle?: React.CSSProperties;
  autoPlay: boolean;
  containerStyle?: React.CSSProperties;
  targetStyle?: React.CSSProperties;
  allowWordClick: boolean;
};
