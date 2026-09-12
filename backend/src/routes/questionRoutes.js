const express = require('express');
const router = express.Router();
const multer = require('multer');
const questionController = require('../controllers/questionController');
const { validateQuestion } = require('../validators/questionValidator');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Admin & Candidate Endpoints for Demo Flexibility
router.use(authenticate, authorize(['admin', 'candidate']));

router.get('/', questionController.listQuestions);
router.get('/export', questionController.exportQuestions);
router.post('/', validateQuestion, questionController.createQuestion);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);
router.post('/bulk-delete', questionController.bulkDeleteQuestions);
router.delete('/', questionController.bulkDeleteQuestions);

router.post('/import', upload.single('file'), questionController.importQuestions);
router.post('/import-json', upload.single('file'), questionController.importQuestionsJSON);
router.post('/generate-preview', questionController.generatePreview);

module.exports = router;
