import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import google.generativeai as genai
from dotenv import load_dotenv

# Import database and CRUD functions
from .database import get_db_connection, init_db
from .crud import (
    get_all_meetings_summary,
    get_meeting_detail,
    insert_meeting,
    update_meeting,
    delete_meeting,
    create_action_item,
    update_action_item,
    delete_action_item,
)
from .schemas import (
    CreateMeetingRequest,
    UpdateMeetingRequest,
    CreateActionItemRequest,
    UpdateActionItemRequest,
    AskChatbotRequest,
)
from .summarizer import summarize_transcript

load_dotenv()

app = FastAPI(title="Fireflies Meeting Assistant API", version="1.0.0")

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure database is initialized with tables and initial seed data
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Python FastAPI", "database": "SQLite"}

@app.get("/api/meetings")
def get_meetings():
    try:
        conn = get_db_connection()
        meetings = get_all_meetings_summary(conn)
        conn.close()
        return meetings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/meetings/{meeting_id}")
def get_meeting(meeting_id: int):
    try:
        conn = get_db_connection()
        detail = get_meeting_detail(conn, meeting_id)
        conn.close()
        if not detail:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return detail
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/meetings", status_code=201)
async def create_meeting(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    title: Optional[str] = Form(None)
):
    try:
        transcript_text = ""
        filename = ""
        
        if file:
            content = await file.read()
            transcript_text = content.decode("utf-8")
            filename = file.filename
        elif text:
            transcript_text = text
        else:
            raise HTTPException(status_code=400, detail="No transcript text or file uploaded")
            
        custom_title = title or ""
        file_extension = os.path.splitext(filename)[1].lower() if filename else ""
        
        parsed_text = transcript_text
        if file_extension == ".json":
            try:
                json_content = json.loads(transcript_text)
                if isinstance(json_content, list):
                    parsed_text = "\n".join([f"{item.get('speaker', 'Speaker')}: {item.get('text', '')}" for item in json_content])
                elif isinstance(json_content, dict):
                    if "text" in json_content:
                        parsed_text = json_content["text"]
                    elif "transcript" in json_content:
                        t = json_content["transcript"]
                        if isinstance(t, list):
                            parsed_text = "\n".join([f"{item.get('speaker', 'Speaker')}: {item.get('text', '')}" for item in t])
                        else:
                            parsed_text = t
            except Exception:
                print("Failed to parse uploaded JSON file, treating as raw text")
        elif file_extension == ".vtt":
            # Very simple WebVTT clean up
            lines = []
            for line in transcript_text.split("\n"):
                line = line.strip()
                if not line or "WEBVTT" in line or "-->" in line:
                    continue
                # strip HTML tags
                import re
                line = re.sub(r"<[^>]*>", "", line)
                lines.append(line)
            parsed_text = "\n".join(lines)

        generated_data = summarize_transcript(parsed_text, custom_title)
        
        conn = get_db_connection()
        meeting_id = insert_meeting(conn, {
            "title": generated_data["title"],
            "date": datetime_now_iso(),
            "duration": generated_data.get("duration", 600),
            "audio_url": "https://actions.google.com/sounds/v1/ambient/morning_birds.ogg",
            "participants": generated_data["participants"],
            "summary": generated_data["summary"],
            "transcript": generated_data["transcript"],
            "actionItems": generated_data["actionItems"]
        })
        conn.close()
        
        return {"id": meeting_id, "message": "Meeting created successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/meetings/{meeting_id}")
def update_meeting_route(meeting_id: int, req: UpdateMeetingRequest):
    try:
        conn = get_db_connection()
        update_meeting(conn, meeting_id, req.title, req.participants)
        conn.close()
        return {"message": "Meeting updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/meetings/{meeting_id}")
def delete_meeting_route(meeting_id: int):
    try:
        conn = get_db_connection()
        delete_meeting(conn, meeting_id)
        conn.close()
        return {"message": "Meeting deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Action Items Endpoints
@app.post("/api/meetings/{meeting_id}/action-items", status_code=201)
def add_action_item(meeting_id: int, req: CreateActionItemRequest):
    try:
        conn = get_db_connection()
        item_id = create_action_item(conn, meeting_id, req.text, req.assignee or "")
        conn.close()
        return {
            "id": item_id,
            "meetingId": meeting_id,
            "text": req.text,
            "completed": False,
            "assignee": req.assignee or ""
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/meetings/{meeting_id}/action-items/{item_id}")
def update_action_item_route(meeting_id: int, item_id: int, req: UpdateActionItemRequest):
    try:
        conn = get_db_connection()
        result = update_action_item(conn, item_id, req.text, req.completed, req.assignee)
        conn.close()
        if not result:
            raise HTTPException(status_code=404, detail="Action item not found")
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/meetings/{meeting_id}/action-items/{item_id}")
def delete_action_item_route(meeting_id: int, item_id: int):
    try:
        conn = get_db_connection()
        delete_action_item(conn, item_id)
        conn.close()
        return {"message": "Action item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chatbot assistant route
@app.post("/api/chat")
def ask_chatbot(req: AskChatbotRequest):
    try:
        message = req.message
        meeting_id = req.meetingId
        
        context_string = ""
        if meeting_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT title FROM meetings WHERE id = ?", (meeting_id,))
            m = cursor.fetchone()
            if m:
                cursor.execute("SELECT name FROM participants WHERE meeting_id = ?", (meeting_id,))
                participants = [row["name"] for row in cursor.fetchall()]
                
                cursor.execute("SELECT speaker, text FROM transcripts WHERE meeting_id = ? ORDER BY start_time ASC LIMIT 100", (meeting_id,))
                transcripts = cursor.fetchall()
                transcript_str = "\n".join([f"{t['speaker']}: {t['text']}" for t in transcripts])
                
                cursor.execute("SELECT concise_summary, key_discussion FROM summaries WHERE meeting_id = ?", (meeting_id,))
                summary = cursor.fetchone()
                
                cursor.execute("SELECT text, completed, assignee FROM action_items WHERE meeting_id = ?", (meeting_id,))
                action_items = cursor.fetchall()
                action_items_str = "\n".join([
                    f"- {ai['text']} [Assignee: {ai['assignee'] or 'Unassigned'}] ({'Completed' if ai['completed'] == 1 else 'Pending'})"
                    for ai in action_items
                ])
                
                concise_summary = summary["concise_summary"] if summary else "None"
                key_discussion = ", ".join(json.loads(summary["key_discussion"])) if summary else "None"
                
                context_string = f"""
                You are the Fireflies.ai Assistant. The user is asking a question about a specific meeting:
                Meeting Title: "{m['title']}"
                Participants: {', '.join(participants)}
                
                AI Summary of the meeting:
                "{concise_summary}"
                
                Key Discussion Topics:
                {key_discussion}
                
                Action Items:
                {action_items_str}

                Detailed Transcript Excerpts:
                {transcript_str}
                """
            conn.close()
        else:
            context_string = """
            You are the Fireflies.ai Assistant, an expert AI meeting assistant. Help the user understand how to use the app, manage their meetings, transcripts, action items, or summarize content. Be professional, friendly, concise, and focused on productivity.
            """
            
        api_key_env = os.environ.get("GEMINI_API_KEY")
        if api_key_env:
            try:
                chat_prompt = f"""
                {context_string}

                User message: "{message}"

                Please provide a concise, high-value, and helpful response. Format nicely with markdown if appropriate.
                """
                
                genai.configure(api_key=api_key_env)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(chat_prompt)
                if response.text:
                    return {"text": response.text}
            except Exception as e:
                print(f"Gemini API Python call in Chat failed: {e}")
                
        # Fallback offline simulation
        if meeting_id:
            fallback_text = "I am currently operating in offline mode. Based on the meeting record, there are action items for participants. How can I assist you with these once the GEMINI_API_KEY is configured in the Secrets panel?"
        else:
            fallback_text = "Hello! I am your Fireflies.ai clone assistant. I am operating in offline simulation mode. Please configure your GEMINI_API_KEY in the Secrets panel to activate full cognitive intelligence capabilities!"
            
        return {"text": fallback_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def datetime_now_iso():
    import datetime
    return datetime.datetime.utcnow().isoformat() + "Z"
