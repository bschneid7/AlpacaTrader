import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: Record<string, unknown>;
}
declare const requireUser: (allowedRoles?: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export { requireUser, };
//# sourceMappingURL=auth.d.ts.map