import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post('/', authenticate, uploadSingle, (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'فایلی آپلود نشد' });
    }

    const relativePath = req.file.path.replace(path.join(__dirname, '../../uploads'), '').replace(/\\/g, '/');
    const fileUrl = `/uploads${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;
    
    res.json({
      success: true,
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

