import mysql from 'mysql2/promise'

export const db = mysql.createPool({
  host: process.env.DB_HOST || '203.149.8.14',
  user: process.env.DB_USER || 'karn',
  password: process.env.DB_PASS || 'Admin@123',
  database: process.env.DB_NAME || 'recommend_system',
})
