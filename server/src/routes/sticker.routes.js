const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const stickerCtrl = require('../controllers/sticker.controller');

router.use(authenticate);

// ==================== STICKER SETS ====================

// POST /api/stickers/sets - Create sticker set
router.post(
  '/sets',
  authorize('TEACHER', 'ADMIN'),
  [body('name').trim().notEmpty().withMessage('Set name is required'), validate],
  stickerCtrl.createStickerSet
);

// GET /api/stickers/sets - List sticker sets
router.get('/sets', authorize('TEACHER', 'ADMIN'), stickerCtrl.getStickerSets);

// GET /api/stickers/sets/:id - Sticker set detail
router.get('/sets/:id', stickerCtrl.getStickerSetDetail);

// PUT /api/stickers/sets/:id - Update sticker set
router.put('/sets/:id', authorize('TEACHER', 'ADMIN'), stickerCtrl.updateStickerSet);

// DELETE /api/stickers/sets/:id - Delete sticker set
router.delete('/sets/:id', authorize('TEACHER', 'ADMIN'), stickerCtrl.deleteStickerSet);

// ==================== STICKERS ====================

// POST /api/stickers - Create sticker
router.post(
  '/',
  authorize('TEACHER', 'ADMIN'),
  [
    body('stickerSetId').notEmpty().withMessage('Sticker set ID is required'),
    body('name').trim().notEmpty().withMessage('Sticker name is required'),
    body('point').isInt().withMessage('Point must be an integer'),
    body('type').isIn(['REWARD', 'PENALTY']).withMessage('Type must be REWARD or PENALTY'),
    validate,
  ],
  stickerCtrl.createSticker
);

// PUT /api/stickers/:id - Update sticker
router.put('/:id', authorize('TEACHER', 'ADMIN'), stickerCtrl.updateSticker);

// DELETE /api/stickers/:id - Delete sticker
router.delete('/:id', authorize('TEACHER', 'ADMIN'), stickerCtrl.deleteSticker);

// ==================== CLASS ASSIGNMENT ====================

// POST /api/stickers/assign - Assign sticker set to class
router.post(
  '/assign',
  authorize('TEACHER', 'ADMIN'),
  [
    body('classId').notEmpty().withMessage('Class ID is required'),
    body('stickerSetId').notEmpty().withMessage('Sticker set ID is required'),
    validate,
  ],
  stickerCtrl.assignStickerSetToClass
);

// DELETE /api/stickers/assign/:id - Remove assignment
router.delete('/assign/:id', authorize('TEACHER', 'ADMIN'), stickerCtrl.removeStickerSetFromClass);

module.exports = router;
