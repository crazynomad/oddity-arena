export interface Challenge {
  id: string;
  slug: string;
  title: string;
  titleCn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  description: string;
  descCn: string;
  models: string[];
}

export const CHALLENGES: Challenge[] = [
  {
    id: '03-angry-birds',
    slug: 'angry-birds',
    title: 'Angry Birds Clone',
    titleCn: '愤怒的小鸟',
    difficulty: 'medium',
    category: 'game',
    description: 'Build a playable Angry Birds clone with physics',
    descCn: '构建一个可玩的愤怒的小鸟克隆版，包含物理引擎',
    models: ['claude-opus-4.6', 'claude-sonnet-4', 'claude-sonnet-4.6', 'minimax-m2.5', 'glm-5', 'kimi-k2.5', 'qwen3.5-plus', 'gpt-5.3-codex', 'gemini-3.1-pro'],
  },
  {
    id: '06-tiyunzong',
    slug: 'tiyunzong',
    title: 'Tiyunzong Wuxia Animation',
    titleCn: '梯云纵',
    difficulty: 'hard',
    category: 'creative',
    description: 'Animate a wuxia martial arts lightness skill',
    descCn: '实现武侠轻功「梯云纵」动画效果',
    models: ['claude-opus-4.6', 'claude-sonnet-4', 'minimax-m2.5', 'glm-5', 'kimi-k2.5', 'qwen3.5-plus', 'gpt-5.3-codex', 'gemini-3.1-pro'],
  },
  {
    id: '05-munchausen',
    slug: 'munchausen',
    title: 'Baron Munchausen',
    titleCn: '闵希豪森男爵',
    difficulty: 'hard',
    category: 'creative',
    description: 'Visualize the legendary Baron Munchausen tales',
    descCn: '可视化闵希豪森男爵的传奇故事',
    models: ['claude-opus-4.6', 'claude-sonnet-4', 'claude-sonnet-4.6', 'minimax-m2.5', 'glm-5', 'kimi-k2.5', 'qwen3.5-plus', 'gpt-5.3-codex', 'gemini-3.1-pro'],
  },
  {
    id: '01-web-redesign',
    slug: 'web-redesign',
    title: 'Web Page Redesign',
    titleCn: '网页重构',
    difficulty: 'easy',
    category: 'frontend',
    description: 'Redesign a web page with modern aesthetics',
    descCn: '用现代审美重新设计一个网页',
    models: ['claude-opus-4.6', 'claude-sonnet-4', 'minimax-m2.5', 'glm-5', 'kimi-k2.5', 'qwen3.5-plus', 'gpt-5.3-codex', 'gemini-3.1-pro'],
  },
  {
    id: '04-pelican-bicycle',
    slug: 'pelican-bicycle',
    title: 'Pelican on a Bicycle',
    titleCn: '鹈鹕骑自行车',
    difficulty: 'hard',
    category: 'svg',
    description: 'The legendary AI benchmark — SVG of a pelican riding a bicycle',
    descCn: 'AI 界最著名的基准测试 — 鹈鹕骑自行车 SVG',
    models: ['claude-sonnet-4', 'glm-5', 'gpt-5.3-codex', 'kimi-k2.5', 'qwen3.5-plus'],
  },
  {
    id: '02-3d-solar-system',
    slug: '3d-solar-system',
    title: '3D Solar System',
    titleCn: '3D 太阳系',
    difficulty: 'hard',
    category: '3d',
    description: 'Build an interactive 3D solar system simulation',
    descCn: '构建一个可交互的 3D 太阳系模拟',
    models: ['claude-opus-4.6', 'claude-sonnet-4', 'claude-sonnet-4.6'],
  },
];

// Arcade mode sequence
export const ARCADE_SEQUENCE = CHALLENGES.map(c => c.id);

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find(c => c.id === id);
}

export function getNextChallenge(currentId: string): Challenge | undefined {
  const idx = ARCADE_SEQUENCE.indexOf(currentId);
  if (idx < 0 || idx >= ARCADE_SEQUENCE.length - 1) return undefined;
  return getChallengeById(ARCADE_SEQUENCE[idx + 1]);
}

export function getChallengeIndex(id: string): number {
  return ARCADE_SEQUENCE.indexOf(id);
}
