import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BoardRole } from '../../common/enums/board-role.enum';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: [BoardRole.EDITOR, BoardRole.VIEWER] })
  @IsEnum(BoardRole)
  @IsNotEmpty()
  role: BoardRole;
}
