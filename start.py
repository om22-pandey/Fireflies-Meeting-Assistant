import sys
import os

# Explicitly insert the backend directory into the system search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

if __name__ == "__main__":
    import uvicorn
    # Now Python knows exactly how to map the app package path scope
    uvicorn.run("backend.app.api.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))