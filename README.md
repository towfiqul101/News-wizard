# বাংলা নিউজ এডিটর — Bangla News Editor

বাংলা সংবাদ বানান পরীক্ষা, সম্পাদনা ও ইংরেজি অনুবাদ — প্রথম আলো ও bdnews24.com স্টাইলে।

**Powered by Gemini 2.5 Flash (Free — No credit card needed)**

---

## Features

- 🔍 **বানান পরীক্ষা** — Bangla Academy rules + Prothom Alo/bdnews24 editorial style
- 📰 **সম্পাদনা** — Rewrites news in professional editorial style with headline
- 🌐 **ইংরেজি অনুবাদ** — Professional English translation
- ✏️ **One-click fixes** — Click any error to replace, or fix all at once

---

## Deploy to Vercel (5 minutes)

### Step 1: Get Gemini API Key (Free)
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with Google
3. Click **"Create API Key"**
4. Copy the key (starts with `AIzaSy...`)

### Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "Bangla News Editor"
git remote add origin https://github.com/YOUR_USERNAME/bangla-news-editor.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → "Add New Project"
2. Import your GitHub repo
3. In **Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: your Gemini API key from Step 1
4. Click **Deploy**

Done! Your app is live at `https://bangla-news-editor.vercel.app`

---

## Run Locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your Gemini API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Free Tier Limits

| Feature | Limit |
|---------|-------|
| Requests/day | 1,500 |
| Requests/min | 15 |
| Credit card | Not needed |
| Expiry | None |

More than enough for a journalist's daily use.

---

## Tech Stack
- Next.js 14 (App Router)
- Gemini 2.5 Flash API
- Vercel (hosting)
