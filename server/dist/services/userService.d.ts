import { IUser } from '../models/User';
interface CreateUserData {
    email: string;
    password: string;
    name?: string;
}
declare class UserService {
    static list(): Promise<IUser[]>;
    static get(id: string): Promise<IUser | null>;
    static getByEmail(email: string): Promise<IUser | null>;
    static update(id: string, data: Partial<IUser>): Promise<IUser | null>;
    static delete(id: string): Promise<boolean>;
    static authenticateWithPassword(email: string, password: string): Promise<IUser | null>;
    static create({ email, password, name }: CreateUserData): Promise<IUser>;
    static setPassword(user: IUser, password: string): Promise<IUser>;
}
export default UserService;
//# sourceMappingURL=userService.d.ts.map