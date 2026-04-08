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
  {
    id: 'sample-5',
    name: '植被严重遮挡',
    description: '光伏板被大面积杂草和灌木覆盖，面板几乎不可见，严重影响发电效率。',
    imageUrl: '/static/solar-samples/sample4.png',
    source: '现场采集',
    tags: ['植被遮挡', '严重污染', '需清理'],
  },
  {
    id: 'sample-6',
    name: '阴影遮挡分析',
    description: '光伏板表面出现明显的斜线阴影遮挡，标注了不同遮挡区域的编号。',
    imageUrl: '/static/solar-samples/sample5.png',
    source: '现场采集',
    tags: ['阴影遮挡', '分析标注', '遮挡分级'],
  },
  {
    id: 'sample-7',
    name: '灰尘轻度覆盖',
    description: '光伏板表面有轻度灰尘沉积，整体透光性下降，建议定期清洁。',
    imageUrl: '/static/solar-samples/sample6.png',
    source: '现场采集',
    tags: ['灰尘覆盖', '轻度污染'],
  },
  {
    id: 'sample-8',
    name: '灰尘特写',
    description: '光伏板近距离拍摄，清晰可见表面灰尘纹理和积累痕迹。',
    imageUrl: '/static/solar-samples/sample7.png',
    source: '现场采集',
    tags: ['灰尘特写', '表面纹理', '近距离'],
  },
  {
    id: 'sample-9',
    name: '落叶与植物遮挡',
    description: '光伏板表面有落叶和边缘植物遮挡，面板整体状态尚可但需维护。',
    imageUrl: '/static/solar-samples/sample8.png',
    source: '现场采集',
    tags: ['落叶', '植物遮挡', '待维护'],
  },
  {
    id: 'sample-10',
    name: '杂草严重覆盖',
    description: '光伏板被茂密杂草完全覆盖，面板几乎不可见，需要紧急清理。',
    imageUrl: '/static/solar-samples/sample9.png',
    source: '现场采集',
    tags: ['杂草覆盖', '紧急清理', '严重遮挡'],
  },
  {
    id: 'sample-11',
    name: '鸟粪与污渍',
    description: '光伏板表面存在大面积鸟粪和污渍痕迹，局部遮挡严重，需要清洗。',
    imageUrl: '/static/solar-samples/sample10.png',
    source: '现场采集',
    tags: ['鸟粪污渍', '局部遮挡', '需清洗'],
  },
  {
    id: 'sample-12',
    name: '灰尘均匀覆盖',
    description: '光伏板表面均匀覆盖细小灰尘颗粒，整体发电效率降低，建议清洁。',
    imageUrl: '/static/solar-samples/sample11.png',
    source: '现场采集',
    tags: ['灰尘均匀', '效率降低', '定期清洁'],
  },
];
