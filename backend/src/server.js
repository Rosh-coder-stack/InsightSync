import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { connectDB } from './config/db.js';
import meetingRoutes from './routes/meetingRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'InsightSync API',
  });
});

app.use('/api/meetings', meetingRoutes);

// Centralized error handler for Multer upload errors and API failures
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded audio file exceeds the 25 MB size limit.'
        : err.message;
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  if (err.message?.startsWith('Unsupported audio format')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`InsightSync API listening on port ${PORT}`);
  });
}

startServer();
