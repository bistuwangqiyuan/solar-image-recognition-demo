import io
import json
import math
import uuid
import time
import random
import sys
import platform
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Request, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from PIL import Image as PILImage, ImageStat, ImageFilter
import numpy as np

app = FastAPI(title="Solar Image Recognition API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ────────────────────────────────────────────────────────
#  Solar-panel image analysis engine (Pillow + numpy)
#  v3 — high-resolution grid + connected-component
#       clustering + position-aware descriptions
# ────────────────────────────────────────────────────────

GRID_SIZE = 8

CATEGORY_LABEL = {
    "normal": "正常",
    "leaves": "树叶/植被遮挡",
    "dust": "灰尘覆盖",
    "shadow": "阴影遮挡",
    "other": "异常",
}
CATEGORY_SEVERITY_BASE = {
    "normal": "low",
    "leaves": "medium",
    "dust": "medium",
    "shadow": "low",
    "other": "high",
}


def _position_label(cx: float, cy: float, img_w: int, img_h: int) -> str:
    """Return a human-readable position string for a bounding-box centre."""
    col = "左侧" if cx < img_w * 0.33 else ("右侧" if cx > img_w * 0.67 else "中部")
    row = "上方" if cy < img_h * 0.33 else ("下方" if cy > img_h * 0.67 else "中部")
    if row == "中部" and col == "中部":
        return "图像中央"
    if row == "中部":
        return f"图像{col}"
    if col == "中部":
        return f"图像{row}"
    return f"图像{row}{col}"


def _severity_for(category: str, area_ratio: float) -> str:
    """Compute severity based on category AND how much area it covers."""
    if category == "normal":
        return "low"
    if category == "other":
        return "high"
    if area_ratio > 0.35:
        return "high"
    if area_ratio > 0.12:
        return "medium"
    return "low"


def _severity_word(severity: str) -> str:
    return {"low": "轻微", "medium": "明显", "high": "严重"}.get(severity, "")


# ── colour-space conversion ──

def _rgb_to_hsv_array(rgb: np.ndarray) -> np.ndarray:
    """(H,W,3) uint8 RGB → float32 HSV  H[0-360] S[0-1] V[0-1]."""
    rgb_f = rgb.astype(np.float32) / 255.0
    r, g, b = rgb_f[..., 0], rgb_f[..., 1], rgb_f[..., 2]
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin

    h = np.zeros_like(cmax)
    mask = delta > 1e-6
    idx = mask & (cmax == r);  h[idx] = 60.0 * (((g[idx] - b[idx]) / delta[idx]) % 6)
    idx = mask & (cmax == g);  h[idx] = 60.0 * (((b[idx] - r[idx]) / delta[idx]) + 2)
    idx = mask & (cmax == b);  h[idx] = 60.0 * (((r[idx] - g[idx]) / delta[idx]) + 4)
    s = np.where(cmax > 1e-6, delta / cmax, 0.0)
    return np.stack([h, s, cmax], axis=-1)


# ── per-cell classifier ──

def _classify_cell(h: np.ndarray, s: np.ndarray, v: np.ndarray,
                   r: np.ndarray, g: np.ndarray, b: np.ndarray) -> dict:
    """Return {category, confidence, scores} for one grid cell."""
    if h.size == 0:
        return {"category": "other", "confidence": 0.5, "scores": {}}

    # vegetation / leaves
    green_mask = (
        ((h > 60) & (h < 170) & (s > 0.12) & (v > 0.08))
        | ((g > r * 1.15) & (g > b * 1.1) & (g > 0.12))
    )
    green_ratio = float(np.mean(green_mask))

    # dust
    low_sat_ratio = float(np.mean(s < 0.12))
    brown_mask = (h > 15) & (h < 50) & (s > 0.08) & (s < 0.55) & (v > 0.15) & (v < 0.85)
    brown_ratio = float(np.mean(brown_mask))
    gray_mask = (s < 0.10) & (v > 0.20) & (v < 0.80)
    gray_ratio = float(np.mean(gray_mask))
    mean_sat = float(np.mean(s))

    # shadow
    dark_ratio = float(np.mean(v < 0.22))
    mean_v = float(np.mean(v))
    std_v = float(np.std(v))

    # normal panel (blue-ish tones)
    blue_mask = (h > 180) & (h < 260) & (s > 0.10) & (v > 0.10)
    blue_ratio = float(np.mean(blue_mask))
    dark_blue = (h > 200) & (h < 250) & (s > 0.08) & (v > 0.05) & (v < 0.50)
    dark_blue_ratio = float(np.mean(dark_blue))

    scores: dict[str, float] = {"normal": 0.0, "leaves": 0.0, "dust": 0.0, "shadow": 0.0, "other": 0.0}

    # leaves
    if green_ratio > 0.35:
        scores["leaves"] = min(0.98, 0.70 + green_ratio * 0.6)
    elif green_ratio > 0.15:
        scores["leaves"] = min(0.90, 0.40 + green_ratio * 1.2)
    elif green_ratio > 0.06:
        scores["leaves"] = 0.20 + green_ratio * 2.0

    # dust
    dust_signal = brown_ratio * 0.5 + gray_ratio * 0.3 + low_sat_ratio * 0.2
    if mean_sat < 0.10 and gray_ratio > 0.40:
        scores["dust"] = min(0.97, 0.60 + dust_signal)
    elif brown_ratio > 0.25 or (low_sat_ratio > 0.50 and mean_sat < 0.15):
        scores["dust"] = min(0.95, 0.45 + dust_signal)
    elif dust_signal > 0.20:
        scores["dust"] = min(0.80, 0.25 + dust_signal)

    # shadow
    if dark_ratio > 0.50:
        scores["shadow"] = min(0.97, 0.55 + dark_ratio * 0.5)
    elif dark_ratio > 0.25 and std_v > 0.12:
        scores["shadow"] = min(0.93, 0.40 + dark_ratio + std_v)
    elif dark_ratio > 0.10 and mean_v < 0.35:
        scores["shadow"] = min(0.80, 0.30 + dark_ratio * 2.0)

    # normal
    panel_ratio = blue_ratio + dark_blue_ratio
    if panel_ratio > 0.30 and mean_sat > 0.12:
        scores["normal"] = min(0.98, 0.55 + panel_ratio * 0.8)
    elif panel_ratio > 0.12:
        scores["normal"] = min(0.85, 0.35 + panel_ratio * 1.2)
    elif mean_sat > 0.15 and mean_v > 0.20 and mean_v < 0.80 and green_ratio < 0.08:
        scores["normal"] = max(scores["normal"], 0.30 + mean_sat * 0.5)

    if max(scores.values()) < 0.25:
        scores["other"] = 0.60

    best = max(scores, key=scores.get)
    return {"category": best, "confidence": scores[best], "scores": scores}


# ── connected-component grouping ──

def _flood_fill_component(label_grid: np.ndarray, visited: np.ndarray,
                          start_y: int, start_x: int, target: str) -> list[tuple[int, int]]:
    """BFS flood-fill to find a connected component of cells with the same label."""
    rows, cols = label_grid.shape
    stack = [(start_y, start_x)]
    cells: list[tuple[int, int]] = []
    while stack:
        cy, cx = stack.pop()
        if cy < 0 or cy >= rows or cx < 0 or cx >= cols:
            continue
        if visited[cy, cx]:
            continue
        if label_grid[cy, cx] != target:
            continue
        visited[cy, cx] = True
        cells.append((cy, cx))
        stack.extend([(cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)])
    return cells


def _extract_components(label_grid: np.ndarray, conf_grid: np.ndarray,
                        img_w: int, img_h: int) -> list[dict]:
    """Group adjacent cells of the same category into connected components."""
    rows, cols = label_grid.shape
    visited = np.zeros_like(label_grid, dtype=bool)
    cell_w = img_w / cols
    cell_h = img_h / rows
    total_cells = rows * cols

    components: list[dict] = []
    for gy in range(rows):
        for gx in range(cols):
            if visited[gy, gx]:
                continue
            cat = label_grid[gy, gx]
            if not cat:
                visited[gy, gx] = True
                continue
            cells = _flood_fill_component(label_grid, visited, gy, gx, cat)
            if not cells:
                continue

            confs = [float(conf_grid[cy, cx]) for cy, cx in cells]
            avg_conf = sum(confs) / len(confs)
            max_conf = max(confs)
            area_ratio = len(cells) / total_cells

            gxs = [cx for _, cx in cells]
            gys = [cy for cy, _ in cells]
            x_min = int(min(gxs) * cell_w)
            y_min = int(min(gys) * cell_h)
            x_max = int((max(gxs) + 1) * cell_w)
            y_max = int((max(gys) + 1) * cell_h)

            bbox = {"x": x_min, "y": y_min, "width": x_max - x_min, "height": y_max - y_min}
            center_x = (x_min + x_max) / 2
            center_y = (y_min + y_max) / 2

            final_conf = min(0.99, max_conf * 0.65 + avg_conf * 0.30 + min(0.05, area_ratio * 0.15))

            severity = _severity_for(cat, area_ratio)
            position = _position_label(center_x, center_y, img_w, img_h)
            sev_word = _severity_word(severity)
            cat_label = CATEGORY_LABEL.get(cat, cat)
            area_pct = round(area_ratio * 100)

            if cat == "normal":
                desc = f"{position}检测到正常光伏板区域（覆盖约{area_pct}%面积）"
            else:
                desc = f"{position}检测到{sev_word}{cat_label}（覆盖约{area_pct}%面积, 坐标 {x_min},{y_min} ~ {x_max},{y_max}）"

            components.append({
                "category": cat,
                "confidence": round(final_conf, 4),
                "boundingBox": bbox,
                "description": desc,
                "severity": severity,
                "areaCoverage": round(area_ratio, 4),
                "position": position,
                "cellCount": len(cells),
            })

    return components


# ── main analysis entry ──

def analyze_solar_image(image_bytes: bytes) -> list[dict]:
    """Run high-resolution grid analysis with connected-component clustering."""
    img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_w, orig_h = img.size

    analysis_size = 256
    img_resized = img.resize((analysis_size, analysis_size), PILImage.Resampling.LANCZOS)
    rgb = np.array(img_resized, dtype=np.uint8)
    hsv = _rgb_to_hsv_array(rgb)
    rgb_f = rgb.astype(np.float32) / 255.0

    h_ch, s_ch, v_ch = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    r_ch, g_ch, b_ch = rgb_f[..., 0], rgb_f[..., 1], rgb_f[..., 2]

    grid = GRID_SIZE
    cell_size = analysis_size // grid

    label_grid = np.empty((grid, grid), dtype=object)
    conf_grid = np.zeros((grid, grid), dtype=np.float64)

    for gy in range(grid):
        for gx in range(grid):
            y1, y2 = gy * cell_size, (gy + 1) * cell_size
            x1, x2 = gx * cell_size, (gx + 1) * cell_size
            result = _classify_cell(
                h_ch[y1:y2, x1:x2], s_ch[y1:y2, x1:x2], v_ch[y1:y2, x1:x2],
                r_ch[y1:y2, x1:x2], g_ch[y1:y2, x1:x2], b_ch[y1:y2, x1:x2],
            )
            if result["confidence"] >= 0.25:
                label_grid[gy, gx] = result["category"]
                conf_grid[gy, gx] = result["confidence"]
            else:
                label_grid[gy, gx] = ""

    detections = _extract_components(label_grid, conf_grid, orig_w, orig_h)

    abnormal = [d for d in detections if d["category"] != "normal"]
    normal = [d for d in detections if d["category"] == "normal"]

    abnormal.sort(key=lambda d: d["confidence"], reverse=True)
    normal.sort(key=lambda d: d["confidence"], reverse=True)

    if normal:
        largest_normal = max(normal, key=lambda d: d["cellCount"])
        result_list = abnormal + [largest_normal]
    else:
        result_list = abnormal if abnormal else [{"category": "normal", "confidence": 0.90,
            "boundingBox": {"x": 0, "y": 0, "width": orig_w, "height": orig_h},
            "description": "未检测到异常，光伏板整体状态正常", "severity": "low",
            "areaCoverage": 1.0, "position": "全图", "cellCount": grid * grid}]

    for det in result_list:
        det.pop("cellCount", None)

    return result_list


# ────────────────────────────────────────────────────────
#  Pydantic models
# ────────────────────────────────────────────────────────

class AnalysisOptions(BaseModel):
    confidence: float = Field(default=0.7, ge=0, le=1)
    detailLevel: str = Field(default="detailed", pattern="^(basic|detailed)$")


class AnalysisRequestBody(BaseModel):
    imageId: str
    options: Optional[AnalysisOptions] = None


class BatchAnalysisRequestBody(BaseModel):
    imageIds: list[str]
    options: Optional[AnalysisOptions] = None


# ────────────────────────────────────────────────────────
#  Demo data
# ────────────────────────────────────────────────────────

DEMO_IMAGES = [
    {
        "id": "demo-001",
        "title": "正常光伏板",
        "description": "展示状态良好的光伏板，无遮挡和污染",
        "imageUrl": "/static/demo/normal-panel.jpg",
        "expectedResults": [
            {
                "category": "normal",
                "confidence": 0.95,
                "boundingBox": {"x": 50, "y": 50, "width": 300, "height": 200},
                "description": "正常光伏板区域",
                "severity": "low",
            }
        ],
        "category": "normal",
    },
    {
        "id": "demo-002",
        "title": "树叶遮挡",
        "description": "展示被树叶遮挡的光伏板，影响发电效率",
        "imageUrl": "/static/demo/leaves-cover.jpg",
        "expectedResults": [
            {"category": "normal", "confidence": 0.88, "boundingBox": {"x": 50, "y": 50, "width": 200, "height": 150}, "description": "正常光伏板区域", "severity": "low"},
            {"category": "leaves", "confidence": 0.92, "boundingBox": {"x": 250, "y": 80, "width": 100, "height": 80}, "description": "检测到树叶遮挡", "severity": "medium"},
        ],
        "category": "leaves",
    },
    {
        "id": "demo-003",
        "title": "灰尘覆盖",
        "description": "展示被灰尘覆盖的光伏板，需要清洁维护",
        "imageUrl": "/static/demo/dust-cover.jpg",
        "expectedResults": [
            {"category": "normal", "confidence": 0.75, "boundingBox": {"x": 50, "y": 50, "width": 150, "height": 100}, "description": "部分正常光伏板区域", "severity": "low"},
            {"category": "dust", "confidence": 0.89, "boundingBox": {"x": 200, "y": 50, "width": 150, "height": 200}, "description": "检测到灰尘覆盖", "severity": "medium"},
        ],
        "category": "dust",
    },
    {
        "id": "demo-004",
        "title": "云彩阴影",
        "description": "展示被云彩阴影遮挡的光伏板",
        "imageUrl": "/static/demo/cloud-shadow.jpg",
        "expectedResults": [
            {"category": "normal", "confidence": 0.82, "boundingBox": {"x": 50, "y": 100, "width": 200, "height": 150}, "description": "正常光伏板区域", "severity": "low"},
            {"category": "shadow", "confidence": 0.85, "boundingBox": {"x": 250, "y": 50, "width": 100, "height": 200}, "description": "检测到云彩阴影", "severity": "low"},
        ],
        "category": "shadow",
    },
    {
        "id": "demo-005",
        "title": "混合问题",
        "description": "展示同时存在多种问题的光伏板",
        "imageUrl": "/static/demo/mixed-issues.jpg",
        "expectedResults": [
            {"category": "normal", "confidence": 0.70, "boundingBox": {"x": 50, "y": 150, "width": 100, "height": 100}, "description": "部分正常光伏板区域", "severity": "low"},
            {"category": "leaves", "confidence": 0.88, "boundingBox": {"x": 150, "y": 50, "width": 80, "height": 60}, "description": "检测到树叶遮挡", "severity": "medium"},
            {"category": "dust", "confidence": 0.82, "boundingBox": {"x": 200, "y": 100, "width": 120, "height": 90}, "description": "检测到灰尘覆盖", "severity": "medium"},
            {"category": "shadow", "confidence": 0.75, "boundingBox": {"x": 300, "y": 50, "width": 100, "height": 150}, "description": "检测到阴影遮挡", "severity": "low"},
        ],
        "category": "other",
    },
]


# ────────────────────────────────────────────────────────
#  Helpers
# ────────────────────────────────────────────────────────

def _make_response(success: bool, data=None, error=None):
    resp = {"success": success, "timestamp": datetime.utcnow().isoformat()}
    if data is not None:
        resp["data"] = data
    if error is not None:
        resp["error"] = error
    return resp


def _generate_recommendations(results):
    recommendations = []
    abnormal = [r for r in results if r["category"] != "normal"]

    for r in abnormal:
        cat = r["category"]
        pos = r.get("position", "")
        area = r.get("areaCoverage", 0)
        area_pct = round(area * 100)
        sev = r.get("severity", "medium")
        priority = sev

        if cat == "leaves":
            recommendations.append({
                "type": "cleaning", "priority": priority,
                "description": f"{pos}发现树叶/植被遮挡（约{area_pct}%面积），建议清理以恢复发电效率",
                "estimatedCost": 200 if area < 0.2 else 400,
                "estimatedTime": "1-2小时" if area < 0.2 else "2-4小时",
            })
        elif cat == "dust":
            recommendations.append({
                "type": "cleaning", "priority": priority,
                "description": f"{pos}发现灰尘覆盖（约{area_pct}%面积），清洁后可提高发电效率15-20%",
                "estimatedCost": 150 if area < 0.2 else 300,
                "estimatedTime": "1-2小时" if area < 0.2 else "2-4小时",
            })
        elif cat == "shadow":
            recommendations.append({
                "type": "inspection", "priority": priority,
                "description": f"{pos}存在阴影遮挡（约{area_pct}%面积），建议检查周围是否有新遮挡物",
                "estimatedCost": 100,
                "estimatedTime": "1小时",
            })
        elif cat == "other":
            recommendations.append({
                "type": "inspection", "priority": "high",
                "description": f"{pos}检测到异常情况（约{area_pct}%面积），建议现场详细检查",
                "estimatedCost": 500,
                "estimatedTime": "4-6小时",
            })

    if not recommendations:
        recommendations.append({
            "type": "maintenance", "priority": "low",
            "description": "光伏板整体状态良好，建议定期进行预防性维护",
            "estimatedCost": 300, "estimatedTime": "2-3小时",
        })
    return recommendations


def _calculate_summary(results, processing_time):
    total_issues = len([r for r in results if r["category"] != "normal"])
    avg_confidence = sum(r["confidence"] for r in results) / len(results) if results else 0
    overall_status = "healthy"
    if total_issues == 0:
        overall_status = "healthy"
    elif any(r.get("severity") == "high" for r in results):
        overall_status = "critical"
    elif any(r.get("severity") == "medium" for r in results):
        overall_status = "warning"
    return {
        "overallStatus": overall_status,
        "totalIssues": total_issues,
        "processingTime": processing_time,
        "confidence": round(avg_confidence, 4),
    }


# ────────────────────────────────────────────────────────
#  Routes — Health
# ────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return _make_response(True, data={
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "environment": "vercel",
        "services": {"server": "healthy", "ai": "healthy"},
        "system": {"platform": sys.platform, "pythonVersion": platform.python_version()},
    })


@app.get("/api/health/live")
async def health_live():
    return _make_response(True, data={"status": "alive", "timestamp": datetime.utcnow().isoformat()})


# ────────────────────────────────────────────────────────
#  Routes — Real Image Analysis (NEW)
# ────────────────────────────────────────────────────────

@app.post("/api/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """Accept an image file, run the CV analysis pipeline, return detection results."""
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="不支持的文件格式")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="文件大小超过限制 (10MB)")

    start = time.time()
    try:
        results = analyze_solar_image(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"图像分析失败: {exc}")
    processing_time = int((time.time() - start) * 1000)

    recommendations = _generate_recommendations(results)
    summary = _calculate_summary(results, processing_time)

    return _make_response(True, data={
        "results": results,
        "summary": summary,
        "recommendations": recommendations,
        "processingTime": processing_time,
    })


# ────────────────────────────────────────────────────────
#  Routes — Demo
# ────────────────────────────────────────────────────────

@app.get("/api/demo")
async def get_demos():
    return _make_response(True, data=DEMO_IMAGES)


@app.get("/api/demo/stats/overview")
async def get_demo_stats():
    by_category = {}
    for d in DEMO_IMAGES:
        cat = d["category"]
        by_category[cat] = by_category.get(cat, 0) + 1
    avg_confidence = sum(
        sum(r["confidence"] for r in d["expectedResults"]) / len(d["expectedResults"])
        for d in DEMO_IMAGES
    ) / len(DEMO_IMAGES)
    return _make_response(True, data={
        "total": len(DEMO_IMAGES),
        "byCategory": by_category,
        "averageConfidence": round(avg_confidence, 4),
        "lastUpdated": datetime.utcnow().isoformat(),
    })


@app.get("/api/demo/category/{category}")
async def get_demos_by_category(category: str):
    valid = {"normal", "leaves", "dust", "shadow", "other"}
    if category not in valid:
        raise HTTPException(status_code=400, detail="无效的类别参数")
    return _make_response(True, data=[d for d in DEMO_IMAGES if d["category"] == category])


@app.get("/api/demo/search/{query}")
async def search_demos(query: str, category: Optional[str] = None, limit: int = Query(default=10, ge=1)):
    filtered = DEMO_IMAGES
    if category and category in {"normal", "leaves", "dust", "shadow", "other"}:
        filtered = [d for d in filtered if d["category"] == category]
    q = query.lower()
    results = [d for d in filtered if q in d["title"].lower() or q in d["description"].lower()]
    return _make_response(True, data={"results": results[:limit], "total": len(results), "query": query, "category": category})


@app.get("/api/demo/{demo_id}")
async def get_demo_by_id(demo_id: str):
    demo = next((d for d in DEMO_IMAGES if d["id"] == demo_id), None)
    if not demo:
        raise HTTPException(status_code=404, detail="未找到指定的演示数据")
    return _make_response(True, data=demo)


# ────────────────────────────────────────────────────────
#  Routes — Legacy Analysis (mock, kept for backwards compat)
# ────────────────────────────────────────────────────────

@app.post("/api/analysis")
async def analyze_image_legacy(body: AnalysisRequestBody):
    start_time = time.time()
    options = body.options or AnalysisOptions()
    mock = [
        {"category": "normal", "confidence": 0.95, "boundingBox": {"x": 50, "y": 50, "width": 200, "height": 150}, "description": "正常光伏板区域", "severity": "low"},
        {"category": "leaves", "confidence": 0.82, "boundingBox": {"x": 300, "y": 100, "width": 80, "height": 60}, "description": "检测到树叶遮挡", "severity": "medium"},
        {"category": "dust", "confidence": 0.75, "boundingBox": {"x": 150, "y": 200, "width": 120, "height": 90}, "description": "检测到灰尘覆盖", "severity": "medium"},
    ]
    results = [r for r in mock if r["confidence"] >= options.confidence]
    processing_time = int((time.time() - start_time) * 1000) + random.randint(2000, 5000)
    return _make_response(True, data={"results": results, "summary": _calculate_summary(results, processing_time), "recommendations": _generate_recommendations(results), "processingTime": processing_time})


@app.get("/api/analysis/history/{image_id}")
async def get_analysis_history(image_id: str, limit: int = Query(default=10, ge=1), offset: int = Query(default=0, ge=0)):
    mock_history = [
        {"id": str(uuid.uuid4()), "imageId": image_id, "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(), "summary": {"overallStatus": "warning", "totalIssues": 2, "processingTime": 3500, "confidence": 0.85}},
        {"id": str(uuid.uuid4()), "imageId": image_id, "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat(), "summary": {"overallStatus": "healthy", "totalIssues": 0, "processingTime": 2800, "confidence": 0.92}},
    ]
    return _make_response(True, data={"history": mock_history, "total": len(mock_history), "limit": limit, "offset": offset})


@app.post("/api/analysis/batch")
async def batch_analyze(body: BatchAnalysisRequestBody):
    if len(body.imageIds) > 10:
        raise HTTPException(status_code=400, detail="批量分析最多支持10张图像")
    return _make_response(True, data={"successful": [], "failed": [], "total": len(body.imageIds), "successCount": 0, "failureCount": 0})


# ────────────────────────────────────────────────────────
#  Routes — Upload
# ────────────────────────────────────────────────────────

@app.post("/api/upload/single")
async def upload_single(file: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="不支持的文件格式，仅支持 JPG、PNG、WEBP 格式")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="文件大小超过限制 (10MB)")
    image_id = str(uuid.uuid4())
    return _make_response(True, data={
        "imageId": image_id, "originalUrl": f"/uploads/{image_id}", "thumbnailUrl": f"/uploads/thumb-{image_id}",
        "metadata": {"size": len(contents), "dimensions": {"width": 0, "height": 0}, "format": file.content_type, "uploadTime": datetime.utcnow().isoformat()},
    })


@app.get("/api/upload/status/{image_id}")
async def upload_status(image_id: str):
    return _make_response(True, data={"imageId": image_id, "status": "uploaded", "exists": True})


@app.delete("/api/upload/{image_id}")
async def delete_upload(image_id: str):
    return _make_response(True, data={"imageId": image_id, "deleted": True})


@app.get("/api")
async def api_root():
    return _make_response(True, data={"message": "光伏图像识别API服务", "version": "2.0.0", "timestamp": datetime.utcnow().isoformat()})
