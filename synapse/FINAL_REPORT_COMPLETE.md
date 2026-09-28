# SyNAPSE — COMPLETE Final Year Project Report
## Emotion-Aware AAC Platform for Minimally Verbal Neurodiverse Children (UAE / KHDA / SEND)

**This is the FULL report guide.** Copy sections into Word. Every feature, diagram, table, and screenshot in the project is listed below.

| Field | Details |
|-------|---------|
| **Student Name** | [Your Full Name] |
| **Registration Number** | [Your Registration Number] |
| **Program** | B.Tech Computer Science and Engineering (Semester 8) |
| **Institution** | Manipal Academy of Higher Education, Dubai Campus, UAE |
| **Internal Guide** | [Guide Name] |
| **Project Duration** | 09 February 2026 – 09 June 2026 |

---

# PART A — MASTER CHECKLIST (Use This First)

## A.1 Everything Built in This Project

| Category | What Exists |
|----------|-------------|
| **Roles** | Student, Teacher, Caregiver, SEND Officer (4 roles) |
| **Languages** | English + Arabic (UI, cards, reports, alerts) |
| **Emotions** | 7 classes: happy, sad, angry, fear, disgust, surprise, neutral |
| **AAC Board** | 16 cards per session (8 core + 4 emotion + 4 topic) |
| **Topics** | school, home, feelings, play, food, body |
| **Session types** | classroom, home, assessment |
| **Monitoring** | Manual “Update mood” + automatic every 6 minutes |
| **Alerts** | Cautious emotions → teacher (school) or caregiver (home) |
| **Real-time** | 2 WebSocket channels (session + alerts) |
| **AI** | DeepFace (emotion) + Ollama Llama 3 (cards + narrative) + rule fallback |
| **Reports** | Session PDF, assessment PDF, KHDA school report, referral letter |
| **SEND** | 6-phase KHDA workflow with phase notes |
| **Privacy** | No video stored; temp image deleted after analysis |
| **Mobile** | PWA install + Capacitor Android APK |
| **Extension** | Chrome MV3 extension for 6-minute monitoring ticks |
| **Deployment** | School LAN, Render + Vercel, Docker + Ollama |
| **Demo data** | 4 children, 5 users, seeded sessions/logs |
| **Evaluation** | Functional tests + API benchmarks + demo DB counts |
| **Docs** | README, DEPLOY, DIAGRAMS (31), abstract, metrics guide |

## A.2 All Diagrams Required (31 Total)

Export each from `DIAGRAMS.md` via [mermaid.live](https://mermaid.live) → PNG 2x or 3x.

| Fig No. | DIAGRAMS.md # | Title | Put In Report Section |
|---------|---------------|-------|----------------------|
| Fig. 5.1 | 1 | High-level system architecture | Ch 5.1 |
| Fig. 5.2 | 2 | Four-layer architecture | Ch 5.3 |
| Fig. 5.3 | 3 | Deployment architecture (LAN vs cloud) | Ch 5.11 |
| Fig. 5.4 | 4 | Backend component diagram | Ch 5.5 |
| Fig. 5.5 | 5 | Frontend component diagram | Ch 5.5 |
| Fig. 5.6 | 6 | Technology stack mindmap | Ch 5.4 |
| Fig. 5.7 | 7 | Entity-relationship diagram | Ch 5.3 |
| Fig. 5.8 | 8 | Emotion privacy data flow | Ch 5.6 |
| Fig. 5.9 | 9 | Session data model | Ch 5.3 |
| Fig. 5.10 | 10 | Seed data structure | Ch 6.3 |
| Fig. 5.11 | 11 | Student AAC session sequence | Ch 5.5 |
| Fig. 5.12 | 12 | Emotion detection sequence | Ch 5.6 |
| Fig. 5.13 | 13 | AAC card generation sequence | Ch 5.7 |
| Fig. 5.14 | 14 | Six-minute monitor flow | Ch 5.8 |
| Fig. 5.15 | 15 | Alert routing (school vs home) | Ch 5.8 |
| Fig. 5.16 | 16 | Teacher live view sequence | Ch 5.5 (teacher module) |
| Fig. 5.17 | 17 | PDF report generation sequence | Ch 5.9 |
| Fig. 5.18 | 18 | Four-role ecosystem | Ch 1 or Ch 5.1 |
| Fig. 5.19 | 19 | Student UI flow | Ch 5.5 |
| Fig. 5.20 | 20 | Teacher UI map | Ch 5.5 |
| Fig. 5.21 | 21 | SEND Officer UI map | Ch 5.5 |
| Fig. 5.22 | 22 | Caregiver UI map | Ch 5.5 |
| Fig. 5.23 | 23 | KHDA six-phase stepper | Ch 5.3 |
| Fig. 5.24 | 24 | SyNAPSE ↔ KHDA evidence mapping | Ch 5.3 / 6.6 |
| Fig. 5.25 | 26 | End-to-end pipeline | Ch 1.3 or Ch 5.1 |
| Fig. 5.26 | Bonus WS | WebSocket dual-channel architecture | Ch 5.5 |
| Fig. 5.27 | Bonus Pie | AAC board composition (8+4+4) | Ch 5.7 |
| Fig. 6.1 | 27 | API latency bar chart | Ch 6.2 |
| Fig. 6.2 | 28 | Seeded dataset counts bar chart | Ch 6.3 |
| Fig. 6.3 | Bonus | Feature comparison (Mermaid) | Ch 6.4 |
| Fig. 6.4 | 25 | SDG alignment hub | Ch 6.6 |

**Also generate from Python script** (`generate_report_figures.py`):
- Fig. 6.5 — API latency (matplotlib)
- Fig. 6.6 — Feature rubric comparison (matplotlib)
- Fig. 6.7 — Emotion distribution from demo DB (matplotlib)
- Fig. 6.8 — Vertical pipeline (matplotlib)
- Fig. 6.9 — Inference panel (optional, `--image face.jpg`)

## A.3 All Screenshots Required (20+)

| Fig No. | Screen | How to Capture | Section |
|---------|--------|----------------|---------|
| Fig. 6.10 | Landing page | Open `/` | Ch 6.5 |
| Fig. 6.11 | Login page | Open `/login` | Ch 6.5 |
| Fig. 6.12 | Signup page | Open `/signup` | Ch 6.5 |
| Fig. 6.13 | Onboarding wizard | Open `/onboarding` (all 4 steps) | Ch 5.12 |
| Fig. 6.14 | Student splash | Login student → `/student/splash` | Ch 6.5 |
| Fig. 6.15 | Topic selection | `/student/topics` | Ch 6.5 |
| Fig. 6.16 | AAC session full page | `/student/session` (webcam + 16 cards) | Ch 6.5 |
| Fig. 6.17 | Emotion badge close-up | Crop from session page | Ch 6.5 |
| Fig. 6.18 | Celebration screen | End session → celebration | Ch 6.5 |
| Fig. 6.19 | Teacher dashboard | Login teacher → dashboard + charts | Ch 6.5 |
| Fig. 6.20 | Teacher children list | `/teacher/children` | Ch 6.5 |
| Fig. 6.21 | Teacher live session | Two browsers: student session + teacher live | Ch 6.5 |
| Fig. 6.22 | Teacher student profile | `/teacher/students/:childId` | Ch 6.5 |
| Fig. 6.23 | Emotion alert banner | Trigger sad/angry → teacher/caregiver banner | Ch 6.5 |
| Fig. 6.24 | Caregiver dashboard | Login caregiver | Ch 6.5 |
| Fig. 6.25 | Caregiver home session | `/caregiver/session` | Ch 6.5 |
| Fig. 6.26 | Caregiver progress charts | `/caregiver/progress` | Ch 6.5 |
| Fig. 6.27 | Caregiver privacy panel | `/caregiver/privacy` | Ch 6.5 |
| Fig. 6.28 | SEND officer dashboard | Login sendofficer | Ch 6.5 |
| Fig. 6.29 | Assessment console (6 phases) | `/send-officer/assessment/:id` | Ch 6.5 |
| Fig. 6.30 | SEND reports hub | `/send-officer/reports-hub` | Ch 6.5 |
| Fig. 6.31 | PDF report sample | Download session or assessment PDF | Ch 6.5 |
| Fig. 6.32 | PWA install prompt | Chrome → Add to Home Screen | Ch 5.11 |
| Fig. 6.33 | Offline banner | Turn off WiFi briefly → offline message | Ch 5.11 |
| Fig. 6.34 | Chrome extension popup | Extension icon → monitor on/off | Ch 5.8 |
| Fig. 6.35 | Swagger API docs | `localhost:8000/docs` | Appendix |
| Fig. 6.36 | AppShell sidebar + EN/AR toggle | Any teacher/caregiver/SEND page | Ch 6.5 |

**Demo logins (password `demo1234`):** `teacher`, `teacher2`, `caregiver`, `sendofficer`, `student`

---

# PART B — FULL TABLE OF CONTENTS

1. Introduction  
2. Literature Review  
3. Problem Statement  
4. Objectives  
5. Methodology  
   - 5.1–5.12 (all modules — see Part C)  
6. Results and Discussion  
7. Improvements Over Existing Systems *(NEW — full chapter)*  
8. Conclusion  
References  
Annexure — Weekly Reports  
Appendix A — Complete API List  
Appendix B — Complete Frontend Routes  
Appendix C — AAC Card Inventory  
Appendix D — WebSocket Events  
Appendix E — Deployment Guide Summary  

---

# PART C — REPORT TEXT (Chapters)

---

## ABSTRACT

Minimally verbal neurodiverse children in UAE inclusive schools often use static Augmentative and Alternative Communication (AAC) boards that do not change when emotional state changes. Teachers, caregivers, and SEND officers may miss early distress signals, and session evidence is rarely captured in one system.

**SyNAPSE** (Synaptic Neurodiverse Augmentative Platform for Speech & Expression) is a web-based, local-first platform with **four roles** (student, teacher, caregiver, SEND officer), **bilingual English–Arabic** AAC cards, **seven-emotion** facial detection via DeepFace, **six-minute periodic monitoring**, **environment-aware alerts** (teacher at school, caregiver at home), **live WebSocket** teacher view, **KHDA six-phase SEND** assessment notes, and **PDF reports** (session, assessment, school-wide KHDA summary, referral letter).

The system uses FastAPI, React, SQLite, Ollama/Llama 3 (with rule-based fallback), ReportLab, PWA, Capacitor Android, and a Chrome extension. **No video is stored** — only emotion metadata. Evaluation: local prototype on seeded demo data; emotion API ~0.30s, PDF ~1.84s; 63 sessions, 104 emotion logs, 116 card selections. No field surveys or child participant studies.

**Keywords—** AAC, Emotion Recognition, Autism, Inclusive Education, KHDA, SEND, DeepFace, WebSocket, Privacy-by-Design, UAE

---

## CHAPTER 1 — INTRODUCTION

### 1.1 Background
(Write 2–3 pages: UAE inclusive education, minimally verbal children, static AAC limits, need for emotion-aware support.)

### 1.2 Motivation
1. Static boards ignore mood changes  
2. Teachers cannot watch every child continuously  
3. Caregivers lack connected home tools  
4. SEND documentation is manual  
5. Cloud emotion apps raise child privacy concerns  
6. No single platform for all four stakeholders  

### 1.3 Proposed Solution Summary
**Insert Fig. 5.18** (Four-role ecosystem) and **Fig. 5.25** (End-to-end pipeline).

SyNAPSE closes the loop:
```
Webcam → Emotion detect → Log (no video) → Adapt AAC cards → Child taps card
         ↓                                                      ↓
    Alert teacher/caregiver                              PDF report for SEND
```

### 1.4 Scope
**In scope:** Everything in checklist A.1  
**Out of scope:** Custom CNN training, clinical diagnosis, field surveys, paid cloud AI

### 1.5 Report Organization
(Standard paragraph pointing to chapters 2–8.)

---

## CHAPTER 2 — LITERATURE REVIEW

### 2.1 AAC and Core Vocabulary
### 2.2 Emotion Recognition (FER, DeepFace, limitations for autism)
### 2.3 UAE / KHDA / SEND Framework
### 2.4 Existing Commercial and Research Systems
### 2.5 Research Gaps (6 gaps — see FINAL_REPORT.md)
### 2.6 How SyNAPSE Addresses Each Gap

**Insert Table 2.1 — Literature Gap vs SyNAPSE Feature**

| Gap in Literature | SyNAPSE Response |
|-------------------|------------------|
| Static AAC boards | 16-card board adapts to emotion + topic + LLM |
| No teacher workflow | Live session WebSocket + dashboard analytics |
| No home–school link | Caregiver home sessions + separate alert routing |
| No SEND evidence | 6-phase assessment + PDF + KHDA school report |
| Cloud privacy risk | Local DeepFace + Ollama; metadata only stored |
| No bilingual Gulf context | EN/AR cards, UI, alerts, reports |

---

## CHAPTER 3 — PROBLEM STATEMENT
(Full paragraph — see FINAL_REPORT.md)

---

## CHAPTER 4 — OBJECTIVES

**Table 4.1 — Primary and Specific Objectives (16 objectives)**

| # | Objective |
|---|-----------|
| 1 | Literature review and gap analysis |
| 2 | Requirements and SRS |
| 3 | System design (architecture, ER, use cases) |
| 4 | Authentication and four roles |
| 5 | Child profiles and session management |
| 6 | Webcam emotion detection without video storage |
| 7 | 16-card bilingual AAC board |
| 8 | LLM card generation with rule fallback |
| 9 | Teacher live monitoring and analytics |
| 10 | Caregiver home module and privacy panel |
| 11 | SEND officer 6-phase assessment |
| 12 | Emotion alerts with school/home routing |
| 13 | Six-minute background monitoring + extension |
| 14 | PDF and KHDA reports |
| 15 | PWA / deployment / Android packaging |
| 16 | Testing, benchmarks, documentation |

---

## CHAPTER 5 — METHODOLOGY

### 5.1 Development Approach
Incremental; Weeks 1–3 research, 4–16 implementation (match weekly reports).

**Insert Fig. 5.1, Fig. 5.2**

### 5.2 Requirements

**Table 5.1 — Functional Requirements (FR1–FR25)**

| ID | Requirement |
|----|-------------|
| FR1 | User registration and login |
| FR2 | Role-based access (4 roles) |
| FR3 | Child profile CRUD |
| FR4 | Start/end session (classroom, home, assessment) |
| FR5 | Topic selection (6 topics) |
| FR6 | Webcam capture and emotion detect |
| FR7 | Manual “Update mood” |
| FR8 | Automatic 6-minute emotion check |
| FR9 | Generate 16 AAC cards (LLM or rules) |
| FR10 | Log card selection with emotion context |
| FR11 | Text-to-speech for card labels |
| FR12 | Teacher dashboard with charts |
| FR13 | Teacher live session view |
| FR14 | Teacher pause/end session, turn control, messaging |
| FR15 | Teacher student profile and history |
| FR16 | Caregiver home session and progress |
| FR17 | Caregiver privacy information page |
| FR18 | SEND officer caseload dashboard |
| FR19 | 6-phase assessment with phase notes |
| FR20 | Complete assessment → PDF |
| FR21 | Referral letter PDF download |
| FR22 | KHDA school-wide report PDF |
| FR23 | Emotion alerts with acknowledge |
| FR24 | Session PDF export (EN/AR) |
| FR25 | Onboarding consent and permissions wizard |

**Table 5.2 — Non-Functional Requirements**

| ID | Requirement |
|----|-------------|
| NFR1 | Privacy — no video in database |
| NFR2 | Local-first deployment option |
| NFR3 | Bilingual EN/AR + RTL support |
| NFR4 | Child-friendly UI (large cards) |
| NFR5 | JWT security |
| NFR6 | Offline PWA cache |
| NFR7 | Response time suitable for demo |
| NFR8 | Modular backend routers |

### 5.3 System Design

**Insert Fig. 5.7 (ERD), Fig. 5.9, Fig. 5.23, Fig. 5.24**

**Table 5.3 — Database Tables (Full)**

| Table | Key Fields | Purpose |
|-------|------------|---------|
| users | id, username, role, hashed_password, full_name | Login accounts |
| children | name, age, diagnosis, communication_level, interests, teacher_id, caregiver_id | Student profiles |
| sessions | child_id, session_type, topic, phase, is_active, started_at, ended_at | Communication sessions |
| emotion_logs | session_id, emotion_label, confidence, intensity, timestamp | Mood history (NO images) |
| card_selections | session_id, card_id, label, label_ar, category, emotion_at_selection | AAC usage |
| emotion_alerts | child_id, session_id, recipient_user_id, environment, acknowledged | Alerts |
| assessments | child_id, phase_notes (JSON 1–6), accommodations_tried, status, report_path | SEND records |

**Table 5.4 — User Roles and Permissions**

| Role | Can Do |
|------|--------|
| Student | AAC session, webcam, tap cards (mapped to child profile) |
| Teacher | View assigned children, live session, reports, receive school alerts |
| Caregiver | Home session, progress, privacy page, receive home alerts |
| SEND Officer | All children, assessments, KHDA reports, referral letters |

**Insert Fig. 5.19, 5.20, 5.21, 5.22** (UI maps per role)

### 5.4 Technology Stack

**Insert Fig. 5.6**

**Table 5.5 — Technology Stack (Complete)**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, Vite 5 | User interface |
| Styling | Tailwind CSS, Framer Motion | Design and animations |
| Charts | Recharts | Teacher/caregiver analytics |
| Webcam | react-webcam | Camera capture |
| Backend | FastAPI, Uvicorn | REST API + WebSocket |
| ORM | SQLAlchemy async | Database access |
| DB | SQLite (Postgres optional) | Data storage |
| Auth | JWT, bcrypt | Secure login |
| Emotion | DeepFace, OpenCV | 7-class detection |
| LLM | Ollama + Llama 3 | Card labels + narratives |
| PDF | ReportLab | Report generation |
| Real-time | WebSockets (2 channels) | Live updates + alerts |
| Mobile | vite-plugin-pwa, Capacitor | Tablet install |
| Extension | Chrome MV3 | 6-min monitor sustain |
| Deploy | Render, Vercel, Docker | Cloud and local options |

### 5.5 Backend Implementation

**Insert Fig. 5.4**

**Table 5.6 — API Modules Summary (~50 endpoints)**

| Module | Main Endpoints | Purpose |
|--------|----------------|---------|
| Auth | register, login, me | User accounts |
| Children | CRUD, list with stats | Child profiles |
| Sessions | start, end, insights, by-child | Session lifecycle |
| Emotion | detect (multipart image) | DeepFace + log + alert |
| Cards | generate, select | 16-card board |
| Assessments | create, phase update, complete, referral | SEND workflow |
| Reports | session PDF, KHDA report, history | Documentation |
| Alerts | list, acknowledge | Alert management |
| Teacher | dashboard, live, pause, message, guidance | Classroom control |
| SEND | dashboard summary | Officer caseload |
| Health | /health | System check |
| WebSocket | /ws/session/{id}, /ws/alerts | Real-time |

*(Full endpoint list in Appendix A)*

### 5.6 Emotion Detection

**Insert Fig. 5.8, 5.12**

**Process:**
1. Capture JPEG from webcam  
2. Upload to backend (multipart form)  
3. Save temp file → DeepFace analyze → delete temp file  
4. Store EmotionLog (label, confidence, intensity)  
5. Broadcast `emotion_detected` on session WebSocket  
6. If cautious + confident → create EmotionAlert → `/ws/alerts`  
7. Refresh AAC cards if emotion changed  

**Table 5.7 — Seven Emotion Classes**

| Emotion | Used For |
|---------|----------|
| happy | Positive feeling cards |
| sad | Cautious alert candidate |
| angry | Cautious alert candidate |
| fear | Cautious alert candidate |
| disgust | Cautious alert candidate |
| surprise | Feeling cards |
| neutral | Default / calm state |

### 5.7 AAC Card Generation

**Insert Fig. 5.13, Fig. 5.27**

**Table 5.8 — Sixteen-Card Board Structure**

| Category | Count | Purpose |
|----------|-------|---------|
| Core | 8 | Always available communication words |
| Emotion | 4 | Match detected mood |
| Topic | 4 | Match selected topic or LLM suggestions |

**Table 5.9 — Core Cards (Always Present)**

| English | Arabic |
|---------|--------|
| I want | أريد |
| Stop | توقف |
| More | المزيد |
| All done | انتهى |
| I need help | أحتاج مساعدة |
| Yes | نعم |
| No | لا |
| Wait | انتظر |

**Table 5.10 — Topic Sets**

| Topic | Example Cards |
|-------|---------------|
| school | School, Classroom, Teacher, Break |
| home | Home, Family, Sleep, Eat |
| feelings | I feel happy/sad/angry/scared |
| play | Play, Toys, Outside, Friend |
| food | Hungry, Thirsty, Snack, Water |
| body | Head, Tummy, Sick, Rest |

**Generation flow:**
1. Load child age, diagnosis, interests  
2. Call Ollama → 8 short labels (JSON array)  
3. If success → merge with core + emotion + topic  
4. If fail/timeout → full rule-based board  
5. Return source flag: `llm` or `rule_based`  

### 5.8 Alerts and Six-Minute Monitoring

**Insert Fig. 5.14, 5.15, 5.26**

**Table 5.11 — Alert Rules**

| Rule | Value |
|------|-------|
| Cautious emotions | sad, angry, fear, disgust |
| Min confidence | 0.45 (45%) |
| Cooldown | 6 minutes (same child + emotion) |
| School recipient | Teacher |
| Home recipient | Caregiver |
| Delivery | DB record + WebSocket + browser notification |

**Chrome Extension:**
- Alarm every 6 minutes  
- Sends tick to open SyNAPSE tab  
- Popup to enable/disable monitor  
- Works with `useEmotionMonitor` hook  

**Insert Fig. 6.34** (extension screenshot)

### 5.9 Report Generation

**Insert Fig. 5.17**

**Table 5.12 — Report Types**

| Report | Who Generates | Contents |
|--------|---------------|----------|
| Session PDF | Teacher, Caregiver | Emotions, cards, duration, narrative |
| Assessment PDF | SEND Officer | 6-phase notes, accommodations, AI narrative |
| KHDA School Report | SEND Officer | Aggregated school SEND summary |
| Referral Letter | SEND Officer | Formal referral PDF |
| Bilingual text report | API | English + Arabic text (session) |

### 5.10 Teacher Advanced Features

**Insert Fig. 5.16**

- Live session with emotion chart and signal intensity  
- Pause / end session remotely  
- Turn-based interaction (next turn → WebSocket `turn_advanced`)  
- Send message to session transcript (`transcript_append`)  
- AI guidance suggestions (use/dismiss)  
- Student profile: emotion distribution, engagement trends, most-used cards  
- Achievement badges (demo)  

**Insert Fig. 6.21, 6.22**

### 5.11 Deployment and Mobile

**Insert Fig. 5.3**

**Table 5.13 — Deployment Options**

| Option | Setup | Best For |
|--------|-------|----------|
| A — School LAN | Laptop runs backend; tablets on same WiFi | Privacy, zero cost |
| B — Cloud | Render backend + Vercel frontend | Remote access |
| C — PWA | Add to Home Screen from browser | Quick tablet install |
| D — Android APK | Capacitor build + sideload | Offline-like native feel |
| E — Docker | docker-compose (Ollama + backend) | Consistent AI setup |

**PWA features:**
- Service worker caches static files  
- NetworkFirst cache for API (5 min)  
- Offline banner: “Offline mode — showing last synced AAC cards”  
- Fullscreen landscape on tablet  

**Insert Fig. 6.32, 6.33**

### 5.12 Onboarding, Landing, and Accessibility

**Landing page (`/`):**
- Marketing sections, role carousel, demo emotion cards, SDG badges, bilingual toggle  

**Onboarding (`/onboarding`) — 4 steps:**
1. Privacy Policy  
2. Terms of Service  
3. Informed Consent (signatures, biometric consent checkboxes)  
4. Device Permissions (camera, mic, speaker, etc.; local processing notice)  

**Accessibility features:**
- Text-to-speech (Web Speech API, EN + AR voices)  
- Large touch targets on AAC cards  
- High-contrast emotion badges  
- RTL layout for Arabic  
- Haptic vibration on cautious emotion (student, where supported)  

**Insert Fig. 6.10, 6.13**

### 5.13 Testing Approach

| Test Type | What Was Tested |
|-----------|-----------------|
| Unit/module | Login, emotion, cards, alerts separately |
| Integration | Student + teacher live flow |
| Role | All 4 logins and route guards |
| Performance | benchmark_poster_metrics.py |
| UI | Tablet browser, scroll, contrast |
| Privacy | Confirm no image paths in DB |

**Not done:** Clinical trial, user survey, real school pilot

---

## CHAPTER 6 — RESULTS AND DISCUSSION

### 6.1 Functional Testing

**Table 6.1 — Test Cases (expand to 20+ rows)**

Include: login all roles, session start/end, emotion detect, 16 cards, LLM on/off, live WS, alert routing school vs home, 6-min monitor, PDF download, assessment phases, acknowledge alert, PWA install, offline banner.

### 6.2 API Performance

**Insert Fig. 6.1, 6.5**

**Table 6.2 — Latency Benchmarks**

| Step | Mean (s) | Runs |
|------|----------|------|
| Emotion detect | 0.303 | 10 |
| PDF generation | 1.843 | 2 |
| AAC cards (rule fallback) | 24.612 | 10 |

### 6.3 Demo Database

**Insert Fig. 6.2, 6.7**

**Table 6.3 — Seeded Data**

| Item | Count |
|------|-------|
| Children | 4 (Ahmed ASD 7, Layla CP 9, Omar ASD 6, Sara Down Syndrome 11) |
| Users | 5 (teacher, teacher2, sendofficer, caregiver, student) |
| Sessions | 63 |
| Emotion logs | 104 |
| Card selections | 116 |

**Table 6.4 — Demo Children Profiles**

| Name | Age | Diagnosis | Communication Level |
|------|-----|-----------|---------------------|
| Ahmed Al Mansoori | 7 | ASD | early_language |
| Layla Hassan | 9 | Cerebral Palsy | symbolic |
| Omar Khalid | 6 | ASD | pre_intentional |
| Sara Mohammed | 11 | Down Syndrome | symbolic |

### 6.4 Feature Comparison

**Insert Fig. 6.3, 6.6**

**Table 6.5 — SyNAPSE vs Existing Solutions (FULL)**

| Feature | Static AAC App | Cloud Emotion App | School MIS | SyNAPSE |
|---------|----------------|-------------------|------------|---------|
| Picture/word boards | ✓ | ✗ | ✗ | ✓ |
| Emotion-aware cards | ✗ | Partial | ✗ | ✓ |
| Bilingual EN/AR | Sometimes | Rare | Sometimes | ✓ |
| 4 stakeholder roles | ✗ | ✗ | Partial | ✓ |
| Teacher live view | ✗ | ✗ | ✗ | ✓ |
| Caregiver home mode | ✗ | Partial | ✗ | ✓ |
| SEND 6-phase workflow | ✗ | ✗ | Partial | ✓ |
| KHDA PDF reports | ✗ | ✗ | Partial | ✓ |
| Referral letter | ✗ | ✗ | ✗ | ✓ |
| School vs home alerts | ✗ | ✗ | ✗ | ✓ |
| 6-minute privacy-safe monitor | ✗ | Continuous (risk) | ✗ | ✓ |
| No video storage | ✓ | ✗ | N/A | ✓ |
| Local AI (no API cost) | ✓ | ✗ | N/A | ✓ |
| WebSocket real-time | ✗ | Sometimes | ✗ | ✓ |
| PWA / tablet install | Sometimes | ✓ | ✗ | ✓ |
| LLM personalized cards | ✗ | Sometimes | ✗ | ✓ |
| Rule-based fallback | ✓ | ✗ | N/A | ✓ |
| SDG 3/4/10 alignment | ✗ | ✗ | ✗ | ✓ |
| Offline cache | Sometimes | ✗ | ✗ | ✓ (PWA) |

### 6.5 Screenshots Section
**Insert ALL screenshots Fig. 6.10 – 6.36** (2 per page with captions)

### 6.6 SDG and KHDA Mapping

**Insert Fig. 6.4**

**Table 6.6 — KHDA Phase Mapping**

| Phase | SyNAPSE Feature |
|-------|-----------------|
| 1 Identification | Child profile, diagnosis, communication level |
| 2 Assessment | Assessment console, session emotion data |
| 3 Planning | Topic + AAC board customization |
| 4 Implementation | Student/caregiver communication sessions |
| 5 Monitoring | Emotion logs, card analytics, live view |
| 6 Review | PDF reports, officer notes, KHDA school report |

---

## CHAPTER 7 — IMPROVEMENTS OVER EXISTING SYSTEMS

This chapter answers: **What does SyNAPSE do better?**

### 7.1 Improvements Over Static AAC Apps (Proloquo2Go-type)

| Limitation of Static AAC | SyNAPSE Improvement |
|--------------------------|---------------------|
| Same board all day | Board refreshes when emotion or topic changes |
| No teacher visibility | Teacher sees live emotion and card use |
| No session record | Every tap and emotion logged automatically |
| Expensive licenses | Free open-source stack for prototype |
| English only often | Every card has Arabic label |
| No school SEND link | KHDA phases and PDF evidence built in |

### 7.2 Improvements Over Cloud Emotion Apps

| Limitation of Cloud Apps | SyNAPSE Improvement |
|--------------------------|---------------------|
| Upload child face to server | Process locally; delete frame immediately |
| Store photos in cloud | Store only emotion label + confidence |
| Emotion only, no AAC | Emotion directly triggers card refresh + alert |
| Subscription/API fees | Ollama + DeepFace run on school laptop |
| One user (parent app) | Four roles with different dashboards |
| Continuous camera (creepy) | 6-minute interval + manual check |

### 7.3 Improvements Over School MIS / Manual SEND Tracking

| Manual Process | SyNAPSE Improvement |
|----------------|---------------------|
| Paper IEP notes | Digital 6-phase assessment with JSON notes |
| Teacher memory of sessions | Downloadable PDF with emotion + card summary |
| No home–school link | Same child profile; caregiver sees home sessions |
| Officer collects files manually | KHDA school report generated from system data |

### 7.4 Technical Improvements (Architecture)

1. **Dual WebSocket design** — session events separate from user alerts (cleaner, scalable)  
2. **Hybrid AI** — LLM when available, rules when not (reliable demo)  
3. **Environment-aware routing** — one codebase, different alert recipient by session type  
4. **Closed-loop intervention** — detect → alert adult → child uses AAC cards immediately  
5. **Multi-deployment** — same app works on LAN, cloud, PWA, or APK  
6. **Benchmark tooling** — reproducible metrics script for poster/report  
7. **31 architecture diagrams** — full documentation for viva and thesis  

### 7.5 What SyNAPSE Does NOT Claim to Improve (Be Honest in Viva)

- Not more accurate than clinical observation by trained staff  
- Not replacing speech therapist or psychologist  
- Not validated on UAE children in field study  
- Not better than static AAC for offline-only zero-tech scenarios  

---

## CHAPTER 8 — CONCLUSION

### 8.1 Key Contributions (15 points)
1. Four-role emotion-aware AAC platform  
2. Privacy-by-design (no video retention)  
3. Bilingual EN/AR throughout  
4. Six-minute KHDA-safe monitoring  
5. School/home alert routing  
6. 16-card adaptive board  
7. LLM + rule hybrid generation  
8. Teacher live WebSocket monitoring  
9. SEND 6-phase digital workflow  
10. Multiple PDF report types  
11. PWA + Android + extension  
12. Local-first deployment  
13. SDG 3/4/10 alignment  
14. Reproducible benchmarks  
15. Complete documentation package  

### 8.2 Limitations
(8 limitations — see FINAL_REPORT.md)

### 8.3 Future Work
(10 items — field study with ethics, fine-tuned emotion model, SMS alerts with consent, etc.)

---

## REFERENCES
(Copy 16+ references from FINAL_REPORT.md; add DeepFace paper, Ollama docs, KHDA framework)

---

# PART D — APPENDICES

## APPENDIX A — Complete API Endpoint List

### Auth
- POST `/auth/register`
- POST `/auth/login`
- GET `/auth/me`

### Children
- POST `/api/children/`
- GET `/api/children/`
- GET `/api/children/{id}`
- PUT `/api/children/{id}`

### Sessions
- POST `/api/sessions/start`
- POST `/api/sessions/{id}/end`
- GET `/api/sessions/{id}`
- GET `/api/sessions/child/{child_id}`
- GET `/api/sessions/{id}/insights`

### Cards
- POST `/api/cards/generate`
- POST `/api/cards/select`

### Emotion
- POST `/api/emotion/detect`

### Assessments
- POST `/api/assessments/`
- GET `/api/assessments/`
- GET `/api/assessments/{id}`
- PUT `/api/assessments/{id}/phase`
- POST `/api/assessments/{id}/complete`
- GET `/api/assessments/referral/{id}`

### Reports
- GET `/api/reports/khda-school-report`
- GET `/api/reports/{assessment_id}`
- GET `/api/reports/child/{child_id}/history`
- POST `/api/reports/session/{session_id}/generate-report`
- POST `/api/reports/session/{session_id}/generate-pdf`

### Alerts
- GET `/api/alerts/`
- POST `/api/alerts/{alert_id}/acknowledge`

### Teacher
- GET `/teacher/dashboard/summary`
- GET `/teacher/students/{child_id}/profile`
- GET `/teacher/sessions/{session_id}/live`
- POST `/teacher/sessions/{session_id}/pause`
- POST `/teacher/sessions/{session_id}/next-turn`
- POST `/teacher/sessions/{session_id}/end`
- POST `/teacher/sessions/{session_id}/guidance/{id}/use`
- POST `/teacher/sessions/{session_id}/guidance/{id}/dismiss`
- POST `/teacher/sessions/{session_id}/message`

### SEND
- GET `/api/send/dashboard/summary`

### System
- GET `/health`
- WS `/ws/session/{session_id}`
- WS `/ws/alerts?token=JWT`

---

## APPENDIX B — Complete Frontend Routes

### Public
`/`, `/login`, `/signup`, `/onboarding`, `/unauthorized`

### Student
`/student/splash`, `/student/topics`, `/student/session`, `/student/celebration`

### Teacher
`/teacher/dashboard`, `/teacher/children`, `/teacher/sessions-hub`, `/teacher/reports`, `/teacher/settings`, `/teacher/students/:childId`, `/teacher/sessions/:sessionId/live`, `/teacher/session/:child_id`, `/teacher/child/:child_id`

### SEND Officer
`/send-officer/dashboard`, `/send-officer/children`, `/send-officer/assessments`, `/send-officer/reports-hub`, `/send-officer/settings`, `/send-officer/assessment/:id`, `/send-officer/report/:id`

### Caregiver
`/caregiver/dashboard`, `/caregiver/progress`, `/caregiver/session`, `/caregiver/privacy`, `/caregiver/settings`

---

## APPENDIX C — Frontend Components Inventory

**Shared:** AACCard, AACIcon, EmotionBadge, EmotionAlertBanner, LoadingSpinner, Navbar, ProtectedRoute, SDGBadges, SessionHistoryPanel, SpeakButton

**Teacher charts/panels:** ClassroomHeaderCard, ClassOverviewPanel, EmotionDistributionChart, EngagementTrendChart, FilterToolbar, GuidanceSuggestionCard, MetricStatCard, MostUsedCardsChart, SessionControls, SignalIntensityCard, StatusBadge, StudentStatusCard, TranscriptPanel, TurnCounterCard

**Hooks:** useLang, useOnlineStatus, useEmotionMonitor, useAlertWebSocket, useTeacherDashboard, useTeacherLiveSession, useTeacherStudentProfile, useSendDashboard

---

## APPENDIX D — WebSocket Events

| Channel | Event | When Fired |
|---------|-------|------------|
| `/ws/session/{id}` | `emotion_detected` | After emotion API |
| `/ws/session/{id}` | `turn_advanced` | Teacher advances turn |
| `/ws/session/{id}` | `transcript_append` | Teacher sends message |
| `/ws/alerts` | `emotion_alert` | Cautious emotion alert created |

---

## APPENDIX E — Project File Structure

```
synapse/
├── backend/          API, models, routers, services, seed, benchmarks, figures
├── frontend/         React app, PWA, android/
├── browser-extension/ Chrome MV3 monitor
├── DIAGRAMS.md       31 Mermaid diagrams
├── DEPLOY.md         Deployment guide
├── CONFERENCE_ABSTRACT.md
├── POSTER_METRICS_HOW.md
├── docker-compose.yml
├── start.sh / start.bat
└── README.md
```

---

## APPENDIX F — Suggested Word Document Page Count

| Chapter | Target Pages |
|---------|--------------|
| Preliminary (abstract, TOC) | 4 |
| Ch 1 Introduction | 6 |
| Ch 2 Literature | 12 |
| Ch 3–4 Problem + Objectives | 4 |
| Ch 5 Methodology | 25–30 (many diagrams) |
| Ch 6 Results | 15–20 (many screenshots) |
| Ch 7 Improvements | 6 |
| Ch 8 Conclusion | 4 |
| References + Annexure | 20+ |
| **Total** | **~55–70 pages** |

---

*This document is the COMPLETE inventory. Use with `FINAL_REPORT.md` for full paragraph text in Chapters 1–6.*
