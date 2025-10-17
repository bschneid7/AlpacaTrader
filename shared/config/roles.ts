export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export const ALL_ROLES: RoleValues[] = Object.values(ROLES);

export type RoleValues = typeof ROLES[keyof typeof ROLES];
