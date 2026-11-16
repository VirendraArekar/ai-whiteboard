import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { BoardRole } from '../../common/enums/board-role.enum';

export class AddMemberDto {
  @ApiProperty({ example: 'collaborator@example.com', description: 'Registered user email to invite' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: [BoardRole.EDITOR, BoardRole.VIEWER], default: BoardRole.EDITOR })
  @IsEnum(BoardRole)
  @IsNotEmpty()
  role: BoardRole;
}
