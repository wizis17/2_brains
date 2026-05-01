export interface Doc {
  name: string;
  content: string;
  size: number;
  addedAt: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Lesson {
  id: string;
  name: string;
  createdAt: number;
  docs: Doc[];
  chat: ChatMessage[];
}

export interface StudyBrainStore {
  lessons: Record<string, Lesson>;
}
