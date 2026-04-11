import type { Handler } from '@netlify/functions';
import { generateText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// ── Structured output schema ──────────────────────────────

const detectionSchema = z.object({
  category: z.enum(['normal', 'leaves', 'dust', 'shadow', 'crack', 'hotspot', 'corrosion', 'other']),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  position: z.string(),
  areaCoverage: z.number().min(0).max(100),
  boundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
});

const analysisSchema = z.object({
  detections: z.array(detectionSchema),
  overallStatus: z.enum(['healthy', 'warning', 'critical']),
  summary: z.string(),
  recommendations: z.array(z.object({
    type: z.enum(['maintenance', 'cleaning', 'inspection', 'replacement']),
    priority: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    estimatedCost: z.number().nullable(),
    estimatedTime: z.string().nullable(),
  })),
});

type AnalysisResult = z.infer<typeof analysisSchema>;

// ── System prompt ─────────────────────────────────────────

const SYSTEM_PROMPT = `你是一个专业的光伏板故障检测AI系统。你需要分析光伏板图片，识别出所有异常区域。

## 检测类别
- normal: 正常区域（面板表面清洁，无遮挡、无损伤）
- leaves: 树叶/植被遮挡（绿色或棕色有机物覆盖面板）
- dust: 灰尘/污垢覆盖（面板表面有明显灰层，透光性下降）
- shadow: 阴影遮挡（由建筑物、树木或其他物体投射的阴影）
- crack: 裂缝/碎裂（面板玻璃或电池片的物理损伤）
- hotspot: 热斑（局部异常高温区域，通常表现为颜色异常变深）
- corrosion: 腐蚀/老化（面板边框或接线盒的氧化/锈蚀）
- other: 其他异常（鸟粪、水渍、安装缺陷等）

## 输出要求
1. 为每个异常区域提供精确的边界框坐标（boundingBox），坐标基于图片像素尺寸
2. position 字段用中文描述区域位置（如"图像左上方"、"图像中央偏右"等）
3. areaCoverage 为该异常区域占整个图片面积的百分比估计值
4. 严重程度(severity)判定标准：
   - low: 轻微影响，不影响发电效率超过5%
   - medium: 中等影响，可能降低发电效率5-20%
   - high: 严重影响，降低发电效率超过20%或存在安全隐患
5. confidence 为你对该检测结果的置信度(0-1)
6. 如果图片不是光伏板，仍尝试分析并在summary中说明
7. recommendations 必须包含具体的维护建议，estimatedCost单位为人民币元，estimatedTime为预计工时

## 重要
- 只报告你确实观察到的异常，不要凭空编造
- 如果面板状态完全正常，detections数组中只放一个category为normal的条目
- boundingBox的坐标必须合理，不能超出图像边界

请严格以 JSON 格式输出结果。`;

// ── Provider definitions ──────────────────────────────────

interface ProviderDef {
  name: string;
  envKey: string;
  baseURL: string;
  model: string;
}

const OPENAI_COMPATIBLE_PROVIDERS: ProviderDef[] = [
  {
    name: 'Groq (Llama 4 Scout)',
    envKey: 'GROQ_API_KEY',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
  {
    name: 'Mistral (Pixtral)',
    envKey: 'MISTRAL_API_KEY',
    baseURL: 'https://api.mistral.ai/v1',
    model: 'pixtral-large-latest',
  },
  {
    name: '智谱 AI (GLM-4V)',
    envKey: 'GLM_API_KEY',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4v-flash',
  },
];

// ── Analysis helpers ──────────────────────────────────────

function buildMessages(imageBase64: string, imgWidth: number, imgHeight: number) {
  const userPrompt = `请分析这张光伏板图片（尺寸: ${imgWidth}×${imgHeight} 像素），识别所有异常区域。
boundingBox 坐标范围：x: 0-${imgWidth}, y: 0-${imgHeight}。
请用中文回复，严格以 JSON 格式输出。`;

  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: [
        { type: 'image' as const, image: Buffer.from(imageBase64, 'base64') },
        { type: 'text' as const, text: userPrompt },
      ],
    },
  ];
}

async function tryStructuredOutput(
  model: any,
  messages: ReturnType<typeof buildMessages>,
): Promise<AnalysisResult> {
  const { output } = await generateText({
    model,
    messages,
    output: Output.object({
      schema: analysisSchema,
      name: 'solar_panel_analysis',
      description: '光伏板故障检测结构化结果',
    }),
  });
  if (!output) throw new Error('No structured output');
  return output;
}

async function tryTextExtraction(
  model: any,
  messages: ReturnType<typeof buildMessages>,
): Promise<AnalysisResult> {
  const { text } = await generateText({ model, messages });
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error('No JSON in response');
  const raw = jsonMatch[1] ?? jsonMatch[0];
  return analysisSchema.parse(JSON.parse(raw));
}

async function analyzeWithModel(
  model: any,
  messages: ReturnType<typeof buildMessages>,
): Promise<AnalysisResult> {
  try {
    return await tryStructuredOutput(model, messages);
  } catch (structErr: any) {
    console.warn('Structured output failed, trying text extraction:', structErr?.message);
    return await tryTextExtraction(model, messages);
  }
}

function clampBoundingBoxes(result: AnalysisResult, w: number, h: number): AnalysisResult {
  return {
    ...result,
    detections: result.detections.map(d => ({
      ...d,
      boundingBox: {
        x: Math.max(0, Math.min(d.boundingBox.x, w)),
        y: Math.max(0, Math.min(d.boundingBox.y, h)),
        width: Math.max(1, Math.min(d.boundingBox.width, w - d.boundingBox.x)),
        height: Math.max(1, Math.min(d.boundingBox.height, h - d.boundingBox.y)),
      },
    })),
  };
}

// ── CORS helpers ──────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: any, status = 200) {
  return {
    statusCode: status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

// ── Netlify handler ───────────────────────────────────────

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  let body: any;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const { image, width, height } = body;

  if (!image || typeof image !== 'string') {
    return jsonResponse({ success: false, error: 'Missing required field: image (base64 string)' }, 400);
  }

  const imageBase64 = image.includes(',') ? image.split(',')[1] : image;
  const imgWidth = typeof width === 'number' && width > 0 ? width : 1024;
  const imgHeight = typeof height === 'number' && height > 0 ? height : 768;

  const messages = buildMessages(imageBase64, imgWidth, imgHeight);
  const startTime = Date.now();
  const errors: { provider: string; message: string }[] = [];

  // Phase 1 — OpenAI-compatible providers (Groq → Mistral → 智谱)
  for (const prov of OPENAI_COMPATIBLE_PROVIDERS) {
    const apiKey = process.env[prov.envKey];
    if (!apiKey) continue;

    try {
      console.log(`[Vision] Trying ${prov.name} …`);
      const client = createOpenAI({ baseURL: prov.baseURL, apiKey });
      const model = client(prov.model);
      const result = clampBoundingBoxes(await analyzeWithModel(model, messages), imgWidth, imgHeight);
      const elapsed = Date.now() - startTime;

      return jsonResponse({
        success: true,
        data: {
          results: result.detections,
          overallStatus: result.overallStatus,
          summary: result.summary,
          recommendations: result.recommendations,
          processingTime: elapsed,
          provider: prov.name,
          engine: 'vision-api',
        },
      });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.warn(`[Vision] ${prov.name} failed: ${msg}`);
      errors.push({ provider: prov.name, message: msg });
    }
  }

  // Phase 2 — Google Gemini (native provider)
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      console.log('[Vision] Trying Google Gemini …');
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
      }
      const result = clampBoundingBoxes(
        await analyzeWithModel(google('gemini-2.5-flash'), messages),
        imgWidth,
        imgHeight,
      );
      const elapsed = Date.now() - startTime;

      return jsonResponse({
        success: true,
        data: {
          results: result.detections,
          overallStatus: result.overallStatus,
          summary: result.summary,
          recommendations: result.recommendations,
          processingTime: elapsed,
          provider: 'Google Gemini',
          engine: 'vision-api',
        },
      });
    } catch (err: any) {
      console.warn('[Vision] Google Gemini failed:', err?.message);
      errors.push({ provider: 'Google Gemini', message: err?.message ?? String(err) });
    }
  }

  const tried = errors.map(e => e.provider).join(', ') || '(none configured)';
  console.error(`[Vision] All providers failed. Tried: ${tried}`);

  return jsonResponse({
    success: false,
    error: `所有 Vision API 均不可用 (${tried})`,
    details: errors,
    fallback: true,
  }, 500);
};
