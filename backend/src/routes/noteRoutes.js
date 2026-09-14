const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const noteController = require('../controllers/noteController');
const { authenticate, authorize } = require('../middleware/auth');
const { errorResponse } = require('../utils/responseFormatter');

// Configure Multer in-memory storage for uploaded .txt files
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Extension check
  if (ext !== '.txt') {
    return cb(
      new Error(`Unsupported file format "${ext}". Only .txt files are allowed. PDF, DOCX, XLS, and Images are rejected.`),
      false
    );
  }

  // Optional MIME type check if present
  if (file.mimetype && !file.mimetype.includes('text') && file.mimetype !== 'application/octet-stream') {
    return cb(
      new Error(`Invalid MIME type "${file.mimetype}". Please upload a valid UTF-8 plain text file (.txt).`),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

// Custom wrapper middleware to handle Multer validation errors cleanly
const handleUpload = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return errorResponse(res, 'File size exceeds maximum limit of 5MB.', 'FILE_TOO_LARGE', 400);
        }
        return errorResponse(res, `Upload error: ${err.message}`, 'UPLOAD_ERROR', 400);
      } else if (err) {
        return errorResponse(res, err.message, 'INVALID_FILE_TYPE', 400);
      }

      // Check empty file buffer if file uploaded
      if (req.file && req.file.buffer.length === 0) {
        return errorResponse(res, 'Uploaded text file is empty (0 bytes).', 'EMPTY_FILE', 400);
      }

      next();
    });
  };
};

// Public / Candidate routes
router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);

// Admin-only routes
router.post('/preview', authenticate, authorize(['admin']), handleUpload('file'), noteController.previewNote);
router.post('/', authenticate, authorize(['admin']), handleUpload('file'), noteController.createNote);
router.put('/:id', authenticate, authorize(['admin']), handleUpload('file'), noteController.updateNote);
router.delete('/:id', authenticate, authorize(['admin']), noteController.deleteNote);

module.exports = router;
