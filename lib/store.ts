import { StudyBrainStore, Lesson, Doc, ChatMessage } from "./types";

const STORAGE_KEY = "studybrain_v1";

function getDefaultStore(): StudyBrainStore {
  return { lessons: {} };
}

export function loadStore(): StudyBrainStore {
  if (typeof window === "undefined") return getDefaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultStore();
    return JSON.parse(raw) as StudyBrainStore;
  } catch {
    return getDefaultStore();
  }
}

export function saveStore(store: StudyBrainStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createLesson(name: string): Lesson {
  const store = loadStore();
  const id = crypto.randomUUID();
  const lesson: Lesson = {
    id,
    name,
    createdAt: Date.now(),
    docs: [],
    chat: [],
  };
  store.lessons[id] = lesson;
  saveStore(store);
  return lesson;
}

export function deleteLesson(id: string): void {
  const store = loadStore();
  delete store.lessons[id];
  saveStore(store);
}

export function addDoc(lessonId: string, doc: Doc): void {
  const store = loadStore();
  if (!store.lessons[lessonId]) return;
  store.lessons[lessonId].docs.push(doc);
  saveStore(store);
}

export function removeDoc(lessonId: string, docName: string): void {
  const store = loadStore();
  if (!store.lessons[lessonId]) return;
  store.lessons[lessonId].docs = store.lessons[lessonId].docs.filter(
    (d) => d.name !== docName
  );
  saveStore(store);
}

export function addMessage(lessonId: string, message: ChatMessage): void {
  const store = loadStore();
  if (!store.lessons[lessonId]) return;
  store.lessons[lessonId].chat.push(message);
  saveStore(store);
}

export function updateLastAssistantMessage(
  lessonId: string,
  content: string
): void {
  const store = loadStore();
  if (!store.lessons[lessonId]) return;
  const chat = store.lessons[lessonId].chat;
  for (let i = chat.length - 1; i >= 0; i--) {
    if (chat[i].role === "assistant") {
      chat[i].content = content;
      break;
    }
  }
  saveStore(store);
}

export function getLessons(): Lesson[] {
  const store = loadStore();
  return Object.values(store.lessons).sort((a, b) => b.createdAt - a.createdAt);
}

export function getLesson(id: string): Lesson | null {
  const store = loadStore();
  return store.lessons[id] ?? null;
}
