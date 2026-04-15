export enum TestPart {
  PART_1 = 'Part 1',
  PART_2 = 'Part 2',
  PART_3 = 'Part 3',
  FULL_TEST = 'Full Test'
}

export interface Question {
  id: string;
  text: string;
  part: 1 | 2 | 3;
  topic?: string;
}

export interface Part2CueCard extends Question {
  prompts: string[];
}

export interface TestSession {
  mode: TestPart;
  currentPart: 1 | 2 | 3;
  questions: Question[];
  currentQuestionIndex: number;
  recordings: { [questionId: string]: string }; // base64 audio
  transcripts: { [questionId: string]: string };
}

export interface EvaluationResult {
  scores: {
    fc: number; // Fluency and Coherence
    lr: number; // Lexical Resource
    gra: number; // Grammatical Range and Accuracy
    p: number; // Pronunciation
  };
  overall: number;
  feedback: {
    fc: string;
    lr: string;
    gra: string;
    p: string;
    general: string;
  };
}

export interface HistoryItem {
  id: string;
  date: string;
  mode: TestPart;
  overall: number;
}
