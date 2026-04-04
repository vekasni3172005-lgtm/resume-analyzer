const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Skill taxonomy ───────────────────────────────────────────────────────────
const SKILLS = {
  programming:   ['javascript','python','java','c++','c#','typescript','go','ruby','php','swift','kotlin','rust','scala','r','matlab'],
  web:           ['html','css','react','angular','vue','node','express','next','nuxt','tailwind','bootstrap','graphql','rest','api'],
  data:          ['sql','mysql','postgresql','mongodb','redis','firebase','elasticsearch','hadoop','spark','tableau','powerbi','excel'],
  ml:            ['machine learning','deep learning','tensorflow','pytorch','keras','sklearn','nlp','computer vision','pandas','numpy'],
  cloud:         ['aws','azure','gcp','docker','kubernetes','terraform','ci/cd','devops','linux','git','jenkins','ansible'],
  soft:          ['leadership','communication','teamwork','problem solving','project management','agile','scrum','jira','time management']
};

const JOB_ROLES = [
  { title:'Frontend Developer',  icon:'🎨', skills:['javascript','react','css','html','vue','angular','typescript'] },
  { title:'Backend Developer',   icon:'⚙️', skills:['node','python','java','sql','api','express','mongodb'] },
  { title:'Full Stack Developer',icon:'🚀', skills:['javascript','node','react','sql','html','css','mongodb'] },
  { title:'Data Scientist',      icon:'📊', skills:['python','machine learning','pandas','tensorflow','sql','numpy','r'] },
  { title:'DevOps Engineer',     icon:'🔧', skills:['docker','kubernetes','aws','linux','ci/cd','terraform','git'] },
  { title:'Cloud Architect',     icon:'☁️', skills:['aws','azure','gcp','docker','kubernetes','terraform'] },
  { title:'ML Engineer',         icon:'🤖', skills:['python','tensorflow','pytorch','machine learning','deep learning','nlp'] },
  { title:'Database Administrator',icon:'🗄️',skills:['sql','mysql','postgresql','mongodb','redis','elasticsearch'] }
];

const IMPORTANT_KEYWORDS = [
  'github','portfolio','projects','internship','experience','education',
  'certification','award','volunteer','publication','leadership','quantified',
  'achieved','improved','reduced','increased','managed','developed','designed',
  'built','implemented','deployed','optimized'
];

// ─── Analysis Engine ──────────────────────────────────────────────────────────
function analyzeResume(text) {
  const lower = text.toLowerCase();
  const words  = lower.split(/\W+/);

  // 1. Skills detection
  const foundSkills = {};
  let totalSkills = 0;
  for (const [category, skillList] of Object.entries(SKILLS)) {
    foundSkills[category] = skillList.filter(s => lower.includes(s));
    totalSkills += foundSkills[category].length;
  }

  // 2. Keywords
  const foundKeywords = IMPORTANT_KEYWORDS.filter(k => lower.includes(k));

  // 3. Experience years
  const expMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
  const expYears  = expMatch ? parseInt(expMatch[1]) : 0;

  // 4. Sections check
  const sections = {
    education:   /education|degree|university|college|bachelor|master|phd/i.test(text),
    experience:  /experience|work history|employment|internship|position/i.test(text),
    skills:      /skills|technologies|tools|proficiencies/i.test(text),
    projects:    /projects|portfolio|github|built|developed/i.test(text),
    contact:     /email|phone|linkedin|github\.com|@/i.test(text),
    summary:     /summary|objective|profile|about/i.test(text)
  };
  const sectionScore = Object.values(sections).filter(Boolean).length;

  // 5. Formatting quality heuristics
  const lineCount   = text.split('\n').filter(l => l.trim()).length;
  const wordCount   = words.filter(w => w.length > 1).length;
  const hasBullets  = /[•\-\*>]\s/.test(text);
  const hasQuantified = /\d+%|\d+\s*\+?\s*(users|clients|projects|members|employees|sales|revenue)/i.test(text);

  // ─── Scoring ───────────────────────────────────────────────────────────────
  let score = 0;
  // Skills (30 pts)
  score += Math.min(30, totalSkills * 2.5);
  // Keywords (15 pts)
  score += Math.min(15, foundKeywords.length * 1.5);
  // Sections (20 pts)
  score += Math.round((sectionScore / 6) * 20);
  // Experience (15 pts)
  score += Math.min(15, expYears * 3 + (sections.experience ? 5 : 0));
  // Formatting (20 pts)
  let fmt = 0;
  if (wordCount > 150)  fmt += 5;
  if (wordCount < 800)  fmt += 5;
  if (hasBullets)       fmt += 5;
  if (hasQuantified)    fmt += 5;
  score += fmt;

  score = Math.min(100, Math.round(score));

  // ─── Suggestions ──────────────────────────────────────────────────────────
  const suggestions = [];
  if (!sections.summary)    suggestions.push('Add a professional summary/objective at the top.');
  if (!sections.projects)   suggestions.push('Include a Projects section with GitHub links.');
  if (!hasQuantified)       suggestions.push('Quantify achievements (e.g., "Improved performance by 40%").');
  if (!hasBullets)          suggestions.push('Use bullet points for better readability.');
  if (!sections.contact)    suggestions.push('Ensure contact info (email, LinkedIn, GitHub) is present.');
  if (wordCount < 150)      suggestions.push('Resume is too short — add more detail.');
  if (wordCount > 900)      suggestions.push('Resume may be too long — aim for 1–2 pages.');
  if (foundKeywords.length < 4) suggestions.push('Add more action verbs (e.g., "Led", "Built", "Optimised").');
  if (totalSkills < 5)      suggestions.push('List more technical skills relevant to your target role.');
  if (!lower.includes('certification') && !lower.includes('certificate'))
    suggestions.push('Add certifications (AWS, Google, Coursera, etc.) to stand out.');

  // ─── Strengths ────────────────────────────────────────────────────────────
  const strengths = [];
  if (totalSkills >= 8)           strengths.push('Strong technical skill set detected.');
  if (sections.projects)          strengths.push('Projects section present — great for portfolios.');
  if (hasQuantified)              strengths.push('Quantified impact statements found.');
  if (hasBullets)                 strengths.push('Well-formatted with bullet points.');
  if (expYears >= 2)              strengths.push(`${expYears}+ years of experience highlighted.`);
  if (foundKeywords.length >= 6)  strengths.push('Strong use of action keywords.');
  if (sections.education)         strengths.push('Education section clearly presented.');
  if (sections.contact)           strengths.push('Contact information is complete.');

  // ─── Missing skills ───────────────────────────────────────────────────────
  const missingSkills = [];
  if (foundSkills.programming.length === 0) missingSkills.push('Core programming language (Python, JavaScript, Java)');
  if (foundSkills.web.length === 0)         missingSkills.push('Web technologies (React, Node.js, HTML/CSS)');
  if (foundSkills.data.length === 0)        missingSkills.push('Database knowledge (SQL, MongoDB)');
  if (foundSkills.cloud.length === 0)       missingSkills.push('Cloud / DevOps (AWS, Docker, Git)');
  if (foundSkills.ml.length === 0 && totalSkills < 5) missingSkills.push('Modern frameworks (TensorFlow, PyTorch)');

  // ─── Job matches ──────────────────────────────────────────────────────────
  const allFoundSkills = Object.values(foundSkills).flat();
  const jobMatches = JOB_ROLES.map(job => {
    const matched = job.skills.filter(s => allFoundSkills.includes(s) || lower.includes(s));
    return { ...job, matchScore: Math.round((matched.length / job.skills.length) * 100), matchedSkills: matched };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);

  return {
    score,
    wordCount,
    totalSkills,
    skills: foundSkills,
    keywords: foundKeywords,
    sections,
    suggestions: suggestions.slice(0, 5),
    strengths:   strengths.slice(0, 5),
    missingSkills,
    jobMatches,
    expYears,
    formatting: { hasBullets, hasQuantified, lineCount, wordCount }
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    let text = '';
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const parsed = await pdfParse(dataBuffer);
      text = parsed.text;
    } else if (ext === '.doc' || ext === '.docx') {
      const result = await mammoth.extractRawText({ path: req.file.path });
      text = result.value;
    } else if (ext === '.txt') {
      text = fs.readFileSync(req.file.path, 'utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOC, DOCX, or TXT.' });
    }

    if (!text || text.trim().length < 20)
      return res.status(400).json({ error: 'Could not extract text. Ensure the file is not scanned/image-only.' });

    const analysis = analyzeResume(text);
    fs.unlinkSync(req.file.path); // clean up
    res.json({ success: true, ...analysis });
  } catch (err) {
    console.error(err);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// Sample resume demo endpoint
app.post('/api/demo', (req, res) => {
  const sampleText = `
John Doe | john.doe@email.com | linkedin.com/in/johndoe | github.com/johndoe | +1-234-567-8901

SUMMARY
Results-driven Software Engineer with 3 years of experience building scalable web applications. Passionate about clean code, user experience, and continuous learning.

EXPERIENCE
Software Engineer — TechCorp Inc.  (2021–Present)
• Developed and maintained React-based dashboard used by 10,000+ users
• Built RESTful APIs using Node.js and Express, reducing latency by 35%
• Implemented CI/CD pipelines with Docker and Jenkins, cutting deploy time by 50%
• Collaborated in Agile/Scrum team of 8 engineers

Junior Developer — StartupXYZ  (2020–2021)
• Built responsive HTML/CSS/JavaScript landing pages
• Integrated Firebase for real-time data and authentication
• Managed PostgreSQL database schemas and optimized queries

EDUCATION
B.Tech in Computer Science — State University (2020) — GPA 8.4/10

SKILLS
Languages: JavaScript, Python, TypeScript, Java, SQL
Frontend:  React, Next.js, HTML, CSS, Tailwind CSS
Backend:   Node.js, Express, REST API, GraphQL
Database:  MongoDB, PostgreSQL, Redis, Firebase
DevOps:    Docker, Git, AWS, CI/CD, Linux

PROJECTS
• E-Commerce Platform — Full-stack app with React + Node + MongoDB (GitHub)
• ML Sentiment Analyzer — Python + TensorFlow, 89% accuracy on 50k dataset
• Portfolio Website — Deployed on AWS with CI/CD pipeline

CERTIFICATIONS
• AWS Certified Developer – Associate (2022)
• Google Data Analytics Certificate (2021)

ACHIEVEMENTS
• Led a team of 4 interns, improved project delivery by 20%
• Won 1st place at University Hackathon 2019
`;
  const analysis = analyzeResume(sampleText);
  res.json({ success: true, ...analysis, isDemo: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅  Resume Analyzer running at http://localhost:${PORT}`));
