import type { Platform } from './types';

export const THEME_TRANSITION_LOCK_CLASS = 'theme-switching';

export const PLATFORM_META: Record<string, Pick<Platform, 'category' | 'subtitle' | 'accentColor'>> = {
  weibo: { category: 'ent', subtitle: '实时热榜 · 每分钟更新', accentColor: '#ff8200' },
  xiaohongshu: { category: 'life', subtitle: '生活方式与消费趋势', accentColor: '#ff2442' },
  bilibili: { category: 'ent', subtitle: '全站热门视频潮流', accentColor: '#fb7299' },
  douyin: { category: 'ent', subtitle: '短视频实时焦点', accentColor: '#00f2fe' },
  toutiao: { category: 'comm', subtitle: '今日头条热点聚合', accentColor: '#f04142' },
  zhihu: { category: 'comm', subtitle: '深度讨论，精彩问答', accentColor: '#0084ff' },
  baidu: { category: 'comm', subtitle: '全网搜索热门关注', accentColor: '#4e6ef2' },
  baidutieba: { category: 'comm', subtitle: '贴吧社区热议焦点', accentColor: '#3385ff' },
  qq: { category: 'comm', subtitle: '腾讯新闻热点榜单', accentColor: '#1d9bf0' },
  hupu: { category: 'ent', subtitle: '步行街热帖精选', accentColor: '#d71920' },
  juejin: { category: 'tech', subtitle: '开发者热点与技术沉淀', accentColor: '#1e80ff' },
  'github-trending': { category: 'tech', subtitle: '开源社区热门仓库', accentColor: '#8b949e' },
  'hello-github': { category: 'tech', subtitle: '开源项目精选推荐', accentColor: '#f59e0b' },
  csdn: { category: 'tech', subtitle: '技术社区热门内容', accentColor: '#fc5531' },
  netease: { category: 'comm', subtitle: '网易新闻热榜', accentColor: '#d81e06' },
  quark: { category: 'life', subtitle: '夸克今日热点', accentColor: '#6d5dfc' },
  lol: { category: 'ent', subtitle: '英雄联盟更新公告', accentColor: '#c89b3c' },
  thepaper: { category: 'comm', subtitle: '澎湃新闻热榜', accentColor: '#2563eb' },
  kuaishou: { category: 'ent', subtitle: '快手热门内容', accentColor: '#ff5000' },
  dongchedi: { category: 'life', subtitle: '汽车热点与行业动向', accentColor: '#ffcc00' },
  'history-today': { category: 'life', subtitle: '追溯历史上的今天', accentColor: '#8b5cf6' },
  weread: { category: 'life', subtitle: '微信读书飙升榜', accentColor: '#22c55e' },
  'douban-movic': { category: 'ent', subtitle: '豆瓣电影新片榜', accentColor: '#00b51d' },
  'netease-music': { category: 'ent', subtitle: '网易云音乐热歌榜', accentColor: '#c20c0c' },
  woshipm: { category: 'tech', subtitle: '产品经理圈内热榜', accentColor: '#0ea5e9' },
  '36kr': { category: 'tech', subtitle: '创投科技与前沿干货', accentColor: '#0066ff' },
  huxiu: { category: 'tech', subtitle: '商业科技最新资讯', accentColor: '#f59e0b' },
  'zhihu-daily': { category: 'comm', subtitle: '知乎日报推荐榜', accentColor: '#0084ff' },
  ifanr: { category: 'tech', subtitle: '爱范儿科技快讯', accentColor: '#111827' },
  ithome: { category: 'tech', subtitle: '极客数码和软硬件动态', accentColor: '#f43f5e' },
};

export const FALLBACK_META: Pick<Platform, 'category' | 'subtitle' | 'accentColor'> = {
  category: 'comm',
  subtitle: '全网热点实时追踪',
  accentColor: '#ff8200',
};

export const SUITS = [
  '摸鱼吃瓜',
  '喜提 Bugfree',
  '优雅重构',
  '准点下班',
  '给开源点 Star',
  '收藏干货',
  '一键三连',
  '发现宝藏博主',
  '灵感爆发',
  '顺畅冲浪',
  '沉浸式学习',
  '找到神仙库',
];

export const AVOIDS = [
  '键盘对线',
  '提 PR 直接部署',
  '相信网络水军',
  '评论区开撕',
  '轻易被种草',
  '乱立工作 Flag',
  '线上直接 Debug',
  '加班赶代码',
  '消息秒回',
  '高估自己发量',
];
