export interface Chapter {
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  description: string;
}

export interface MeetingSummary {
  concise: string;
  keyTopics: string[];
  chapters: Chapter[];
}

export interface TranscriptSegment {
  id?: number;
  speaker: string;
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

export interface ActionItem {
  id: number;
  meetingId: number;
  text: string;
  completed: boolean;
  assignee?: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  duration: number; // in seconds
  audio_url?: string;
  participants: string[];
  summary: MeetingSummary;
  transcript: TranscriptSegment[];
  actionItems: ActionItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
