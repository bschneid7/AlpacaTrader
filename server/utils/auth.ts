import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

const generateAccessToken = (user: IUser): string => {
  const payload = {
    sub: user._id
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' });
};

const generateRefreshToken = (user: IUser): string => {
  const payload = {
    sub: user._id
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '30d' });
};

export {
  generateAccessToken,
  generateRefreshToken
};
