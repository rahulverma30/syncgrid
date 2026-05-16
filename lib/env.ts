import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url().optional(),
  MONGODB_DB_NAME: z.string().min(1).default('syncgrid'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsedEnv = envSchema.safeParse({
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NODE_ENV: process.env.NODE_ENV,
});

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      MONGODB_URI: process.env.MONGODB_URI,
      MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'syncgrid',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD,
      EMAIL_FROM: process.env.EMAIL_FROM,
      NODE_ENV: process.env.NODE_ENV || 'development',
    };

export function getAuthSecret() {
  return env.NEXTAUTH_SECRET || env.AUTH_SECRET || 'development-only-change-this-secret-value';
}

export function assertDatabaseEnv() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required for database operations.');
  }

  return env.MONGODB_URI;
}

export function getEnvReport() {
  return {
    hasMongoUri: Boolean(env.MONGODB_URI),
    hasAuthSecret: Boolean(env.NEXTAUTH_SECRET || env.AUTH_SECRET),
    dbName: env.MONGODB_DB_NAME,
    nextAuthUrl: env.NEXTAUTH_URL,
    nodeEnv: env.NODE_ENV,
  };
}
