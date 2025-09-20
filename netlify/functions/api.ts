import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // 设置CORS头部
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' }),
    };
  }

  try {
    const { httpMethod, path, body, queryStringParameters } = event;

    // 路由处理
    switch (path) {
      case '/api/health':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
              environment: 'netlify'
            }
          }),
        };

      case '/api/demo':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'demo1',
                filename: 'solar-panel-normal.jpg',
                category: 'normal',
                description: '正常光伏板示例',
                url: '/static/demo/solar-panel-normal.jpg',
                thumbnailUrl: '/static/demo/thumbnails/solar-panel-normal.jpg',
                analysisResult: {
                  defects: [],
                  overallConfidence: 0.98,
                  recommendations: ['面板状态良好', '建议定期清洁']
                }
              },
              {
                id: 'demo2',
                filename: 'solar-panel-crack.jpg',
                category: 'defect',
                description: '裂纹检测示例',
                url: '/static/demo/solar-panel-crack.jpg',
                thumbnailUrl: '/static/demo/thumbnails/solar-panel-crack.jpg',
                analysisResult: {
                  defects: [
                    {
                      type: 'crack',
                      confidence: 0.95,
                      bbox: { x: 100, y: 150, width: 50, height: 30 },
                      severity: 'high'
                    }
                  ],
                  overallConfidence: 0.92,
                  recommendations: ['检查裂纹区域', '建议更换受损面板']
                }
              },
              {
                id: 'demo3',
                filename: 'solar-panel-dust.jpg',
                category: 'maintenance',
                description: '积尘覆盖示例',
                url: '/static/demo/solar-panel-dust.jpg',
                thumbnailUrl: '/static/demo/thumbnails/solar-panel-dust.jpg',
                analysisResult: {
                  defects: [
                    {
                      type: 'dust',
                      confidence: 0.88,
                      bbox: { x: 50, y: 100, width: 200, height: 150 },
                      severity: 'medium'
                    }
                  ],
                  overallConfidence: 0.85,
                  recommendations: ['清洁面板表面', '检查清洁设备']
                }
              }
            ]
          }),
        };

      case '/api/analysis':
        if (httpMethod === 'POST') {
          const requestBody = JSON.parse(body || '{}');
          
          // 模拟AI分析结果
          const mockAnalysis = {
            success: true,
            data: {
              id: `analysis_${Date.now()}`,
              imageId: requestBody.imageId || 'demo_image',
              status: 'completed',
              result: {
                defects: [
                  {
                    type: 'crack',
                    confidence: 0.95,
                    bbox: { x: 100, y: 150, width: 50, height: 30 },
                    severity: 'high'
                  }
                ],
                overallConfidence: 0.92,
                recommendations: [
                  '检查裂纹区域',
                  '建议更换受损面板',
                  '联系专业维修人员'
                ]
              },
              created_at: new Date().toISOString()
            }
          };

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockAnalysis),
          };
        }
        break;

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'API endpoint not found'
            }
          }),
        };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'HTTP method not allowed'
        }
      }),
    };

  } catch (error) {
    console.error('API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      }),
    };
  }
};
