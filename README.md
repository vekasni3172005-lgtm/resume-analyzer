# 🧠 ResumeIQ — AI Resume Analyzer

A complete full-stack web app that analyzes resumes (PDF/DOC/TXT) and provides:
- Resume score (0–100)
- Skill detection across 6 categories
- Improvement suggestions
- Keyword analysis
- Job role recommendations

---

## 📂 Folder Structure

```
resume-analyzer/
├── public/
│   └── index.html        ← Frontend (all-in-one)
├── uploads/              ← Temp file storage (auto-cleaned)
├── server.js             ← Node.js + Express backend
├── package.json
└── README.md
```

---

## ⚡ How to Run (Step by Step)

### Prerequisites
- Node.js v16+ installed → https://nodejs.org

### Step 1 — Install dependencies
```bash
cd resume-analyzer
npm install
```

### Step 2 — Start the server
```bash
node server.js
```
You should see:
```
✅  Resume Analyzer running at http://localhost:3000
```

### Step 3 — Open in browser
Visit: **http://localhost:3000**

---

## 🚀 Features

| Feature | Details |
|---|---|
| File upload | PDF, DOC, DOCX, TXT (max 5MB) |
| Drag & drop | Native drag-and-drop support |
| AI analysis | Skill detection, keyword scoring, section check |
| Score | 0–100 with animated ring chart |
| Feedback | Strengths + improvement tips |
| Job matching | Top 3 job roles with match percentage |
| Demo mode | Try without uploading a file |

## 🛠 Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JS (no build tools)
- **Backend**: Node.js, Express
- **Parsing**: pdf-parse (PDF), mammoth (DOC/DOCX)
- **Uploads**: multer

## 📝 Notes
- No external AI API needed — analysis uses smart pattern matching
- Files are deleted immediately after analysis
- Works 100% offline after `npm install`
