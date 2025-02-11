import mysql from 'mysql2/promise'

export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Admin@123',
  database: process.env.DB_NAME || 'recommend_system',
})
