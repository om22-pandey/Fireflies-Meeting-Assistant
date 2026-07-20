Fully Working Production Link, try it out : https://fireflies-meeting-assistant-3sod.vercel.app/

# Fireflies.ai Meeting Assistant Clone

A production-style clone of **Fireflies.ai Meeting Assistant** built using **Next.js, FastAPI, SQLite, and Google Gemini AI**. The application allows users to upload meeting transcripts, generate AI-powered summaries, extract action items, and interact with meetings through an AI assistant.

## Features

* Upload meeting transcripts (.txt, .json, .vtt)
* AI-generated meeting summaries
* Participant extraction
* Action item generation
* Meeting dashboard
* Meeting details with transcript
* AI chat assistant
* SQLite database
* Offline fallback when Gemini API is unavailable

## Tech Stack

**Frontend**

* Next.js
* React
* TypeScript
* Tailwind CSS

**Backend**

* Python
* FastAPI
* Pydantic
* Google Gemini API

**Database**

* SQLite

## Project Structure

```text
frontend/
backend/
README.md
```

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python -m uvicorn app.api.main:app --reload
```

Backend runs on:

```text
http://localhost:8000
```

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Environment Variable

Create a `.env` file inside the backend folder.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

If no API key is provided, the application automatically uses offline transcript processing.

## Future Improvements

* PostgreSQL support
* JWT Authentication
* Docker deployment
* Redis caching
* AWS S3 storage

## Author

**Om Pandey**
