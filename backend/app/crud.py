import json
from sqlite3 import Connection
from typing import List, Optional, Dict, Any

def get_all_meetings_summary(conn: Connection) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM meetings ORDER BY date DESC")
    meetings = cursor.fetchall()
    
    formatted_meetings = []
    for m in meetings:
        cursor.execute("SELECT name FROM participants WHERE meeting_id = ?", (m["id"],))
        participants = [p["name"] for p in cursor.fetchall()]
        
        cursor.execute(
            "SELECT COUNT(*) as total, SUM(completed) as completed FROM action_items WHERE meeting_id = ?",
            (m["id"],)
        )
        stats = cursor.fetchone()
        
        # SUM(completed) can be None if count is 0
        total_items = stats["total"] or 0
        completed_items = stats["completed"] or 0
        
        formatted_meetings.append({
            "id": m["id"],
            "title": m["title"],
            "date": m["date"],
            "duration": m["duration"],
            "audio_url": m["audio_url"],
            "participants": participants,
            "actionItemsCount": {
                "total": total_items,
                "completed": completed_items
            }
        })
        
    return formatted_meetings

def get_meeting_detail(conn: Connection, meeting_id: int) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
    m = cursor.fetchone()
    if not m:
        return None
        
    cursor.execute("SELECT name FROM participants WHERE meeting_id = ?", (meeting_id,))
    participants = [p["name"] for p in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM transcripts WHERE meeting_id = ? ORDER BY start_time ASC", (meeting_id,))
    transcripts = cursor.fetchall()
    
    cursor.execute("SELECT * FROM summaries WHERE meeting_id = ?", (meeting_id,))
    summary = cursor.fetchone()
    
    cursor.execute("SELECT * FROM action_items WHERE meeting_id = ?", (meeting_id,))
    action_items = cursor.fetchall()
    
    return {
        "id": m["id"],
        "title": m["title"],
        "date": m["date"],
        "duration": m["duration"],
        "audio_url": m["audio_url"],
        "participants": participants,
        "summary": {
            "concise": summary["concise_summary"] if summary else "",
            "keyTopics": json.loads(summary["key_discussion"]) if summary else [],
            "chapters": json.loads(summary["outline"]) if summary else []
        },
        "transcript": [{
            "id": t["id"],
            "speaker": t["speaker"],
            "text": t["text"],
            "startTime": t["start_time"],
            "endTime": t["end_time"]
        } for t in transcripts],
        "actionItems": [{
            "id": item["id"],
            "meetingId": item["meeting_id"],
            "text": item["text"],
            "completed": item["completed"] == 1,
            "assignee": item["assignee"]
        } for item in action_items]
    }

def insert_meeting(conn: Connection, meeting: Dict[str, Any]) -> int:
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO meetings (title, date, duration, audio_url) VALUES (?, ?, ?, ?)",
        (meeting["title"], meeting["date"], meeting["duration"], meeting.get("audio_url", ""))
    )
    meeting_id = cursor.lastrowid
    
    # Insert participants
    for p in meeting.get("participants", []):
        cursor.execute("INSERT INTO participants (meeting_id, name) VALUES (?, ?)", (meeting_id, p))
        
    # Insert transcripts
    for t in meeting.get("transcript", []):
        cursor.execute(
            "INSERT INTO transcripts (meeting_id, speaker, text, start_time, end_time) VALUES (?, ?, ?, ?, ?)",
            (meeting_id, t["speaker"], t["text"], t["startTime"], t["endTime"])
        )
        
    # Insert summary
    summary = meeting.get("summary", {})
    cursor.execute(
        "INSERT INTO summaries (meeting_id, concise_summary, key_discussion, outline) VALUES (?, ?, ?, ?)",
        (
            meeting_id,
            summary.get("concise", ""),
            json.dumps(summary.get("keyTopics", [])),
            json.dumps(summary.get("chapters", []))
        )
    )
    
    # Insert action items
    for item in meeting.get("actionItems", []):
        cursor.execute(
            "INSERT INTO action_items (meeting_id, text, completed, assignee) VALUES (?, ?, ?, ?)",
            (meeting_id, item["text"], 1 if item.get("completed") else 0, item.get("assignee", ""))
        )
        
    conn.commit()
    return meeting_id

def update_meeting(conn: Connection, meeting_id: int, title: str, participants: Optional[List[str]] = None):
    cursor = conn.cursor()
    cursor.execute("UPDATE meetings SET title = ? WHERE id = ?", (title, meeting_id))
    
    if participants is not None:
        cursor.execute("DELETE FROM participants WHERE meeting_id = ?", (meeting_id,))
        for p in participants:
            if p.strip():
                cursor.execute("INSERT INTO participants (meeting_id, name) VALUES (?, ?)", (meeting_id, p.strip()))
                
    conn.commit()

def delete_meeting(conn: Connection, meeting_id: int):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
    cursor.execute("DELETE FROM participants WHERE meeting_id = ?", (meeting_id,))
    cursor.execute("DELETE FROM transcripts WHERE meeting_id = ?", (meeting_id,))
    cursor.execute("DELETE FROM summaries WHERE meeting_id = ?", (meeting_id,))
    cursor.execute("DELETE FROM action_items WHERE meeting_id = ?", (meeting_id,))
    conn.commit()

def create_action_item(conn: Connection, meeting_id: int, text: str, assignee: str = "") -> int:
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO action_items (meeting_id, text, completed, assignee) VALUES (?, ?, 0, ?)",
        (meeting_id, text, assignee)
    )
    conn.commit()
    return cursor.lastrowid

def update_action_item(
    conn: Connection,
    item_id: int,
    text: Optional[str] = None,
    completed: Optional[bool] = None,
    assignee: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM action_items WHERE id = ?", (item_id,))
    item = cursor.fetchone()
    if not item:
        return None
        
    new_text = text if text is not None else item["text"]
    new_completed = (1 if completed else 0) if completed is not None else item["completed"]
    new_assignee = assignee if assignee is not None else item["assignee"]
    
    cursor.execute(
        "UPDATE action_items SET text = ?, completed = ?, assignee = ? WHERE id = ?",
        (new_text, new_completed, new_assignee, item_id)
    )
    conn.commit()
    
    return {
        "id": item_id,
        "meetingId": item["meeting_id"],
        "text": new_text,
        "completed": new_completed == 1,
        "assignee": new_assignee
    }

def delete_action_item(conn: Connection, item_id: int):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM action_items WHERE id = ?", (item_id,))
    conn.commit()
