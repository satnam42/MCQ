const express = require('express');
const router = express.Router();
const multer = require('multer');
const questionController = require('../controllers/questionController');
const { validateQuestion } = require('../validators/questionValidator');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Admin & Candidate Endpoints for Demo Flexibility
router.use(authenticate);

router.get('/', questionController.listQuestions);
router.get('/export', questionController.exportQuestions);
router.post('/', requirePermission('MANAGE_QUESTIONS'), validateQuestion, questionController.createQuestion);
router.put('/:id', requirePermission('MANAGE_QUESTIONS'), questionController.updateQuestion);
router.delete('/:id', requirePermission('DELETE_QUESTIONS'), questionController.deleteQuestion);
router.post('/bulk-delete', requirePermission('DELETE_QUESTIONS'), questionController.bulkDeleteQuestions);
router.delete('/', requirePermission('DELETE_QUESTIONS'), questionController.bulkDeleteQuestions);

router.post('/import', requirePermission('BULK_IMPORT'), upload.single('file'), questionController.importQuestions);
router.post('/import-json', requirePermission('BULK_IMPORT'), upload.single('file'), questionController.importQuestionsJSON);
router.post('/generate-preview', requirePermission('MANAGE_QUESTIONS'), questionController.generatePreview);

module.exports = router;
