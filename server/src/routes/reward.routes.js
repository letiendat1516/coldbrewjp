const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const rewardCtrl = require('../controllers/reward.controller');

router.use(authenticate);

// POST /api/rewards - Give reward/penalty
router.post(
  '/',
  authorize('TEACHER', 'ADMIN'),
  [
    body('classId').notEmpty().withMessage('Class ID is required'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('stickerId').notEmpty().withMessage('Sticker ID is required'),
    validate,
  ],
  rewardCtrl.giveReward
);

// GET /api/rewards/class/:classId - Class reward logs
router.get('/class/:classId', rewardCtrl.getClassRewards);

// GET /api/rewards/student/:studentId/class/:classId - Student rewards in class
router.get('/student/:studentId/class/:classId', rewardCtrl.getStudentRewards);

// DELETE /api/rewards/:id - Delete reward log
router.delete('/:id', authorize('TEACHER', 'ADMIN'), rewardCtrl.deleteReward);

module.exports = router;
