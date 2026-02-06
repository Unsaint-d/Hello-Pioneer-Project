start cmd /k "cd frontend && npm run dev"
start cmd /k "cd backend && .\.venv\Scripts\activate && py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"