import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "meeting.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create meetings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            duration INTEGER NOT NULL,
            audio_url TEXT
        )
    """)
    
    # Create participants table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
    """)
    
    # Create transcripts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transcripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id INTEGER NOT NULL,
            speaker TEXT NOT NULL,
            text TEXT NOT NULL,
            start_time REAL NOT NULL,
            end_time REAL NOT NULL,
            FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
    """)
    
    # Create summaries table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id INTEGER NOT NULL UNIQUE,
            concise_summary TEXT NOT NULL,
            key_discussion TEXT NOT NULL,
            outline TEXT NOT NULL,
            FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
    """)
    
    # Create action_items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            assignee TEXT,
            FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    
    # Seed initial data if meetings table is empty
    cursor.execute("SELECT COUNT(*) as count FROM meetings")
    count = cursor.fetchone()["count"]
    if count == 0:
        print("Seeding initial Python SQLite database...")
        seed_data(conn)
        
    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    
    # Meeting 1
    cursor.execute(
        "INSERT INTO meetings (title, date, duration, audio_url) VALUES (?, ?, ?, ?)",
        ("Product Planning & Roadmap Sync", "2026-07-16T10:00:00Z", 1200, "https://actions.google.com/sounds/v1/ambient/morning_birds.ogg")
    )
    m1_id = cursor.lastrowid
    
    participants_1 = ["Sarah Jenkins", "Alex Rivera", "Elena Rostova"]
    for p in participants_1:
        cursor.execute("INSERT INTO participants (meeting_id, name) VALUES (?, ?)", (m1_id, p))
        
    transcript_1 = [
        ("Sarah Jenkins", "Good morning team. We need to discuss our roadmap timeline for the v2 release. Alex, how is the backend migration looking?", 0.0, 45.0),
        ("Alex Rivera", "Hey Sarah. The backend migration is taking slightly longer than we planned. We hit some index problems with our primary keys, but it should be resolved by tonight.", 45.0, 120.0),
        ("Sarah Jenkins", "Okay, thanks for the heads up. Elena, what about the dashboard wireframes? We need those before Alex can start frontend component building.", 120.0, 180.0),
        ("Elena Rostova", "Yes! I have fully completed the desktop wireframes and shared the Figma link. I am finishing the mobile responsive adaptation as we speak and should have them uploaded by tomorrow morning.", 180.0, 320.0),
        ("Sarah Jenkins", "That is wonderful, Elena. Alex, can your team inspect the desktop designs today and start estimating implementation efforts?", 320.0, 450.0),
        ("Alex Rivera", "Absolutely. I will assign David to review the Figma workspace this afternoon so we can hit the ground running with the UI setup.", 450.0, 580.0),
        ("Elena Rostova", "We should also double check the micro-interactions on the search bar. It should feel smooth and responsive.", 580.0, 710.0),
        ("Alex Rivera", "Agreed, we will use Tailwind and motion for clean animations.", 710.0, 820.0),
        ("Sarah Jenkins", "Perfect. I will draft the v2 roadmap slides for leadership today. Let us make sure we meet again on Friday to lock everything down.", 820.0, 1000.0),
        ("Elena Rostova", "Sounds like a solid plan. Have a great day everyone!", 1000.0, 1200.0)
    ]
    for speaker, text, start, end in transcript_1:
        cursor.execute("INSERT INTO transcripts (meeting_id, speaker, text, start_time, end_time) VALUES (?, ?, ?, ?, ?)", (m1_id, speaker, text, start, end))
        
    summary_1 = {
        "concise_summary": "The product team aligned on the timeline for the v2 release. Elena has completed the desktop dashboard designs and will finish mobile wireframes by tomorrow. Alex reported a slight backend migration delay but will begin frontend effort estimations once Elena delivers the wireframes. Sarah is drafting the v2 roadmap slides for leadership review on Friday.",
        "key_discussion": json.dumps(["Backend Migration Delay", "UX Wireframes Completion", "Frontend Effort Estimation", "Roadmap Slides Draft"]),
        "outline": json.dumps([
            {"title": "Intro & Backend Timeline Check", "startTime": 0, "endTime": 240, "description": "Sarah opens the meeting and Alex provides an update regarding a minor delay with the backend database migrations."},
            {"title": "UX Design Wireframes", "startTime": 240, "endTime": 540, "description": "Elena showcases the dashboard wireframes, noting desktop views are finished and mobile layouts will be uploaded tomorrow."},
            {"title": "Frontend Component Integration", "startTime": 540, "endTime": 900, "description": "Alex and Elena discuss adopting a consistent component library and planning estimates for the front-end transition."},
            {"title": "Roadmap & Leadership Slides", "startTime": 900, "endTime": 1200, "description": "Sarah assigns action items and establishes Friday as the next check-in deadline to prepare the roadmap for executives."}
        ])
    }
    cursor.execute(
        "INSERT INTO summaries (meeting_id, concise_summary, key_discussion, outline) VALUES (?, ?, ?, ?)",
        (m1_id, summary_1["concise_summary"], summary_1["key_discussion"], summary_1["outline"])
    )
    
    action_items_1 = [
        ("Finalize mobile responsive wireframes in Figma", 0, "Elena Rostova"),
        ("Review desktop Figma designs and estimate implementation effort", 0, "Alex Rivera"),
        ("Draft the v2 roadmap slides for leadership review", 1, "Sarah Jenkins"),
        ("Assign David to configure the base UI component library", 1, "Alex Rivera")
    ]
    for text, completed, assignee in action_items_1:
        cursor.execute("INSERT INTO action_items (meeting_id, text, completed, assignee) VALUES (?, ?, ?, ?)", (m1_id, text, completed, assignee))
        
    # Meeting 2
    cursor.execute(
        "INSERT INTO meetings (title, date, duration, audio_url) VALUES (?, ?, ?, ?)",
        ("Q3 Campaign Strategy Brainstorm", "2026-07-15T14:30:00Z", 1500, "https://actions.google.com/sounds/v1/ambient/rain_heavy.ogg")
    )
    m2_id = cursor.lastrowid
    
    participants_2 = ["Marcus Vance", "Jessica Taylor", "Chloe Peterson"]
    for p in participants_2:
        cursor.execute("INSERT INTO participants (meeting_id, name) VALUES (?, ?)", (m2_id, p))
        
    transcript_2 = [
        ("Marcus Vance", "Welcome everyone. Today is all about our Q3 campaign strategy. Our main KPI is growing organic acquisition by 30%. Let us hear some ideas.", 0.0, 90.0),
        ("Jessica Taylor", "I have been analyzing our top-performing content, and interactive resources convert best. We should build an Interactive Benchmark Calculator leveraging our internal dataset.", 90.0, 240.0),
        ("Chloe Peterson", "Oh, that is amazing. An interactive calculator would go viral on LinkedIn if people could easily compare their scores and post about them!", 240.0, 400.0),
        ("Marcus Vance", "I love that idea. Jessica, how difficult will it be to extract that benchmark data?", 400.0, 550.0),
        ("Jessica Taylor", "It will take me about a week to sanitize our customer datasets and identify the core baseline stats. I will need some support from the analytics team.", 550.0, 740.0),
        ("Chloe Peterson", "While you sanitize the metrics, I can begin drafting copy for the calculator landing page and our organic social loops.", 740.0, 910.0),
        ("Marcus Vance", "Great. Chloe, let us also supplement this with sponsored ads. Can you prepare a detailed $5,000 ad budget proposal?", 910.0, 1120.0),
        ("Chloe Peterson", "Yes, I can draft that easily. I will deliver the budget proposal to you by Thursday afternoon.", 1120.0, 1250.0),
        ("Jessica Taylor", "We should also design a dedicated email sequence for our current newsletter subscribers once we publish it.", 1250.0, 1400.0),
        ("Marcus Vance", "Fabulous. This sounds like a winning campaign. Let us check in on Thursday once the budget draft is ready.", 1400.0, 1500.0)
    ]
    for speaker, text, start, end in transcript_2:
        cursor.execute("INSERT INTO transcripts (meeting_id, speaker, text, start_time, end_time) VALUES (?, ?, ?, ?, ?)", (m2_id, speaker, text, start, end))
        
    summary_2 = {
        "concise_summary": "The marketing team discussed organic user acquisition tactics for Q3. They resolved to create an interactive benchmark calculator as a primary lead-generation asset. Jessica will lead database cleanup to extract benchmarking statistics within the next week. Chloe will draft landing page copywriting, social hooks, and submit a $5,000 sponsor post campaign budget proposal by Thursday.",
        "key_discussion": json.dumps(["Q3 Growth Targets", "Benchmark Calculator Asset", "LinkedIn & Social Hooks", "Paid Sponsorship Budget"]),
        "outline": json.dumps([
            {"title": "Growth Alignment & Goals", "startTime": 0, "endTime": 300, "description": "Marcus lays out the Q3 goal of boosting organic acquisition by 30%."},
            {"title": "The Benchmark Calculator Idea", "startTime": 300, "endTime": 720, "description": "Jessica proposes an interactive calculator that leverages internal benchmark data, which is highly shareable."},
            {"title": "Social Distribution Strategy", "startTime": 720, "endTime": 1100, "description": "Chloe outlines a plan to partition calculations into bite-sized highlights for LinkedIn."},
            {"title": "Budget Proposal & Next Steps", "startTime": 1100, "endTime": 1500, "description": "Marcus approves a $5,000 paid test budget. Chloe will prepare the proposal for leadership."}
        ])
    }
    cursor.execute(
        "INSERT INTO summaries (meeting_id, concise_summary, key_discussion, outline) VALUES (?, ?, ?, ?)",
        (m2_id, summary_2["concise_summary"], summary_2["key_discussion"], summary_2["outline"])
    )
    
    action_items_2 = [
        ("Sanitize and compile baseline customer statistics for the benchmark calculator", 0, "Jessica Taylor"),
        ("Draft promotional landing page copywriting and LinkedIn hooks", 1, "Chloe Peterson"),
        ("Formulate a $5,000 paid campaign budget proposal due Thursday", 0, "Chloe Peterson"),
        ("Approve resources from the analytics team to assist Jessica", 1, "Marcus Vance")
    ]
    for text, completed, assignee in action_items_2:
        cursor.execute("INSERT INTO action_items (meeting_id, text, completed, assignee) VALUES (?, ?, ?, ?)", (m2_id, text, completed, assignee))
        
    conn.commit()
