export interface SolarSample {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  source: string;
  tags: string[];
}

export const solarSamples: SolarSample[] = [
  {
    id: 'sample-1',
    name: '光伏板阵列 - 样本 1',
    description: '典型的光伏板安装场景，展示标准排列方式和光照条件下的面板状态。',
    imageUrl: '/static/solar-samples/sample.png',
    source: '现场采集',
    tags: ['光伏阵列', '标准安装'],
  },
  {
    id: 'sample-2',
    name: '光伏板阵列 - 样本 2',
    description: '不同角度拍摄的光伏板，可用于测试模型在不同视角下的识别能力。',
    imageUrl: '/static/solar-samples/sample2.png',
    source: '现场采集',
    tags: ['多角度', '测试样本'],
  },
  {
    id: 'sample-3',
    name: '光伏板阵列 - 样本 3',
    description: '展示光伏板在实际运行环境中的状态，包含可能的表面特征。',
    imageUrl: '/static/solar-samples/sample3.png',
    source: '现场采集',
    tags: ['运行环境', '表面特征'],
  },
  {
    id: 'sample-4',
    name: '光伏板特写',
    description: '光伏板近距离特写照片，清晰展示面板表面细节和纹理。',
    imageUrl: '/static/solar-samples/solar-panel.png',
    source: '现场采集',
    tags: ['特写', '细节展示'],
  },
];
