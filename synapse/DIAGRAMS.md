# SyNAPSE — Mermaid Diagrams (28)

Copy any block into [Mermaid Live Editor](https://mermaid.live), draw.io (Mermaid plugin), Notion, GitHub, or VS Code Markdown preview.

**Project:** SyNAPSE — Emotion-Aware AAC | MAHE Dubai  
**Note:** Charts 27–29 use values from `backend/poster_metrics.json` (local benchmark, seeded data).

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
  subgraph Client["Client Layer"]
    WEB["React + Vite Web App"]
    PWA["PWA / Tablet APK"]
    EXT["Chrome Extension<br/>(6-min tick)"]
  end

  subgraph API["Application Layer — FastAPI"]
    REST["REST API<br/>auth · children · sessions · cards · reports · alerts"]
    WS1["WebSocket<br/>/ws/session/{id}"]
    WS2["WebSocket<br/>/ws/alerts"]
  end

  subgraph AI["AI Services (Local)"]
    DF["DeepFace<br/>7-class emotion"]
    OLL["Ollama + Llama 3<br/>AAC labels + narrative"]
    RULE["Rule-based<br/>card fallback"]
  end

  subgraph Data["Data & Output"]
    DB[(SQLite<br/>synapse.db)]
    PDF["ReportLab PDF<br/>KHDA-style reports"]
  end

  WEB --> REST
  PWA --> REST
  EXT -.->|SYNAPSE_MONITOR_TICK| WEB
  REST --> DF
  REST --> OLL
  REST --> RULE
  REST --> DB
  REST --> PDF
  WS1 --> WEB
  WS2 --> WEB
  OLL -.->|if unavailable| RULE
```

---

## 2. Layered Architecture (4 Layers)

```mermaid
flowchart TB
  L1["Layer 1 — Presentation<br/>React · Tailwind · Webcam · AAC grid · Role dashboards"]
  L2["Layer 2 — Application API<br/>FastAPI REST · JWT auth · WebSockets"]
  L3["Layer 3 — Intelligence<br/>DeepFace emotion · Ollama LLM · Rule engine"]
  L4["Layer 4 — Data & Output<br/>SQLite · EmotionLog · CardSelection · ReportLab PDF"]

  L1 --> L2
  L2 --> L3
  L3 --> L2
  L2 --> L4
```

---

## 3. Deployment Architecture

```mermaid
flowchart LR
  subgraph School["Option A — School WiFi (Local)"]
    LAP["Classroom laptop<br/>uvicorn :8000"]
    TAB["Student tablets<br/>PWA / APK"]
    TAB -->|HTTP/WS| LAP
  end

  subgraph Cloud["Option B — Cloud"]
    VER["Vercel<br/>frontend/dist"]
    REN["Render<br/>backend/"]
    VER -->|VITE_API_URL| REN
  end

  subgraph LocalAI["On-device / LAN AI"]
    OLL["Ollama<br/>localhost:11434"]
    LAP --> OLL
    REN -.->|optional| OLL
  end

  subgraph Ext["Browser Extension"]
    CHR["Chrome MV3<br/>browser-extension/"]
    CHR -.->|alarm 6 min| TAB
  end
```

---

## 4. Backend Component Diagram

```mermaid
flowchart TB
  MAIN["main.py<br/>FastAPI · CORS · lifespan"]

  subgraph Routers["routers/"]
    R1["auth_router"]
    R2["children_router"]
    R3["sessions_router"]
    R4["emotion_router"]
    R5["cards_router"]
    R6["assessment_router"]
    R7["reports_router"]
    R8["alerts_router"]
    R9["teacher_router"]
    R10["send_router"]
  end

  subgraph Services["services/"]
    S1["deepface_service"]
    S2["llm_service"]
    S3["cards_service"]
    S4["report_service"]
    S5["pdf_service"]
    S6["alert_service"]
  end

  subgraph Core["Core"]
    M["models.py"]
    D["database.py"]
    A["auth.py"]
    SEED["seed.py"]
  end

  MAIN --> Routers
  R4 --> S1
  R5 --> S2
  R5 --> S3
  R7 --> S4
  R7 --> S5
  R4 --> S6
  R8 --> S6
  Routers --> Core
  Services --> Core
```

---

## 5. Frontend Component Diagram

```mermaid
flowchart TB
  APP["App.jsx · AuthContext · Routes"]

  subgraph Student["pages/student/"]
    ST1["SplashScreen"]
    ST2["TopicSelection"]
    ST3["AACSession"]
    ST4["CelebrationScreen"]
  end

  subgraph Teacher["pages/teacher/"]
    T1["TeacherDashboard"]
    T2["TeacherLiveSession"]
    T3["TeacherReportsHub"]
    T4["TeacherChildren"]
  end

  subgraph SEND["pages/send_officer/"]
    SO1["SODashboard"]
    SO2["AssessmentConsole"]
    SO3["SOReportsHub"]
  end

  subgraph Caregiver["pages/caregiver/"]
    C1["CaregiverDashboard"]
    C2["HomeSession"]
    C3["PrivacyPanel"]
  end

  subgraph Shared["components/ · hooks/"]
    SH1["AACCard · AACIcon"]
    SH2["EmotionBadge"]
    SH3["EmotionAlertBanner"]
    SH4["useEmotionMonitor"]
    SH5["useAlertWebSocket"]
    SH6["AppShell"]
  end

  APP --> Student
  APP --> Teacher
  APP --> SEND
  APP --> Caregiver
  ST3 --> SH1
  ST3 --> SH4
  T2 --> SH5
  SH6 --> SH3
```

---

## 6. Technology Stack

```mermaid
mindmap
  root((SyNAPSE))
    Frontend
      React 18
      Vite 5
      Tailwind CSS
      Recharts
      react-webcam
      Framer Motion
      Capacitor Android
      vite-plugin-pwa
    Backend
      FastAPI
      Uvicorn
      SQLAlchemy async
      python-jose JWT
      passlib bcrypt
    AI Local
      DeepFace
      OpenCV
      Ollama Llama 3
    Data Output
      SQLite
      ReportLab PDF
      httpx
    Realtime
      WebSockets
```

---

## 7. Entity-Relationship Diagram

```mermaid
erDiagram
  User ||--o{ Child : "teacher_id / caregiver_id"
  User ||--o{ Session : "started_by"
  User ||--o{ Assessment : "send_officer_id"
  User ||--o{ EmotionAlert : "recipient_user_id"

  Child ||--o{ Session : has
  Child ||--o{ Assessment : has
  Child ||--o{ EmotionAlert : triggers

  Session ||--o{ EmotionLog : contains
  Session ||--o{ CardSelection : contains

  User {
    string id PK
    string username
    string role
    string full_name
  }

  Child {
    string id PK
    string name
    string diagnosis
    string communication_level
    string interests
    string preferred_topics
  }

  Session {
    string id PK
    string session_type
    string topic
    int phase
    bool is_active
  }

  EmotionLog {
    string emotion_label
    float confidence
    int intensity
    datetime timestamp
  }

  CardSelection {
    string card_label
    string card_label_ar
    string emotion_at_selection
  }

  Assessment {
    string status
    string phase_notes
    string accommodations_tried
  }

  EmotionAlert {
    string emotion_label
    string environment
    string recipient_role
    bool acknowledged
  }
```

---

## 8. Emotion Data Flow (Privacy — No Video Stored)

```mermaid
flowchart LR
  CAM["Webcam frame<br/>(browser)"]
  UP["POST /api/emotion/detect<br/>multipart JPEG"]
  TMP["Temp file<br/>deleted after analyze"]
  DF["DeepFace.analyze"]
  LOG["EmotionLog<br/>label · confidence · intensity"]
  WS["WebSocket broadcast"]
  X["❌ No image path in DB<br/>❌ No video file stored"]

  CAM --> UP --> TMP --> DF
  DF --> LOG
  DF --> WS
  TMP -.->|os.remove| X
```

---

## 9. Session Data Model

```mermaid
flowchart TB
  S["Session<br/>id · child_id · session_type · topic · phase"]

  S --> E1["EmotionLog #1<br/>happy · 0.72"]
  S --> E2["EmotionLog #2<br/>sad · 0.61"]
  S --> E3["EmotionLog #n..."]

  S --> C1["CardSelection<br/>Help · مساعدة"]
  S --> C2["CardSelection<br/>Stop · توقف"]
  S --> C3["CardSelection #n..."]

  S --> INS["GET /api/sessions/{id}/insights<br/>distribution · top cards · duration"]
```

---

## 10. Seed Data Structure (Demo / Local Testing)

```mermaid
flowchart TB
  SEED["seed.py"]

  SEED --> U["Users (5)<br/>teacher · teacher2 · sendofficer<br/>caregiver · student"]
  SEED --> CH["Children (4)<br/>Ahmed · Layla · Omar · Sara"]
  SEED --> SES["Sessions (~63)<br/>classroom · home · assessment"]
  SEED --> EM["EmotionLogs (~104)"]
  SEED --> CS["CardSelections (~116)"]

  U -->|demo1234| LOGIN["Login for local demo"]
  CH --> SES
  SES --> EM
  SES --> CS
```

---

## 11. Student AAC Session Sequence

```mermaid
sequenceDiagram
  actor Student
  participant UI as AACSession.jsx
  participant API as FastAPI
  participant DF as DeepFace
  participant DB as SQLite

  Student->>UI: Select topic
  UI->>API: POST /api/sessions/start
  API->>DB: Create Session
  API-->>UI: session_id

  UI->>API: POST /api/cards/generate
  API-->>UI: 16 cards (EN + AR)

  loop Every 6 min (useEmotionMonitor)
    UI->>API: POST /api/emotion/detect
    API->>DF: analyze frame
    DF-->>API: emotion + confidence
    API->>DB: EmotionLog
    API-->>UI: WebSocket emotion_detected
    UI->>API: POST /api/cards/generate (if emotion changed)
  end

  Student->>UI: Tap AAC card
  UI->>API: POST /api/cards/select
  API->>DB: CardSelection

  Student->>UI: Finish session
  UI->>API: POST /api/sessions/{id}/end
```

---

## 12. Emotion Detection Sequence

```mermaid
sequenceDiagram
  participant UI as Webcam UI
  participant API as emotion_router
  participant DF as deepface_service
  participant DB as SQLite
  participant WS as /ws/session/{id}

  UI->>API: POST /detect (session_id, file)
  API->>API: Validate user + child access
  API->>DF: detect_emotion(bytes)
  DF-->>API: dominant_emotion, confidence, intensity
  API->>DB: INSERT EmotionLog
  API->>WS: broadcast emotion_detected
  API-->>UI: EmotionDetectResponse
```

---

## 13. AAC Card Generation Sequence

```mermaid
sequenceDiagram
  participant UI as AACSession
  participant API as cards_router
  participant LLM as llm_service / Ollama
  participant RULE as cards_service
  participant DB as SQLite

  UI->>API: POST /api/cards/generate<br/>emotion, topic, session_id
  API->>DB: Load Child (age, diagnosis, interests)
  API->>LLM: generate_aac_cards()
  alt LLM returns 8 valid labels
    LLM-->>API: JSON array
    API->>RULE: get_cards(llm_suggestions)
    API-->>UI: source: "llm", 16 cards
  else LLM fails or timeout
    LLM-->>API: []
    API->>RULE: get_cards(rule only)
    API-->>UI: source: "rule_based", 16 cards
  end
```

---

## 14. Six-Minute Background Monitor Flow

```mermaid
flowchart TB
  START["Session active<br/>AACSession.jsx"]

  subgraph Triggers["Triggers"]
    T1["setInterval<br/>6 min"]
    T2["Chrome extension<br/>SYNAPSE_MONITOR_TICK"]
  end

  START --> Triggers
  Triggers --> CAP["webcamRef.getScreenshot()"]
  CAP --> DET["POST /api/emotion/detect"]
  DET --> CHECK{"Cautious emotion?<br/>sad · angry · fear · disgust<br/>confidence ≥ 0.45"}

  CHECK -->|No| WAIT["Wait next interval"]
  CHECK -->|Yes| ALERT["maybe_create_emotion_alert"]
  ALERT --> WS["/ws/alerts → teacher or caregiver"]
  ALERT --> CARDS["Refresh AAC cards for emotion"]
  WAIT --> Triggers
```

---

## 15. Alert Routing Flow (School vs Home)

```mermaid
flowchart TB
  DET["Emotion detected<br/>cautious + confident"]

  DET --> SESS{"session_type?"}

  SESS -->|classroom / assessment| SCHOOL["environment: school"]
  SESS -->|home| HOME["environment: home"]

  SCHOOL --> T["recipient: child.teacher_id<br/>role: teacher"]
  HOME --> C["recipient: child.caregiver_id<br/>role: caregiver"]

  T --> WS["WebSocket /ws/alerts"]
  C --> WS

  WS --> BAN["EmotionAlertBanner.jsx"]
  BAN --> ACT["Open session / AAC cards<br/>Acknowledge alert"]

  DET --> COOL{"Alert in last 6 min?<br/>same child + emotion"}
  COOL -->|Yes| SKIP["Skip duplicate"]
  COOL -->|No| SESS
```

---

## 16. Teacher Live View Sequence

```mermaid
sequenceDiagram
  actor Student
  actor Teacher
  participant SUI as AACSession
  participant TUI as TeacherLiveSession
  participant API as FastAPI
  participant WS as WebSocket

  Student->>SUI: Start session
  Teacher->>TUI: Open live session view
  TUI->>WS: Connect /ws/session/{session_id}

  Student->>SUI: Emotion detect (manual or 6-min)
  SUI->>API: POST /api/emotion/detect
  API->>WS: emotion_detected
  WS-->>TUI: Update emotion badge / chart

  Student->>SUI: Select card
  SUI->>API: POST /api/cards/select
  Note over Teacher: Teacher sees session insights<br/>via /api/sessions/{id}/insights
```

---

## 17. PDF Report Generation Sequence

```mermaid
sequenceDiagram
  actor User as Teacher / Caregiver
  participant UI as TeacherReportsHub
  participant API as reports_router
  participant RS as report_service
  participant LLM as Ollama
  participant RL as ReportLab

  User->>UI: Generate report
  UI->>API: POST /api/reports/session/{id}/generate-pdf
  API->>API: get_session_insights()
  API->>RS: generate_bilingual_report()
  RS->>LLM: generate_assessment_narrative()
  LLM-->>RS: narrative EN
  RS-->>API: english + arabic text
  API->>RL: SimpleDocTemplate → PDF bytes
  API-->>UI: FileResponse download
```

---

## 18. Four-Role Ecosystem

```mermaid
flowchart TB
  SYN["SyNAPSE Platform"]

  SYN --> STU["Student<br/>AAC session · webcam · cards"]
  SYN --> TEA["Teacher<br/>live view · analytics · reports"]
  SYN --> SEND["SEND Officer<br/>6-phase assessment · KHDA PDF"]
  SYN --> CAR["Caregiver<br/>home session · progress · alerts"]

  STU -->|emotion + cards| TEA
  STU -->|home session| CAR
  TEA -->|session data| SEND
  CAR -->|home alerts| CAR

  STU -.->|classroom session_type| TEA
  STU -.->|home session_type| CAR
```

---

## 19. Student UI Flow

```mermaid
flowchart LR
  L["/login"] --> SPL["/student/splash<br/>SplashScreen"]
  SPL --> TOP["/student/topics<br/>TopicSelection"]
  TOP --> SES["/student/session<br/>AACSession<br/>webcam + 16 cards"]
  SES --> CEL["/student/celebration<br/>CelebrationScreen"]

  SES --> MON["useEmotionMonitor<br/>every 6 min"]
  SES --> SPK["SpeakButton TTS"]
```

---

## 20. Teacher UI Map

```mermaid
flowchart TB
  TD["/teacher/dashboard<br/>TeacherDashboard"]
  TD --> CH["/teacher/children"]
  TD --> SH["/teacher/sessions-hub"]
  TD --> RP["/teacher/reports"]
  CH --> PROF["/teacher/students/:childId"]
  CH --> HIST["/teacher/child/:child_id"]
  SH --> LIVE["/teacher/sessions/:sessionId/live"]
  SH --> ACT["/teacher/session/:child_id"]

  LIVE --> WS["WebSocket session"]
  RP --> PDF["generate-pdf"]
```

---

## 21. SEND Officer UI Map

```mermaid
flowchart TB
  SD["/send-officer/dashboard<br/>SODashboard"]
  SD --> SC["/send-officer/children"]
  SD --> AS["/send-officer/assessments"]
  SD --> RH["/send-officer/reports-hub"]

  AS --> AC["/send-officer/assessment/:id<br/>AssessmentConsole"]
  AC --> P1["Phase 1 Identification"]
  AC --> P2["Phase 2 Assessment"]
  AC --> P3["Phase 3 Planning"]
  AC --> P4["Phase 4 Implementation"]
  AC --> P5["Phase 5 Monitoring"]
  AC --> P6["Phase 6 Review"]

  RH --> RV["/send-officer/report/:id<br/>ReportViewer"]
  RH --> KHDA["khda-school-report PDF"]
```

---

## 22. Caregiver UI Map

```mermaid
flowchart TB
  CD["/caregiver/dashboard<br/>CaregiverDashboard"]
  CD --> HS["/caregiver/session<br/>HomeSession · session_type: home"]
  CD --> PV["/caregiver/progress<br/>ProgressView"]
  CD --> PR["/caregiver/privacy<br/>PrivacyPanel"]
  CD --> SET["/caregiver/settings"]

  HS --> ALERT["Receives /ws/alerts<br/>when child at home"]
```

---

## 23. KHDA Six-Phase SEND Stepper

```mermaid
flowchart LR
  P1["1 Identification"]
  P2["2 Assessment of<br/>Educational Need"]
  P3["3 Planning<br/>IEP / PLP"]
  P4["4 Implementation"]
  P5["5 Monitoring"]
  P6["6 Review"]

  P1 --> P2 --> P3 --> P4 --> P5 --> P6

  P1 -.-> N1["phase_notes JSON<br/>AssessmentConsole"]
  P2 -.-> N2["SyNAPSE assessment session"]
  P5 -.-> N5["Session analytics · emotion logs"]
  P6 -.-> N6["PDF report · KHDA summary"]
```

---

## 24. SyNAPSE ↔ KHDA Evidence Mapping

```mermaid
flowchart TB
  subgraph KHDA["KHDA SEND Phases"]
    K1["Identification"]
    K2["Assessment"]
    K3["Planning"]
    K4["Implementation"]
    K5["Monitoring"]
    K6["Review"]
  end

  subgraph SYN["SyNAPSE Features"]
    F1["Child profile · diagnosis · communication_level"]
    F2["AssessmentConsole · 6 phases"]
    F3["AAC board · bilingual cards"]
    F4["Student/teacher sessions · live WS"]
    F5["EmotionLog · CardSelection · insights"]
    F6["ReportLab PDF · khda-school-report"]
  end

  K1 --- F1
  K2 --- F2
  K3 --- F3
  K4 --- F4
  K5 --- F5
  K6 --- F6
```

---

## 25. SDG Alignment Hub

```mermaid
flowchart TB
  SYN["SyNAPSE<br/>Emotion-Aware AAC"]

  SYN --> SDG3["SDG 3<br/>Good Health & Well-Being<br/>Emotion-aware support · alerts"]
  SYN --> SDG4["SDG 4<br/>Quality Education<br/>Inclusive AAC · SEND workflows"]
  SYN --> SDG10["SDG 10<br/>Reduced Inequalities<br/>Voice for minimally verbal children"]
```

---

## 26. End-to-End Pipeline (Core Contribution)

```mermaid
flowchart LR
  A["Webcam"] --> B["DeepFace<br/>7 emotions"]
  B --> C{"Cautious?"}
  C -->|Yes| D["Alert<br/>teacher / caregiver"]
  C -->|No| E["Continue monitor"]
  B --> F["Ollama / Rules<br/>16 AAC cards"]
  F --> G["Student taps card<br/>EN + AR + TTS"]
  G --> H["CardSelection log"]
  B --> H
  H --> I["ReportLab PDF<br/>KHDA-style"]
  D --> G
```

---

## 27. API Latency Benchmark (Local)

```mermaid
xychart-beta
  title "SyNAPSE Local API Latency (seconds)"
  x-axis ["Emotion detect", "PDF report", "AAC generate (rule)"]
  y-axis "Seconds" 0 --> 26
  bar [0.303, 1.843, 24.612]
```

*Source: `backend/poster_metrics.json` — AAC LLM row is rule_based fallback timing; label honestly in caption.*

---

## 28. Seeded Demo Dataset Counts

```mermaid
xychart-beta
  title "SQLite Seed Data (synapse.db)"
  x-axis ["Sessions", "Emotion logs", "Card selections"]
  y-axis "Count" 0 --> 120
  bar [63, 104, 116]
```

*Source: `backend/poster_metrics.csv` — demo data from `seed.py`, not field collection.*

---

## Bonus: Feature Comparison (Table as Mermaid)

```mermaid
flowchart TB
  subgraph Static["Static AAC Apps"]
    A1["Fixed boards"]
    A2["No emotion"]
    A3["No SEND reports"]
  end

  subgraph Cloud["Cloud AAC + Emotion"]
    B1["Subscription / API cost"]
    B2["Video often cloud-processed"]
    B3["Limited KHDA workflow"]
  end

  subgraph Synapse["SyNAPSE (this project)"]
    C1["16 adaptive cards EN/AR"]
    C2["DeepFace + 6-min monitor"]
    C3["4 roles · WebSocket alerts"]
    C4["Local-first · no video stored"]
    C5["KHDA PDF · 6-phase assessment"]
  end
```

---

## Bonus: WebSocket Dual-Channel Architecture

```mermaid
flowchart TB
  subgraph Channels["WebSocket Channels"]
    CH1["/ws/session/{session_id}<br/>ConnectionManager"]
    CH2["/ws/alerts?token=JWT<br/>UserAlertManager"]
  end

  CH1 --> U1["Student session UI"]
  CH1 --> U2["TeacherLiveSession"]
  CH2 --> U3["Teacher AppShell"]
  CH2 --> U4["Caregiver AppShell"]

  EM["emotion_router<br/>emotion_detected"] --> CH1
  AL["alert_service<br/>emotion_alert"] --> CH2
```

---

## Bonus: AAC Board Composition (16 Cards)

```mermaid
pie showData
  title AAC Board Layout (get_cards)
  "Core (8)" : 8
  "Emotion (4)" : 4
  "Topic (4)" : 4
```

---

## Usage tips

| Tool | How |
|------|-----|
| **mermaid.live** | Paste one block → Export PNG/SVG |
| **VS Code** | Markdown preview with Mermaid extension |
| **Word report** | Export SVG from mermaid.live → Insert image |
| **Poster** | Export 300 DPI PNG; diagrams 1, 11, 18, 23, 25, 27, 28 recommended |

**Caption for all evaluation charts:** *Prototype testing on seeded local data (`seed.py`); no user surveys or field data collection conducted.*
