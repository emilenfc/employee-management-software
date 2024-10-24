import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/database/users/entities/user.entity';
export const ROLES_KEY = 'roles';

export const Roles = (...args: UserRole[]) => SetMetadata(ROLES_KEY, args);
