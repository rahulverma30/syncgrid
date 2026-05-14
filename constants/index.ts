export * from './routes';
export * from './navigation';

export const APP_NAME = 'SyncGrid';
export const APP_DESCRIPTION = 'Enterprise-Grade Agency ERP & Company Management System';

export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 80;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

export const ANIMATION_DURATION = {
  FAST: 0.2,
  BASE: 0.3,
  SLOW: 0.5,
} as const;
