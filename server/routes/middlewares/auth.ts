import UserService from '../../services/userService';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ALL_ROLES } from 'shared';

interface AuthRequest extends Request {
  user?: Record<string, unknown>;
}

const requireUser = (allowedRoles: string[] = ALL_ROLES) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
      const user = await UserService.get(decoded.sub);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // If roles are specified, check if user has one of the allowed roles
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      req.user = user;
      next();
    } catch {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };
};

export {
  requireUser,
};
