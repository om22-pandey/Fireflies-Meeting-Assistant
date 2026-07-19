from pydantic import BaseModel
from typing import List, Optional

class MeetingModel(BaseModel):
    id: Optional[int] = None
    title: str
    date: str
    duration: int
    audio_url: Optional[str] = ""

class ParticipantModel(BaseModel):
    id: Optional[int] = None
    meeting_id: int
    name: str

class TranscriptModel(BaseModel):
    id: Optional[int] = None
    meeting_id: int
    speaker: str
    text: str
    start_time: float
    end_time: float

class SummaryModel(BaseModel):
    id: Optional[int] = None
    meeting_id: int
    concise_summary: str
    key_discussion: List[str]
    outline: List[dict]

class ActionItemModel(BaseModel):
    id: Optional[int] = None
    meeting_id: int
    text: str
    completed: bool
    assignee: Optional[str] = ""
