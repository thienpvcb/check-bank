import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByUsername, findById, safeUser } from '../db/users.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const user = await findByUsername(username.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  return res.json({
    success: true,
    data: {
      token,
      user: safeUser(user),
    },
  });
});

// GET /api/auth/me — get current user
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: safeUser(req.user) });
});

// POST /api/auth/logout — client drops token; server can blacklist if needed
router.post('/logout', authenticate, (_req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

export default router;
