# LeanIt - YouTube Insight Extractor

Extract key insights from YouTube videos using AI. Swipe through insights Tinder-style on mobile.

## Features

- Paste any YouTube URL and get key insights in seconds
- LeanScore (0-100) tells you if a video is worth your time
- Tinder-style swipe interface for mobile
- Deep dive into any insight for more context

## Tech Stack

- **Backend**: FastAPI + Groq (LLaMA 3.3 70B)
- **Frontend**: Next.js 14 + Tailwind CSS + Framer Motion

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit http://localhost:3000

## Environment Variables

### Backend (.env)
- `GROQ_API_KEY` - Your Groq API key (get from https://console.groq.com)

### Frontend (.env)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

## Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render

## License

MIT
