import fs from 'node:fs';
import { Router } from 'express';
import multer from 'multer';
import { UPLOAD_DIR } from '../config.js';
import { HttpError } from '../utils/http.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${EXT[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype]
      ? cb(null, true)
      : cb(new HttpError(400, 'Only PNG, JPG, WEBP or GIF images are allowed')),
});

const router = Router();

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'No image uploaded');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export default router;
