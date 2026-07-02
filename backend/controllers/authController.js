const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, setRefreshCookie } = require('../utils/token');
const { generateOTP } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });

    const user = await User.create({ name, email, phone, password, role: role || 'customer' });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ user, accessToken });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({ user, accessToken });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token.' });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found.' });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  res.json({ message: 'Logged out successfully.' });
};

const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email.' });

    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: email,
      subject: 'MediFlow - Password Reset OTP',
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP expires in 10 minutes.</p>`
    });

    res.json({ message: 'OTP sent to email.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email.' });
    if (!user.resetOTP || user.resetOTP !== otp) return res.status(400).json({ message: 'Invalid OTP.' });
    if (user.resetOTPExpiry < new Date()) return res.status(400).json({ message: 'OTP expired.' });

    user.password = newPassword;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getProfile, forgotPassword, resetPassword };
