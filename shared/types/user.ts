import { RoleValues } from '../config/roles';

export interface User {
  _id: string;
  email: string;
  role: RoleValues;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  isActive: boolean;
}
