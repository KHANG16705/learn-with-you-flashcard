import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testDbConnection } from './config/db.js';
import apiRouter from './routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// 1. Cấu hình cho phép trình duyệt (Frontend) gọi sang Backend và đọc dữ liệu JSON
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Phục vụ thư mục file âm thanh tĩnh (/audio -> backend/uploads/audio)
const audioUploadPath = path.resolve(__dirname, '../uploads/audio');
app.use(
  '/audio',
  express.static(audioUploadPath, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

// 3. Đường dẫn kiểm tra sức khỏe hệ thống (xem Server và MySQL có đang chạy tốt không)
app.get('/api/v1/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'OK',
      db: 'connected',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      db: 'disconnected',
      message: error.message,
    });
  }
});

// 4. Gắn toàn bộ các đường dẫn chức năng (Đăng ký, Đăng nhập, Học từ...) vào gốc /api/v1
app.use('/api/v1', apiRouter);

// 5. Khởi động Server ở cổng 5000 và kiểm tra kết nối MySQL
app.listen(PORT, async () => {
  console.log(`🚀 [Server] Backend API is running on http://localhost:${PORT}`);
  await testDbConnection();
});

export default app;
