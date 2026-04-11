import { DetectionResult, PanelCondition, Severity } from '@/types';

interface PixelStats {
  greenRatio: number;
  brownRatio: number;
  grayRatio: number;
  darkRatio: number;
  brightness: number;
  saturation: number;
}

function getPixelStats(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): PixelStats {
  const data = ctx.getImageData(x, y, w, h).data;
  const total = w * h;
  let green = 0, brown = 0, gray = 0, dark = 0;
  let brightnessSum = 0, saturationSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (r + g + b) / 3;

    brightnessSum += lum;
    saturationSum += max > 0 ? (max - min) / max : 0;

    if (g > r * 1.2 && g > b * 1.2 && g > 50) green++;
    if (r > 80 && g > 50 && g < r * 0.9 && b < r * 0.6) brown++;
    if (max - min < 30 && lum > 60 && lum < 200) gray++;
    if (lum < 50) dark++;
  }

  return {
    greenRatio: green / total,
    brownRatio: brown / total,
    grayRatio: gray / total,
    darkRatio: dark / total,
    brightness: brightnessSum / total,
    saturation: saturationSum / total,
  };
}

function classifyCell(stats: PixelStats): { category: PanelCondition; confidence: number } {
  if (stats.greenRatio > 0.25) {
    return { category: PanelCondition.LEAVES, confidence: Math.min(0.5 + stats.greenRatio, 0.85) };
  }
  if (stats.grayRatio > 0.5 && stats.brightness > 100 && stats.saturation < 0.15) {
    return { category: PanelCondition.DUST, confidence: Math.min(0.4 + stats.grayRatio * 0.4, 0.8) };
  }
  if (stats.darkRatio > 0.4 && stats.brightness < 60) {
    return { category: PanelCondition.SHADOW, confidence: Math.min(0.4 + stats.darkRatio * 0.3, 0.75) };
  }
  if (stats.brownRatio > 0.2) {
    return { category: PanelCondition.LEAVES, confidence: Math.min(0.3 + stats.brownRatio, 0.7) };
  }
  return { category: PanelCondition.NORMAL, confidence: 0.6 };
}

function positionLabel(cx: number, cy: number, imgW: number, imgH: number): string {
  const xRatio = cx / imgW;
  const yRatio = cy / imgH;
  const vLabel = yRatio < 0.33 ? '上' : yRatio > 0.66 ? '下' : '中';
  const hLabel = xRatio < 0.33 ? '左' : xRatio > 0.66 ? '右' : '央';

  if (vLabel === '中' && hLabel === '央') return '图像中央';
  if (hLabel === '央') return `图像${vLabel}方`;
  if (vLabel === '中') return `图像${hLabel}侧`;
  return `图像${vLabel}${hLabel}方`;
}

const CATEGORY_LABEL: Record<string, string> = {
  normal: '正常',
  leaves: '树叶/植被遮挡',
  dust: '灰尘覆盖',
  shadow: '阴影遮挡',
  other: '异常',
};

export function analyzeImageOffline(imageElement: HTMLImageElement): DetectionResult[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const w = imageElement.naturalWidth || imageElement.width;
  const h = imageElement.naturalHeight || imageElement.height;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imageElement, 0, 0);

  const gridSize = 6;
  const cellW = Math.floor(w / gridSize);
  const cellH = Math.floor(h / gridSize);

  const grid: { category: PanelCondition; confidence: number }[][] = [];
  for (let gy = 0; gy < gridSize; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      const stats = getPixelStats(ctx, gx * cellW, gy * cellH, cellW, cellH);
      grid[gy][gx] = classifyCell(stats);
    }
  }

  const visited = Array.from({ length: gridSize }, () => new Array(gridSize).fill(false));
  const detections: DetectionResult[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      if (visited[gy][gx]) continue;
      const cat = grid[gy][gx].category;
      if (cat === PanelCondition.NORMAL) {
        visited[gy][gx] = true;
        continue;
      }

      const queue: [number, number][] = [[gy, gx]];
      visited[gy][gx] = true;
      const cells: [number, number][] = [];
      let confSum = 0;

      while (queue.length > 0) {
        const [cy, cx] = queue.shift()!;
        cells.push([cy, cx]);
        confSum += grid[cy][cx].confidence;

        for (const [dy, dx] of [[0,1],[0,-1],[1,0],[-1,0]]) {
          const ny = cy + dy, nx = cx + dx;
          if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize
              && !visited[ny][nx] && grid[ny][nx].category === cat) {
            visited[ny][nx] = true;
            queue.push([ny, nx]);
          }
        }
      }

      const minGx = Math.min(...cells.map(c => c[1]));
      const maxGx = Math.max(...cells.map(c => c[1]));
      const minGy = Math.min(...cells.map(c => c[0]));
      const maxGy = Math.max(...cells.map(c => c[0]));

      const bx = minGx * cellW;
      const by = minGy * cellH;
      const bw = (maxGx - minGx + 1) * cellW;
      const bh = (maxGy - minGy + 1) * cellH;
      const avgConf = confSum / cells.length;
      const areaRatio = (cells.length / (gridSize * gridSize)) * 100;

      const pos = positionLabel(bx + bw / 2, by + bh / 2, w, h);
      const label = CATEGORY_LABEL[cat] || cat;

      let severity: Severity;
      if (cat === PanelCondition.OTHER || areaRatio > 30) severity = Severity.HIGH;
      else if (areaRatio > 10) severity = Severity.MEDIUM;
      else severity = Severity.LOW;

      detections.push({
        category: cat,
        confidence: parseFloat(avgConf.toFixed(2)),
        boundingBox: { x: bx, y: by, width: bw, height: bh },
        description: `${pos}检测到${label}（覆盖约${Math.round(areaRatio)}%面积）[离线分析]`,
        severity,
      });
    }
  }

  if (detections.length === 0) {
    detections.push({
      category: PanelCondition.NORMAL,
      confidence: 0.6,
      boundingBox: { x: 0, y: 0, width: w, height: h },
      description: '光伏板状态正常（离线基础分析）',
      severity: Severity.LOW,
    });
  }

  return detections.sort((a, b) => b.confidence - a.confidence);
}
