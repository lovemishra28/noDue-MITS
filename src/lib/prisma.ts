import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// We use the pooled DATABASE_URL for the app to handle high traffic
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Please check your environment variables.')
}

console.log('🗄️ Initializing Prisma with pooled connection')

const pool = new Pool({ 
  connectionString,
  max: 5, // Limit connections for Vercel serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (error) => {
  console.error('🔴 Unexpected database connection error:', error)
})

pool.on('connect', () => {
  console.log('✅ Database connection established')
})

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma