const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authCtrl = require('../controllers/auth.controller');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['ADMIN', 'TEACHER', 'STUDENT']).withMessage('Invalid role'),
    validate,
  ],
  authCtrl.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authCtrl.login
);

// GET /api/auth/me
router.get('/me', authenticate, authCtrl.getMe);

module.exports = router;

// POST /api/mazii/search
router.post('/mazii/search', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ success: false, message: 'Keyword required' });
    const r = await fetch('https://mazii.net/api/search/word', {
      method: 'POST', headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer a1dff8abeb4b03cc4ff96378ef8e01eb',
        'User-Agent': 'Mozilla/5.0', 'Referer': 'https://mazii.net/', 'Origin': 'https://mazii.net'
      },
      body: JSON.stringify({ keyword, limit: 15 })
    });
    const data = await r.json();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
