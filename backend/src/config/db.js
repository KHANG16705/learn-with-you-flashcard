import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flashcard_srs_db',
  charset: 'utf8mb4',
  timezone: '+07:00',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Kiểm tra kết nối tới MySQL 8.0+ Connection Pool khi khởi động Server
 */
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    console.log(
      `✅ [MySQL] Connected to database "${process.env.DB_NAME || 'flashcard_srs_db'}" at ${
        process.env.DB_HOST || '127.0.0.1'
      }:${process.env.DB_PORT || 3306} (utf8mb4, timezone +07:00)`
    );
    return true;
  } catch (error) {
    console.error('❌ [MySQL] Database connection failed:', error.message);
    return false;
  }
}

export { pool, testDbConnection };
export default pool;
