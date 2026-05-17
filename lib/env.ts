import { z } from 'zod';

const envSchema = z
  .object({
    MONGODB_URI: z
      .string()
      .refine((val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
        message:
          'MONGODB_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://',
      }),
    MONGODB_DB_NAME: z.string().min(1).default('syncgrid'),
    NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
    NEXTAUTH_SECRET: z
      .string()
      .min(32, 'NEXTAUTH_SECRET must be at least 32 characters long')
      .optional(),
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters long').optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_SECURE: z.coerce.boolean().default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  })
  .refine((data) => data.NEXTAUTH_SECRET || data.AUTH_SECRET, {
    message:
      'Either NEXTAUTH_SECRET or AUTH_SECRET must be provided and must be at least 32 characters long',
    path: ['NEXTAUTH_SECRET'],
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

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.format();
  console.error('❌ Environment validation failed:', JSON.stringify(formattedErrors, null, 2));
  throw new Error(
    `Invalid environment configuration. Details: ${parsedEnv.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
  );
}

export const env = parsedEnv.data;

export function getAuthSecret(): string {
  const secret = env.NEXTAUTH_SECRET || env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is completely missing in environment.');
  }
  return secret;
}

export function assertDatabaseEnv() {
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
