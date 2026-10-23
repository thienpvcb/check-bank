import jwt from 'jsonwebtoken';
import { findById } from '../db/users.js';

export const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }

  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const user    = await findById(payload.sub);
    if (!user) return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Không có quyền Admin' });
  }
  next();
};
