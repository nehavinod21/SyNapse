const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, ImageRun,
  VerticalAlign, SectionType,
} = require("docx");
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const FONT = "Times New Roman";

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: 20, ...opts })],
  });
}

function h1(text, num) {
  const label = num ? `${num}. ${text.toUpperCase()}` : text.toUpperCase();
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: label, font: FONT, size: 22, bold: true })],
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, font: FONT, size: 20, bold: true, italics: true })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 260 },
    children: [new TextRun({ text: "• " + text, font: FONT, size: 20 })],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 160 },
    children: [new TextRun({ text, font: FONT, size: 18 })],
  });
}

function makeTableCell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "D9D9D9" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({ text, font: FONT, size: 17, bold: !!opts.header })],
      }),
    ],
  });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      makeTableCell(h, { header: true, width: colWidths[i], align: AlignmentType.CENTER })
    ),
  });
  const dataRows = rows.map((r) =>
    new TableRow({
      children: r.map((c, i) =>
        makeTableCell(String(c), {
          width: colWidths[i],
          align: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
        })
      ),
    })
  );
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: BorderStyle.NIL },
      right: { style: BorderStyle.NIL },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "999999" },
      insideVertical: { style: BorderStyle.NIL },
    },
  });
}

function imgParagraph(filename, widthPx, heightPx) {
  const filePath = path.join(DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing figure: ${filePath}`);
  }
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120 },
    children: [
      new ImageRun({
        type: "png",
        data: fs.readFileSync(filePath),
        transformation: { width: widthPx, height: heightPx },
      }),
    ],
  });
}

const titlePara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [
    new TextRun({
      text: "A Role-Based Access Control Audit and Local-First Service Architecture for an Emotion-Aware AAC Platform: SyNAPSE",
      font: FONT,
      size: 30,
      bold: true,
    }),
  ],
});

const authorPara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 20 },
  children: [new TextRun({ text: "1st Neha Vinod", font: FONT, size: 20 })],
});
const authorAff1 = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [
    new TextRun({
      text: "School of Engineering and IT, Manipal Academy of Higher Education, Dubai Campus",
      font: FONT,
      size: 18,
      italics: true,
    }),
    new TextRun({ text: "Dubai, UAE — neha.vinod@dxb.manipal.edu", font: FONT, size: 18, break: 1 }),
  ],
});
const authorPara2 = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 20 },
  children: [new TextRun({ text: "2nd Dr. Raja Varma Pamba", font: FONT, size: 20 })],
});
const authorAff2 = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [
    new TextRun({
      text: "School of Engineering and IT, Manipal Academy of Higher Education, Dubai Campus",
      font: FONT,
      size: 18,
      italics: true,
    }),
    new TextRun({ text: "Dubai, UAE — pamba.rajavarma@manipaldubai.com", font: FONT, size: 18, break: 1 }),
  ],
});

const abstractText =
  "We report a role-based access control (RBAC) audit and local-first service architecture for SyNAPSE, an emotion-aware Augmentative and Alternative Communication (AAC) platform for minimally verbal children. A systematic audit of the deployed FastAPI/SQLite backend (44 REST endpoints, 2 WebSocket channels, 21 tables) located and corrected two real access-control vulnerabilities: an over-restrictive report-generation ACL incorrectly denying legitimate roles, and a variable-shadowing bug causing unauthorized probes to fail at the transport layer instead of returning a clean 403. Post-fix benchmarking across 168 authenticated requests (4 roles × 42 protected endpoint patterns) confirmed 168/168 (100%) policy-correct outcomes. The architecture additionally enforces data minimisation at the schema level: EmotionLog stores labels and confidence only (no image paths), and no binary image/video blob column exists in the schema; video_models.url holds external reference URLs only. We report reproducible system-performance benchmarks (PDF generation, WebSocket alert delivery, LLM-based card generation, rule-based fallback triggering) and, separately and clearly labelled as preliminary, a small facial-emotion-recognition pilot (n=12, 41.7% top-1 accuracy, macro-F1 = 0.500 over the three ground-truth classes present) including the diagnosed root cause of an earlier invalid 0% baseline. We present this as a software-security and systems-architecture contribution with an explicit, code-verified accounting of what is validated versus what remains open.";

const abstractPara = new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 100 },
  children: [
    new TextRun({ text: "Abstract— ", font: FONT, size: 20, bold: true, italics: true }),
    new TextRun({ text: abstractText, font: FONT, size: 20, italics: true }),
  ],
});

const keywordsPara = new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 240 },
  children: [
    new TextRun({ text: "Index Terms— ", font: FONT, size: 20, bold: true, italics: true }),
    new TextRun({
      text: "role-based access control, software security audit, service-oriented architecture, augmentative and alternative communication, data minimisation, local large language models, facial emotion recognition, neurodiversity",
      font: FONT,
      size: 20,
      italics: true,
    }),
  ],
});

const techStackTable = makeTable(
  ["Layer", "Choice"],
  [
    ["Frontend", "React 18, Vite, TailwindCSS"],
    ["API", "FastAPI, Uvicorn, python-jose JWT"],
    ["Persistence", "SQLite, SQLAlchemy (21 tables)"],
    ["Expression", "DeepFace, OpenCV detector, 320px cap"],
    ["LLM", "Ollama llama3, JSON parse + rule fallback"],
    ["Reports", "ReportLab (A4 PDF)"],
    ["Realtime", "/ws/session/{id}, /ws/alerts"],
  ],
  [1800, 2880]
);

const apiTable = makeTable(
  ["Router", "Prefix", "#"],
  [
    ["auth", "/auth", "3"],
    ["children", "/api/children", "4"],
    ["sessions", "/api/sessions", "5"],
    ["emotion", "/api/emotion", "1"],
    ["cards", "/api/cards", "2"],
    ["assessments", "/api/assessments", "6"],
    ["reports", "/api/reports", "8"],
    ["send", "/api/send", "2"],
    ["teacher", "/teacher", "9"],
    ["alerts", "/api/alerts", "2"],
    ["support", "/api/support", "1"],
    ["main", "/, /health", "2"],
  ],
  [1600, 2200, 880]
);

const cardTable = makeTable(
  ["English", "Arabic"],
  [
    ["I want", "أريد"],
    ["Stop", "توقف"],
    ["More", "المزيد"],
    ["All done", "انتهى"],
    ["I need help", "أحتاج مساعدة"],
    ["Yes", "نعم"],
    ["No", "لا"],
    ["Wait", "انتظر"],
  ],
  [2340, 2340]
);

const accountsTable = makeTable(
  ["Username", "Role", "Full name"],
  [
    ["student", "student", "Ahmed Al Mansoori"],
    ["teacher", "teacher", "Ms. Sarah Ahmed"],
    ["teacher2", "teacher", "Mr. James Wilson"],
    ["caregiver", "caregiver", "Fatima Al Rashidi"],
    ["sendofficer", "send_officer", "Dr. Khalid Al Mansoori"],
  ],
  [1400, 1400, 1880]
);

const scriptTable = makeTable(
  ["Benchmark script", "Output CSV"],
  [
    ["bench_pdf_generation.py", "pdf_generation_benchmark.csv"],
    ["bench_llm_card_generation.py", "llm_card_generation_benchmark.csv"],
    ["bench_websocket_latency.py", "websocket_latency.csv"],
    ["bench_fallback_trigger_rate.py", "fallback_trigger_rate.csv"],
    ["bench_emotion_detection_accuracy.py", "emotion_detection_accuracy.csv"],
    ["bench_alert_precision_recall.py", "alert_precision_recall.csv"],
    ["bench_role_access_matrix.py", "role_access_matrix.csv"],
    ["bench_functional_coverage.py", "functional_test_coverage.csv"],
  ],
  [2500, 2180]
);

const pytestTable = makeTable(
  ["Test file", "Tests", "Covers"],
  [
    ["test_auth.py", "4", "login, wrong password, protected route, valid token"],
    ["test_rbac.py", "7", "report access ×4 roles; teacher 403 ×3 roles"],
    ["test_emotion_pipeline.py", "2", "real face label; blank image handling"],
  ],
  [1500, 500, 2680]
);

const frameTable = makeTable(
  ["Frame", "Truth", "Pred.", "Conf.", "OK"],
  [
    ["f001", "angry", "fear", "0.72", "N"],
    ["f002", "angry", "neutral", "0.90", "N"],
    ["f003", "angry", "angry", "0.95", "Y"],
    ["f004", "angry", "angry", "1.00", "Y"],
    ["f005", "angry", "sad", "0.40", "N"],
    ["f006", "disgust", "sad", "0.98", "N"],
    ["f007", "disgust", "angry", "0.53", "N"],
    ["f008", "disgust", "fear", "1.00", "N"],
    ["f009", "disgust", "disgust", "0.99", "Y"],
    ["f010", "disgust", "neutral", "0.59", "N"],
    ["f011", "fear", "fear", "0.74", "Y"],
    ["f012", "fear", "fear", "0.96", "Y"],
  ],
  [800, 1080, 1080, 700, 520]
);

const perfTable = makeTable(
  ["Metric", "n", "Mean", "Med.", "Max"],
  [
    ["PDF generation (s)", "30", "0.317", "0.199", "1.010"],
    ["LLM card gen. (s)", "36", "10.56", "7.36", "36.18"],
    ["WebSocket alert (s)", "30", "0.724", "0.698", "1.233"],
  ],
  [1980, 620, 780, 780, 720]
);

const fallbackNote = new Paragraph({
  spacing: { after: 160 },
  children: [
    new TextRun({
      text: "LLM fallback: 22 of 120 trials (18.3%) — all triggered by malformed JSON output; no timeouts observed.",
      font: FONT,
      size: 17,
      italics: true,
    }),
  ],
});

const emotionTable = makeTable(
  ["Metric", "Value", "Notes"],
  [
    ["Top-1 accuracy", "41.7% (5/12)", "3-class subset only"],
    ["Macro-F1 (present classes)", "0.500", "over angry/disgust/fear only"],
    ["Macro-F1 (all predicted)", "0.30", "incl. neutral/sad as label classes"],
    ["Classes present", "angry(5), disgust(5), fear(2)", "not balanced across 7 classes"],
    ["Best-recognized", "fear (2/2)", "small n"],
    ["Weakest", "disgust (1/5)", "confused with sad/fear/neutral"],
  ],
  [1580, 1500, 1600]
);

const alertTable = makeTable(
  ["Threshold", "Precision", "Recall", "TP/FN/FP"],
  [
    ["0.25", "1.000", "0.833", "10 / 2 / 0"],
    ["0.35 (default)", "1.000", "0.833", "10 / 2 / 0"],
    ["0.45", "1.000", "0.750", "9 / 3 / 0"],
  ],
  [1600, 1200, 1200, 1180]
);

const rbacTable = makeTable(
  ["Check", "Result"],
  [
    ["Total probes", "168 (4 roles × 42 protected patterns)"],
    ["Policy-correct", "168 (100%)"],
    ["Fix A", "reports_router.py — student/SEND-officer report access (was 403, now 200)"],
    ["Fix B", "teacher_router.py — variable-shadowing bug causing status-0 transport errors on unauthorized probes; now returns clean 403"],
  ],
  [1500, 3180]
);

const bodyChildren = [];

bodyChildren.push(h1("Introduction", "I"));
bodyChildren.push(
  body(
    "Augmentative and Alternative Communication (AAC) systems enable minimally verbal children — including many with autism spectrum disorder and cerebral palsy — to express needs through symbols, text, or speech output. Commercial AAC tools typically use static vocabulary grids and cloud backends, which complicates real-time affect-aware adaptation and raises privacy concerns when webcam frames could be retained or transmitted off-device. Schools in inclusive-education jurisdictions additionally require audit trails for special-educational-needs (SEND) reporting without expanding biometric data retention."
  )
);
bodyChildren.push(
  body(
    "Prior AAC and machine-learning prototypes typically address a single concern in isolation — either facial expression recognition, or LLM-assisted phrase generation, or multi-role dashboards — rather than combining local inference, zero-retention affect logging, multi-role API enforcement, and reproducible benchmarking in one deployable stack. SyNAPSE addresses this gap directly, and — distinctively — this paper audits its own quantitative claims against the running codebase and CSV benchmark artifacts, reporting corrections and open gaps rather than only intended behavior."
  )
);
bodyChildren.push(h2("Research Questions"));
bodyChildren.push(
  bullet("RQ1: Can a single-machine stack meet interactive AAC latency budgets while keeping biometric-adjacent data ephemeral?")
);
bodyChildren.push(
  bullet("RQ2: Does JWT-based RBAC enforce school-appropriate role separation across REST and WebSocket paths, and what failure modes does a direct audit surface?")
);
bodyChildren.push(
  bullet("RQ3: Which system components — LLM JSON reliability, facial-expression integration, or report-access control — dominate observed failure modes under reproducible benchmarking?")
);
bodyChildren.push(h2("Contributions"));
bodyChildren.push(
  bullet(
    "An integrated, local-first architecture combining React, FastAPI, SQLite (21 tables), DeepFace, and Ollama llama3, with a verified zero-retention emotion-logging schema."
  )
);
bodyChildren.push(
  bullet(
    "A four-role RBAC scheme benchmarked at 168/168 (100%) policy-correct outcomes, after two corrective fixes located and applied during audit."
  )
);
bodyChildren.push(
  bullet(
    "A reproducible benchmark suite producing CSV artifacts for latency, reliability, access control, and emotion-classification accuracy."
  )
);
bodyChildren.push(
  bullet(
    "An explicit, code-verified accounting that separates validated results (latency, RBAC) from a modest, honestly-reported preliminary emotion-recognition pilot, including the diagnosed root cause of an earlier invalid 0% baseline."
  )
);

bodyChildren.push(h1("Related Work", "II"));
bodyChildren.push(
  body(
    "Ekman and Friesen's categorical model of facial expression underlies most modern facial emotion recognition (FER) tooling, including the FER-2013 benchmark used for this paper's emotion pilot. DeepFace packages deep convolutional face analysis behind an accessible API and is used here as an integration component rather than a novel classifier. Core-vocabulary AAC design (want, help, more, stop) remains the dominant basis for both unaided and aided communication tools; prior surveys note that most commercial AAC apps rely on preprogrammed symbol hierarchies that do not adapt to a user's real-time emotional state. Separately, engagement-detection research using video-based facial and physiological signals has grown as an active affective-computing thread, and local large language model deployment (via Ollama) is increasingly viable for on-device, privacy-preserving text generation. UAE educational-inclusion policy (KHDA) and general data-protection law (UAE Federal Decree-Law No. 45 of 2021) require data minimisation specifically for biometric processing, which motivates this system's schema-level, verifiable zero-retention design."
  )
);

bodyChildren.push(h1("System Architecture", "III"));
bodyChildren.push(h2("Design Principles"));
bodyChildren.push(
  body(
    "Local-first: DeepFace and Ollama run on the same machine as the API, with no external SaaS dependency. Data minimisation: the EmotionLog table stores only emotion_label, confidence, intensity, and timestamp — no image path column. Graceful degradation: malformed LLM JSON output triggers a deterministic rule-based card template rather than an empty AAC board. Role separation: JWT claims gate each router, and child–teacher–caregiver foreign keys scope every query."
  )
);
bodyChildren.push(imgParagraph("fig1_architecture.png", 290, 141));
bodyChildren.push(
  caption("Fig. 1. Local-first SyNAPSE architecture. Webcam frames are processed in memory; only derived affect labels persist to SQLite.")
);
bodyChildren.push(h2("Session and Alert Pipeline"));
bodyChildren.push(
  body(
    "Emotion capture is user-triggered, not continuous polling. POST /api/emotion/detect resizes each frame to a maximum dimension of 320px, runs DeepFace with an OpenCV detector backend under a threading lock, writes an EmotionLog row, and evaluates an alert condition when the predicted emotion is in a cautious set (sad, angry, fear, disgust, ...) and confidence exceeds a configurable threshold (default 0.35), broadcasting over /ws/alerts. POST /api/cards/generate then queries Ollama (120 s timeout) and assembles a 16-card board."
  )
);
bodyChildren.push(imgParagraph("fig2_pipeline.png", 290, 129));
bodyChildren.push(
  caption("Fig. 2. On-demand emotion detection, zero-retention logging, optional WebSocket alert, and adaptive card generation.")
);
bodyChildren.push(h2("Alert and Preprocessing Rules"));
bodyChildren.push(
  body(
    "Alert triggering (alert_service.py): the cautious-emotion set is {sad, angry, fear, disgust, distress, scared, frustrated}; MIN_ALERT_CONFIDENCE = 0.35; ALERT_COOLDOWN_SECONDS = 45 to limit caregiver notification fatigue. DeepFace preprocessing (deepface_service.py): frames are capped at 320px on the longest dimension, passed through a Haar-cascade face crop, histogram-equalized, and upscaled to 224px for small crops; a placeholder/blank-image rejection check runs before inference, and a threading.Lock serializes concurrent DeepFace calls. Allowed output labels are the seven DeepFace classes {happy, sad, angry, fear, disgust, surprise, neutral}."
  )
);
bodyChildren.push(h2("Technology Stack"));
bodyChildren.push(techStackTable);
bodyChildren.push(caption("TABLE I. Technology stack (deployed prototype)."));

bodyChildren.push(h1("Implementation", "IV"));
bodyChildren.push(h2("API Surface and RBAC"));
bodyChildren.push(
  body(
    "SyNAPSE exposes 44 REST endpoints across 10 functional routers plus / and /health in main.py, and 2 WebSocket channels — 46 total surfaces. Four roles are supported: student, teacher, caregiver, and send_officer. Students are bound to their own child profile; teachers and caregivers are scoped via foreign keys; SEND officers access assessment and school-reporting dashboards."
  )
);
bodyChildren.push(apiTable);
bodyChildren.push(caption("TABLE II. REST endpoint counts by router (WebSockets counted separately)."));
bodyChildren.push(h2("AAC Card Model"));
bodyChildren.push(
  body(
    "cards_service.py returns exactly 16 cards per board: eight bilingual core-vocabulary symbols, four emotion-matched cards keyed to the detected label, and four topic-specific cards drawn from LLM output when at least six valid labels are returned, otherwise from a deterministic rule-based fallback. Card selections persist with the emotion recorded at selection time, supporting later session analytics. Benchmark topics used for LLM generation: school, home, play, food, feelings, body."
  )
);
bodyChildren.push(cardTable);
bodyChildren.push(caption("TABLE III. The eight fixed bilingual core-vocabulary cards."));
bodyChildren.push(h2("Database Schema"));
bodyChildren.push(
  body(
    "The 21-table SQLite schema comprises: users, children, sessions, emotion_logs, card_selections, emotion_alerts, assessments, routine_templates, routine_steps, sensory_profiles, calm_corner_sessions, break_activities, break_logs, reward_goals, reward_events, badges, video_models, self_reports, display_preferences, shared_notes, and pre_event_plans. EmotionLog explicitly forbids image storage; video_models.url stores external reference URLs only (no binary blobs)."
  )
);
bodyChildren.push(h2("Evaluation Accounts"));
bodyChildren.push(
  body(
    "Benchmarks were run against five seeded development accounts spanning all four roles (Table IV), used exclusively for local, non-production testing."
  )
);
bodyChildren.push(accountsTable);
bodyChildren.push(caption("TABLE IV. Seeded development accounts used for benchmarking (credentials omitted)."));

bodyChildren.push(h1("Evaluation Methodology", "V"));
bodyChildren.push(
  body(
    "Eight benchmark scripts under synapse/tests/evaluation/ write reproducible CSV artifacts to results/ (Table V), covering PDF generation, LLM card generation, WebSocket alert latency, LLM fallback triggering, role-access control, alert-threshold sensitivity, emotion-detection accuracy, and functional coverage."
  )
);
bodyChildren.push(scriptTable);
bodyChildren.push(caption("TABLE V. Benchmark script inventory and CSV outputs."));
bodyChildren.push(
  body(
    "A starter pytest suite (13 tests, Table VI) covers authentication, RBAC, and the emotion pipeline; a separate endpoint-level coverage inventory (functional_test_coverage.csv, 46 rows) shows direct per-endpoint test mapping for 3 of 46 surfaces, indicating the pytest suite currently exercises shared logic paths rather than providing full per-endpoint coverage — an open item for future work."
  )
);
bodyChildren.push(pytestTable);
bodyChildren.push(caption("TABLE VI. Automated pytest suite (13 tests total)."));
bodyChildren.push(
  body(
    "Hardware: single developer workstation, CPU-only inference, local Ollama. Benchmark run date: 2026-09-01 UTC. Threats to validity: single-machine measurement, seeded/simulated data, no child participants; the emotion-recognition pilot uses n=12 real face crops spanning only 3 of 7 target emotion classes, which is insufficient for any generalizable accuracy claim."
  )
);

bodyChildren.push(h1("Results", "VI"));
bodyChildren.push(h2("Latency and Reliability"));
bodyChildren.push(
  body(
    "Table VII reports verified statistics computed directly from the current benchmark CSV outputs. LLM card-generation latency is right-skewed (median 7.36 s below mean 10.56 s), with four runs exceeding 20 s (max 36.18 s). All 22 fallback events (18.3% of 120 trials) were triggered by malformed JSON output; no timeout-triggered fallbacks occurred in this run."
  )
);
bodyChildren.push(perfTable);
bodyChildren.push(caption("TABLE VII. Performance benchmarks, computed from current CSV artifacts."));
bodyChildren.push(fallbackNote);
bodyChildren.push(h2("Role-Based Access Control"));
bodyChildren.push(
  body(
    "168 authenticated requests (4 roles × 42 protected endpoint patterns) were executed against the deployed API. All 168 (100%) matched expected policy, following two corrective fixes located during audit and confirmed against the current benchmark run. Prior to the fixes, 10 of 168 probes failed: 4 were genuine over-restrictive denials on session report/PDF routes, and 6 were teacher-dashboard routes returning a transport-level status 0 instead of a clean 403 for unauthorized roles."
  )
);
bodyChildren.push(rbacTable);
bodyChildren.push(caption("TABLE VIII. Role-based access control audit outcome."));
bodyChildren.push(h2("Emotion Recognition Pilot (Preliminary)"));
bodyChildren.push(
  body(
    "An earlier benchmark run reported 0/12 accuracy; inspection traced this to placeholder fixture images (flat-colored rectangles with a featureless gray oval, containing no facial structure) combined with a permissive face-detection setting that allowed DeepFace to return a confident label on non-facial input. After replacing these fixtures with real face crops, the current benchmark yields 41.7% top-1 accuracy (5/12, Table IX). Macro-F1 depends on the label set used: 0.500 when computed over only the three ground-truth classes present in this pilot (angry, disgust, fear), or 0.30 when neutral and sad are also scored as label categories (union of predicted labels). Table X gives the full per-frame breakdown."
  )
);
bodyChildren.push(emotionTable);
bodyChildren.push(caption("TABLE IX. Preliminary emotion-recognition pilot summary (n=12)."));
bodyChildren.push(frameTable);
bodyChildren.push(caption("TABLE X. Per-frame emotion pilot results (emotion_detection_accuracy.csv)."));
bodyChildren.push(
  body(
    "We report this modest result directly rather than substituting a more favorable unverified figure: the current fixture set covers only 3 of 7 target emotion classes and is imbalanced (5 angry, 5 disgust, 2 fear), so this pilot demonstrates that the pipeline is now measuring something real, not that classifier accuracy is validated."
  )
);
bodyChildren.push(h2("Alert Threshold Sensitivity"));
bodyChildren.push(
  body(
    "Table XI reports precision and recall of the distress-alert trigger at three confidence thresholds on the same 12-frame set. Precision is perfect (no false alarms) at all three thresholds tested; recall degrades from 0.833 at 0.25–0.35 to 0.750 at 0.45. Frames f002 and f010 are missed at every tested threshold, both predicted 'neutral' rather than a cautious label."
  )
);
bodyChildren.push(alertTable);
bodyChildren.push(caption("TABLE XI. Alert-threshold sensitivity (n=12 frames per threshold)."));

bodyChildren.push(h1("Discussion", "VII"));
bodyChildren.push(
  body(
    "Validated strengths: PDF report generation and WebSocket alert delivery are both comfortably within interactive latency budgets for a classroom setting. The rule-based LLM fallback measurably prevents an empty AAC board when generation fails. RBAC enforces role separation correctly across all 168 probes following two located and fixed bugs — a genuine audit finding, not merely a corrected test harness."
  )
);
bodyChildren.push(
  body(
    "Open risks: emotion-recognition accuracy (41.7%, macro-F1 0.500 over present classes) is preliminary, measured on a small and class-imbalanced sample, and must not be read as a validated accuracy claim for the deployed system or for the target population. LLM card-generation latency (median 7.36 s, max 36.18 s) warrants further investigation into warm-up behavior or a smaller quantized model. Per-endpoint automated test coverage (3 of 46) remains limited and should be expanded beyond the current auth/RBAC/emotion-pipeline pytest suite."
  )
);
bodyChildren.push(h2("Explicit Scope Limits"));
bodyChildren.push(
  body(
    "To avoid overstatement, we explicitly do not claim: state-of-the-art facial emotion recognition; continuous 2 fps webcam polling (capture is user-triggered only); continuous background monitoring of children; or validated clinical or educational efficacy. This system has not been evaluated with child participants and is not deployment-ready for classroom use without further evaluation and ethics approval."
  )
);
bodyChildren.push(
  body(
    "AI disclosure: manuscript drafting used AI writing assistance; all quantitative claims in this draft were verified by the authors directly against source code and current CSV benchmark artifacts, consistent with IEEE/ICAMAC AI-use policy."
  )
);
bodyChildren.push(
  body(
    "Topic alignment: this paper's primary contribution is a software-security audit (RBAC vulnerability discovery and correction) and a service-oriented systems architecture, aligning with ICAMAC Software Security and Software Architectures tracks; data-minimisation verification aligns with Ethics in AI. Facial expression detection is present only as an integrated, non-novel component with a clearly preliminary evaluation, and is not the paper's central claim."
  )
);

bodyChildren.push(h1("Conclusion", "VIII"));
bodyChildren.push(
  body(
    "SyNAPSE demonstrates a reproducibly measured, local-first, emotion-aware AAC architecture integrating DeepFace, Ollama llama3, FastAPI, and multi-stakeholder school workflows. Verified results cover PDF and WebSocket latency, LLM generation timing and fallback behavior, and 100% (168/168) RBAC correctness following an audit that located and fixed two real access-control bugs. A preliminary emotion-recognition pilot yields a modest, honestly-reported 41.7% accuracy on a small, imbalanced sample, with a clearly diagnosed root cause for an earlier invalid baseline. Immediate next steps are: (1) rebuild the emotion-recognition fixture set with a larger, class-balanced sample; (2) expand per-endpoint automated test coverage beyond the current three endpoints; and (3) re-run the full benchmark suite once these are complete, updating all reported figures accordingly before submission."
  )
);

bodyChildren.push(h1("References", ""));
const refs = [
  "American Speech-Language-Hearing Association, “Augmentative and Alternative Communication (AAC),” ASHA Practice Portal, 2023.",
  "D. R. Beukelman and P. Mirenda, Augmentative and Alternative Communication: Supporting Children and Adults with Complex Communication Needs, 5th ed. Baltimore, MD: Brookes Publishing, 2013.",
  "P. Ekman and W. V. Friesen, Facial Action Coding System. Palo Alto, CA: Consulting Psychologists Press, 1978.",
  "S. I. Serengil and A. Ozpinar, “LightFace: A hybrid deep face recognition framework,” in Proc. IEEE ASYU, 2020, pp. 1–5.",
  "H. Monkaresi, N. Bosch, R. A. Calvo, and S. K. D'Mello, “Automated detection of engagement using video-based estimation of facial expressions and heart rate,” IEEE Trans. Affective Computing, vol. 8, no. 1, pp. 15–28, 2017.",
  "M. A. Harms et al., “Facial emotion recognition in autism spectrum disorder: A systematic review,” Neuroscience & Biobehavioral Reviews, vol. 137, 2022.",
  "I. J. Goodfellow et al., “Challenges in representation learning: Facial expression recognition challenge,” 2013.",
  "Ollama, “Run large language models locally,” 2024. [Online]. Available: https://ollama.ai",
  "Knowledge and Human Development Authority (KHDA), “Inclusive Education Policy for Private Schools in Dubai,” 2020.",
  "UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data, United Arab Emirates, 2021.",
  "S. Ramírez, “FastAPI,” 2018. [Online]. Available: https://fastapi.tiangolo.com",
  "React Team, “React,” 2024. [Online]. Available: https://react.dev",
];
refs.forEach((r, i) => {
  bodyChildren.push(
    new Paragraph({
      spacing: { after: 60 },
      indent: { left: 200, hanging: 200 },
      children: [
        new TextRun({ text: `[${i + 1}] `, font: FONT, size: 17 }),
        new TextRun({ text: r, font: FONT, size: 17 }),
      ],
    })
  );
});

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
      },
      children: [titlePara, authorPara, authorAff1, authorPara2, authorAff2, abstractPara, keywordsPara],
    },
    {
      properties: {
        type: SectionType.CONTINUOUS,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
        column: { count: 2, space: 420 },
      },
      children: bodyChildren,
    },
  ],
});

const outPath = path.join(DIR, "SyNAPSE_ICAMAC2026.docx");

Packer.toBuffer(doc)
  .then((buf) => {
    fs.writeFileSync(outPath, buf);
    console.log("saved:", outPath, "bytes:", buf.length);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
