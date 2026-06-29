const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const rankingCtrl = require('../controllers/ranking.controller');

router.use(authenticate);

// GET /api/ranking/class/:classId - Full ranking
router.get('/class/:classId', rankingCtrl.getClassRanking);

// GET /api/ranking/class/:classId/summary - Quick summary
router.get('/class/:classId/summary', rankingCtrl.getClassSummary);

module.exports = router;
