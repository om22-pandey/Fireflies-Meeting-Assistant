Fully Working Production Link, try it out : https://fireflies-meeting-assistant-3sod.vercel.app/
# Fireflies.ai Meeting Assistant Clone

A production-quality clone of the **Fireflies.ai Meeting Assistant** web application. This application replicates the core meeting intelligence workflows, SaaS layout aesthetics, interactive transcripts, bidirectional media player synchronization, and AI-generated summary panels from the original platform.

---

## 🛠️ Tech Stack & Architecture

- **Deployment Platform**: Cloud Run (Containerized, Node.js runtime environment)
- **Frontend Framework**: React 19, Vite 6, TypeScript
- **Styling**: Tailwind CSS v4 (incorporating `@theme` variables, premium fonts: *Inter*, *Space Grotesk*, and *JetBrains Mono*)
- **Animation**: `motion` layout and micro-interactions
- **Backend Framework**: Express.js (integrated as server-side API proxy & Vite development middleware, running on port `3000`)
- **Database Engine**: Native SQLite (`sqlite3` and `sqlite` wrapper libraries), persistent schema modeling
- **AI Processing**: Google Gen AI TypeScript SDK (`@google/genai`) proxying `gemini-3.5-flash` with perfect structured JSON schemas (and a high-fidelity local generator fallback for offline reliability)

---

## 🗄️ Relational Database Schema

The SQLite database contains normalized tables configured with foreign keys and cascade deletions.

```sql
-- Meetings master table
CREATE TABLE meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  duration INTEGER NOT NULL,
  audio_url TEXT
);

-- Participants registry (one-to-many with meetings)
CREATE TABLE participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Dialogues transcripts (one-to-many with meetings)
CREATE TABLE transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- AI Summarization sheets (one-to-one with meetings)
CREATE TABLE summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL UNIQUE,
  concise_summary TEXT NOT NULL,
  key_discussion TEXT NOT NULL, -- JSON string array
  outline TEXT NOT NULL, -- JSON string array of Chapters
  FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Action Items Checklists (one-to-many with meetings)
CREATE TABLE action_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  assignee TEXT,
  FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);
```

---

## 🚀 Key Features Built

1. **Fireflies Sidebar & Navigation Panel**: Full-height sidebar featuring immediate access to the meeting library, upload overlays, Fred chatbot, settings placeholders, user accounts, and a high-fidelity Dark/Light theme toggle.
2. **Interactive Bento-Grid Dashboard**: Displays real-time SaaS statistics (Total Meetings, Total Actions, Pending Tasks, Unique Speakers), instant search, and filtration by speakers, sorting, and grid library cards showing completeness metrics.
3. **SaaS Upload & AI Synthesis Modal**: Allows drag-and-drop file uploads (supporting `.txt`, `.json`, and `.vtt`) or pasting of dialogues. Shows a step-by-step progress monitor guiding the user through parsing, Gemini analysis, chapter segmentation, and SQLite storage.
4. **Interactive Double-Column Meeting Details**:
   - **Left Column**: Tabs for executive summaries, custom categorized discussion chips, chronological chapters (click-to-seek), and interactive action lists (with inline task additions, completions, edits, and deletions).
   - **Right Column**: Scrollable transcript segments with custom avatar color indicators, keyword text highlighting, and bidirectional media syncing (clicking a line seeks the progress bar, and playbacks actively highlight active sentences with auto-scrolling).
5. **Sticky Custom Media Player**: Anchored bar featuring customized Play/Pause buttons, volume controllers, active digital timelines, real-time waveform bounce animations, and customizable playback speed modifiers (`1x`, `1.25x`, `1.5x`, `2x`).
6. **Fred AI Companion Chatbot**: Context-aware drawer allowing users to converse with Fred about meeting deliverables, retrieve quick highlights, or clear instructions using Gemini grounding queries.

---

## 📡 REST API Documentation

### Meetings
- **`GET /api/meetings`**: Retrieves a summarized collection of all meeting sessions, pre-computed participant lists, and completed task tallies.
- **`GET /api/meetings/:id`**: Retrieves a single meeting in full detail (includes transcript exchanges, summaries, chronological chapters, and related checklists).
- **`POST /api/meetings`**: Handles file uploads and pasted text, contacts Gemini to perform full structural categorizations, and records entries inside SQLite.
- **`PUT /api/meetings/:id`**: Updates meeting title and speaker registry.
- **`DELETE /api/meetings/:id`**: Permanently deletes the meeting and cascades related sub-records.

### Checklist Action Items
- **`POST /api/meetings/:id/action-items`**: Registers a new action item to a session.
- **`PUT /api/meetings/:id/action-items/:itemId`**: Updates an action item (toggles completion or modifies text).
- **`DELETE /api/meetings/:id/action-items/:itemId`**: Deletes a specific action item.

### AI Companion Assistant
- **`POST /api/chat`**: Sends prompt payloads and context structures (active meeting transcript excerpts and actions) to `gemini-3.5-flash` to return intelligent answers.

---

## 💾 Local Environment Setup & Run

Follow these steps to run this full-stack application on your machine:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root folder (or use `.env.example` as a template):
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   *The Express server will start up, automatically initialize the SQLite relational database schema, seed initial records (`meetings.db`), mount Vite as development middleware, and listen on port `3000`.*

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```
