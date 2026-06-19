import { z } from "zod"
import 'dotenv/config'


const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5000'),
    MONGODB_URI: z.string().min(1, 'MongoDB URI required'),
    REDIS_URL: z.string().min(1, 'Redis URL required'),
    JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 chars'),
    JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('14d'),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GITHUB_CALLBACK_URL: z.string().url(),
    MISTRAL_API_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
})

const parsed=envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format())
    process.exit(1)
}

export const env = parsed.data
