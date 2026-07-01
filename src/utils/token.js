const jwt = require('jsonwebtoken');

// Use explicit development defaults to avoid hard-to-debug crashes when env vars are missing.
const ACCESS_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev_access_secret');
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev_refresh_secret');

if (process.env.NODE_ENV === 'development') {
  if (!process.env.JWT_SECRET) console.warn('Warning: JWT_SECRET not set — using development fallback');
  if (!process.env.JWT_REFRESH_SECRET) console.warn('Warning: JWT_REFRESH_SECRET not set — using development fallback');
}

const generateAccessToken = (user) => {
  if (!ACCESS_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => {
  if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not configured');
  return jwt.sign(
    { id: user._id },
    REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const verifyRefreshToken = (token) => {
  if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not configured');
  return jwt.verify(token, REFRESH_SECRET);
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, setRefreshCookie };
