from pydantic import BaseModel
from typing import List, Optional

class CreateMeetingRequest(BaseModel):
    title: str
    date: str
    duration: int
    audio_url: Optional[str] = ""
    participants: List[str]

class UpdateMeetingRequest(BaseModel):
    title: str
    participants: Optional[List[str]] = None

class CreateActionItemRequest(BaseModel):
    text: str
    assignee: Optional[str] = ""

class UpdateActionItemRequest(BaseModel):
    text: Optional[str] = None
    completed: Optional[bool] = None
    assignee: Optional[str] = None

class AskChatbotRequest(BaseModel):
    message: str
    meetingId: Optional[int] = None
