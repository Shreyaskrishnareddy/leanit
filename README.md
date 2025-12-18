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

## Deploy to Render (Single Service)

1. Fork this repo
2. Go to [Render](https://render.com) → **New → Web Service**
3. Connect your repo
4. Configure:
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variable:
   - `GROQ_API_KEY` = your Groq API key
6. Deploy!

## Local Development

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
npm run dev
```

Visit http://localhost:3000 (frontend) or http://localhost:8000 (API)

## Environment Variables

- `GROQ_API_KEY` - Your Groq API key (get from https://console.groq.com)

## License

MIT
