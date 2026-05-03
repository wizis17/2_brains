# StudyBrain

StudyBrain is an AI-powered study web app where you create lessons, upload study files, and chat with an assistant that answers from your documents.

## Features

- Create and manage lesson-based study spaces
- Upload `.txt`, `.md`, and `.pdf` files
- Ask questions and get streamed AI responses
- Keep lesson docs and chat history saved locally in your browser
- Mobile-friendly sidebar and chat UI

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` and set your OpenRouter key:

```env
OPENROUTER_API_KEY=your_key_here
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## How to Use the Web App

1. Click **New Lesson** (or **Create Your First Lesson**) and enter a lesson name.
2. Open the lesson and click **Add notes** to upload files (`.txt`, `.md`, `.pdf`).
3. Type your question in chat and press **Enter** (or click **Send**).
4. Use suggestion chips like **Summarize** or **Key concepts** for quick prompts.
5. Remove docs or delete a lesson anytime from the UI.

## Notes

- Chat is enabled only after at least one document is uploaded.
- Lesson data is stored in browser `localStorage` (`studybrain_v1` key).
- The chat API is available at `POST /api/chat` and streams responses from OpenRouter.

## Scripts

- `npm run dev` — run development server
- `npm run build` — build for production
- `npm run start` — run production build
- `npm run lint` — run ESLint

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- OpenRouter via OpenAI SDK
- PDF parsing with `pdfjs-dist`
