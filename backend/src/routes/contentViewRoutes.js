const express = require('express');
const router = express.Router();
const contentViewController = require('../controllers/contentViewController');
const { authenticate } = require('../middleware/auth');

router.post('/view', authenticate, contentViewController.recordContentView);
router.post('/:contentType/:contentId/view', authenticate, (req, res, next) => {
  req.body = {
    ...req.body,
    contentType: req.params.contentType,
    contentId: req.params.contentId,
  };
  return contentViewController.recordContentView(req, res, next);
});

module.exports = router;
