/**
 * Application configuration
 * Centralized configuration for the entire application
 */

export const appConfig = {
  name: 'SyncGrid',
  description: 'Enterprise-Grade Agency ERP & Company Management System',
  version: '1.0.0',
  
  features: {
    themeToggle: true,
    notifications: true,
    commandPalette: true,
    darkMode: true,
  },

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
  },

  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    refreshTokenInterval: 15 * 60 * 1000, // 15 minutes
  },

  ui: {
    animationEnabled: true,
    toastPosition: 'bottom-right' as const,
    sidebarCollapsible: true,
  },
} as const;

export type AppConfig = typeof appConfig;
