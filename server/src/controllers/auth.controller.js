const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");


/**
 * POST /api/auth/register
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: role || "STUDENT",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign({ id: user.id.toString() }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with email & password
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (user.status === "BANNED") {
      return res
        .status(403)
        .json({ success: false, message: "Account has been banned" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id.toString() }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: {
          id: userWithoutPassword.id,
          fullName: userWithoutPassword.fullName,
          email: userWithoutPassword.email,
          avatar: userWithoutPassword.avatar,
          role: userWithoutPassword.role,
          status: userWithoutPassword.status,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Proxy for Mazii API
exports.maziiProxy = async (req, res, next) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ success: false, message: 'Keyword required' });
    const r = await fetch('https://mazii.net/api/search/word', {
      method: 'POST', headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer a1dff8abeb4b03cc4ff96378ef8e01eb',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://mazii.net/',
        'Origin': 'https://mazii.net'
      },
      body: JSON.stringify({ keyword, limit: 15 })
    });
    const data = await r.json();
    res.json({ success: true, data });
  } catch (e) { next(e); }
