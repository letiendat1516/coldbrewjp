const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const announcementCtrl = require('../controllers/announcement.controller');

router.use(authenticate);

// POST /api/announcements - Create announcement
router.post(
  '/',
  authorize('TEACHER', 'ADMIN'),
  [
    body('classId').notEmpty().withMessage('Class ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    validate,
  ],
  announcementCtrl.createAnnouncement
);

// GET /api/announcements/class/:classId - List announcements
router.get('/class/:classId', announcementCtrl.getClassAnnouncements);

// PUT /api/announcements/:id - Update announcement
router.put('/:id', authorize('TEACHER', 'ADMIN'), announcementCtrl.updateAnnouncement);

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', authorize('TEACHER', 'ADMIN'), announcementCtrl.deleteAnnouncement);

module.exports = router;
