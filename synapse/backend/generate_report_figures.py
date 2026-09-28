"""
Generate thesis/report-style figures for SyNAPSE (like ML project reports).

Install once:
  pip install matplotlib seaborn scikit-learn opencv-python-headless

Usage:
  cd backend
  python generate_report_figures.py

Outputs PNG files in backend/figures/

Optional — inference panel for one face image:
  python generate_report_figures.py --image path/to/face.jpg

Optional — confusion matrix (needs labeled folder):
  python generate_report_figures.py --labeled-dir test_faces/
  Folder layout: test_faces/happy/img1.jpg, test_faces/sad/img2.jpg, ...

Caption honestly: seeded DB + local API benchmarks; confusion matrix only if you supply labeled test images.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from collections import Counter
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

OUT = Path(__file__).resolve().parent / "figures"
DB = Path(__file__).resolve().parent / "synapse.db"
METRICS = Path(__file__).resolve().parent / "poster_metrics.json"

EMOTIONS = ["happy", "sad", "angry", "fear", "disgust", "surprise", "neutral"]

sns.set_theme(style="whitegrid", font_scale=1.05)
plt.rcParams["figure.dpi"] = 150


def ensure_out() -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    return OUT


def fig_api_latency_bar() -> Path:
    """Fig 6.1 style — bar chart with % or seconds on bars."""
    data = json.loads(METRICS.read_text(encoding="utf-8"))
    labels = ["Emotion detect", "PDF report", "AAC cards (rule)"]
    values = [
        data["emotion_detection_latency"]["mean_s"],
        data["pdf_report_generation_latency"]["mean_s"],
        data["aac_card_generation_latency"]["mean_s"],
    ]
    colors = ["#4C78A8", "#72B7B2", "#F58518"]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(labels, values, color=colors, edgecolor="white", linewidth=0.8)
    ax.set_ylabel("Mean latency (seconds)")
    ax.set_xlabel("Pipeline step")
    ax.set_title("SyNAPSE API Performance (Local benchmark, n=10)")
    ax.set_ylim(0, max(values) * 1.15)
    for bar, val in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.3,
            f"{val:.2f}s",
            ha="center",
            va="bottom",
            fontsize=10,
            fontweight="bold",
        )
    fig.tight_layout()
    path = ensure_out() / "fig_6_1_api_latency.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_feature_comparison_bar() -> Path:
    """Fig 6.1 style — qualitative feature score comparison (design evaluation, not ML accuracy)."""
    categories = ["Static AAC", "Cloud emotion AAC", "SyNAPSE"]
    scores = {
        "Emotion-aware": [1, 3, 5],
        "Bilingual EN/AR": [2, 3, 5],
        "SEND / KHDA workflow": [1, 2, 5],
        "Local / privacy": [3, 1, 5],
        "4-role alerts": [1, 2, 5],
    }
    x = np.arange(len(categories))
    width = 0.15
    colors = ["#54A24B", "#E45756", "#B279A2", "#FF9DA6", "#9D755D"]

    fig, ax = plt.subplots(figsize=(9, 5))
    for i, (name, vals) in enumerate(scores.items()):
        offset = (i - len(scores) / 2) * width + width / 2
        bars = ax.bar(x + offset, vals, width, label=name, color=colors[i % len(colors)])
        for bar, val in zip(bars, vals):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05, str(val), ha="center", fontsize=8)

    ax.set_ylabel("Score (1–5, design rubric)")
    ax.set_xlabel("Approach")
    ax.set_title("Feature Comparison (Design evaluation — not field accuracy)")
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.set_ylim(0, 5.8)
    ax.legend(loc="upper left", fontsize=8, ncol=2)
    fig.tight_layout()
    path = ensure_out() / "fig_feature_comparison.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_emotion_distribution() -> Path:
    """Bar chart of emotion labels in seeded synapse.db (not a confusion matrix)."""
    if not DB.exists():
        raise FileNotFoundError(f"Run seed first: {DB}")

    conn = sqlite3.connect(DB)
    rows = conn.execute("SELECT emotion_label, COUNT(*) FROM emotion_logs GROUP BY emotion_label").fetchall()
    conn.close()

    counts = Counter({r[0]: r[1] for r in rows})
    labels = [e for e in EMOTIONS if counts.get(e, 0) > 0] or [r[0] for r in rows]
    values = [counts[l] for l in labels]

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(labels, values, color=sns.color_palette("Blues", len(labels)))
    ax.set_ylabel("Count")
    ax.set_xlabel("Emotion label")
    ax.set_title("EmotionLog distribution (seeded demo data, synapse.db)")
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5, str(val), ha="center", fontsize=9)
    fig.tight_layout()
    path = ensure_out() / "fig_emotion_distribution.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_confusion_matrix(labeled_dir: Path) -> Path | None:
    """
  Needs folder: labeled_dir/<emotion>/*.jpg
  Compares DeepFace dominant emotion vs folder label.
    """
    import asyncio

    y_true: list[str] = []
    y_pred: list[str] = []

    for label in EMOTIONS:
        folder = labeled_dir / label
        if not folder.is_dir():
            continue
        for img_path in sorted(folder.glob("*")):
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                continue
            image_bytes = img_path.read_bytes()
            result = asyncio.run(detect_emotion(image_bytes))
            y_true.append(label)
            y_pred.append(str(result.get("emotion", "neutral")))

    if len(y_true) < 5:
        print("Skipping confusion matrix — need labeled_dir/<emotion>/*.jpg (min ~5 images)")
        return None

    from sklearn.metrics import confusion_matrix

    labels_present = sorted(set(y_true) | set(y_pred))
    cm = confusion_matrix(y_true, y_pred, labels=labels_present)

    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=labels_present,
        yticklabels=labels_present,
        ax=ax,
        cbar_kws={"label": "Count"},
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("DeepFace emotion confusion matrix (labeled test set)")
    fig.tight_layout()
    path = ensure_out() / "fig_6_2_confusion_matrix.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


async def detect_emotion(image_bytes: bytes) -> dict:
    from services.deepface_service import detect_emotion as _detect

    return await _detect(image_bytes)


def fig_inference_panel(image_path: Path) -> Path:
    """Fig 6.3 style — original | preprocessed | prediction text."""
    import asyncio
    import cv2
    from services.deepface_service import detect_emotion as _detect

    raw = cv2.imread(str(image_path))
    if raw is None:
        raise ValueError(f"Cannot read image: {image_path}")

    gray = cv2.cvtColor(raw, cv2.COLOR_BGR2GRAY)
    gray_rgb = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
    _, buf = cv2.imencode(".jpg", raw)
    result = asyncio.run(_detect(buf.tobytes()))
    emotion = result.get("emotion", "neutral")
    confidence = float(result.get("confidence", 0)) * 100
    scores = result.get("all_scores") or {}
    top = sorted(scores.items(), key=lambda x: -x[1])[:4]

    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    axes[0].imshow(cv2.cvtColor(raw, cv2.COLOR_BGR2RGB))
    axes[0].set_title("Input frame")
    axes[0].axis("off")

    axes[1].imshow(gray_rgb)
    axes[1].set_title("Preprocessed (grayscale)")
    axes[1].axis("off")

    axes[2].axis("off")
    lines = [
        "SyNAPSE / DeepFace output",
        "",
        f"Emotion: {emotion} ({confidence:.1f}%)",
        "",
        "Top scores:",
    ]
    for name, score in top:
        lines.append(f"  {name}: {float(score) * 100:.1f}%")
    axes[2].text(0.05, 0.95, "\n".join(lines), va="top", fontsize=11, family="monospace")

    fig.suptitle(f"Inference visualization — {image_path.name}", fontsize=12)
    fig.tight_layout()
    path = ensure_out() / f"fig_inference_{image_path.stem}.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_pipeline_flowchart() -> Path:
    """Simple vertical pipeline (like MobileNet report) using matplotlib boxes."""
    steps = [
        "Webcam frame",
        "JPEG upload\n(no storage)",
        "DeepFace\n7 emotions",
        "EmotionLog +\nWebSocket",
        "AAC cards\nEN / AR",
        "CardSelection\n+ PDF report",
    ]
    fig, ax = plt.subplots(figsize=(4, 8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, len(steps) * 2 + 1)
    ax.axis("off")

    y = len(steps) * 2
    for i, text in enumerate(steps):
        ax.add_patch(plt.Rectangle((2, y - 1.2), 6, 1.4, fill=True, facecolor="#E8F4FC", edgecolor="#4C78A8", lw=2))
        ax.text(5, y - 0.5, text, ha="center", va="center", fontsize=10, fontweight="bold")
        if i < len(steps) - 1:
            ax.annotate("", xy=(5, y - 1.4), xytext=(5, y - 1.8), arrowprops=dict(arrowstyle="->", lw=2))
        y -= 2

    ax.set_title("SyNAPSE emotion → AAC pipeline", fontsize=12, pad=12)
    fig.tight_layout()
    path = ensure_out() / "fig_pipeline_vertical.png"
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=Path, help="Face image for 3-panel inference figure")
    parser.add_argument("--labeled-dir", type=Path, help="Root folder with emotion subfolders for confusion matrix")
    args = parser.parse_args()

    paths = [
        fig_api_latency_bar(),
        fig_feature_comparison_bar(),
        fig_emotion_distribution(),
        fig_pipeline_flowchart(),
    ]
    if args.image and args.image.exists():
        paths.append(fig_inference_panel(args.image))
    if args.labeled_dir:
        cm = fig_confusion_matrix(args.labeled_dir)
        if cm:
            paths.append(cm)

    print("Saved figures:")
    for p in paths:
        print(f"  {p}")


if __name__ == "__main__":
    main()
