import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const authRouter = Router();

const generateTokens = (user: { id: string; email: string; role: string; name: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'] }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
  return { accessToken, refreshToken };
};


// ─── Register ──────────────────────────────────────────────────────────────────

authRouter.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Data tidak valid: ' + errors.array().map(e => e.msg).join(', '), 400));
    }

    try {
      const { email, password, name, phone, kelurahanId } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return next(new AppError('Email sudah terdaftar', 409));

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          kelurahanId: kelurahanId || null,
        },
        select: { id: true, email: true, name: true, role: true, phone: true, kelurahanId: true },
      });

      const { accessToken, refreshToken } = generateTokens(user);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: { id: uuidv4(), token: refreshToken, userId: user.id, expiresAt },
      });

      return res.status(201).json({
        message: 'Registrasi berhasil',
        user,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── Login ────────────────────────────────────────────────────────────────────

authRouter.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Email dan password diperlukan', 400));
    }

    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { kelurahan: true },
      });

      if (!user || !user.isActive) {
        return next(new AppError('Email atau password salah', 401));
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return next(new AppError('Email atau password salah', 401));
      }

      const { accessToken, refreshToken } = generateTokens(user);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: { id: uuidv4(), token: refreshToken, userId: user.id, expiresAt },
      });

      return res.json({
        message: 'Login berhasil',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          kelurahan: user.kelurahan,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      return next(err);
    }
  }
);

// ─── Refresh Token ────────────────────────────────────────────────────────────

authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new AppError('Refresh token diperlukan', 400));

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };

    const stored = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, userId: payload.id, expiresAt: { gt: new Date() } },
    });

    if (!stored) return next(new AppError('Refresh token tidak valid', 401));

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) return next(new AppError('User tidak ditemukan', 404));

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { id: uuidv4(), token: newRefreshToken, userId: user.id, expiresAt },
    });

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    return next(new AppError('Refresh token tidak valid', 401));
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId: req.user!.id },
      });
    }
    return res.json({ message: 'Logout berhasil' });
  } catch (err) {
    return next(err);
  }
});

// ─── Get Me ───────────────────────────────────────────────────────────────────

authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, kelurahan: true },
    });
    if (!user) return next(new AppError('User tidak ditemukan', 404));
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});
