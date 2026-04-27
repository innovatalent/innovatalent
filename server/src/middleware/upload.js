const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.upload.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, DOC o DOCX'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxSize },
});

module.exports = upload;
