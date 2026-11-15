import { SetMetadata } from '@nestjs/common';
import { BoardRole } from '../enums/board-role.enum';

export const ROLES_KEY = 'board_roles';
export const RequireBoardRoles = (...roles: BoardRole[]) => SetMetadata(ROLES_KEY, roles);
