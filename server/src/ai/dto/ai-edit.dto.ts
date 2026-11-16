import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AiEditDto {
  @ApiProperty({ description: 'Target whiteboard ID' })
  @IsUUID()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty({ type: [String], description: 'Selected element IDs to edit' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  elementIds: string[];

  @ApiProperty({ example: 'Summarize the content into clear, action-oriented bullet points' })
  @IsString()
  @IsNotEmpty()
  instruction: string;
}
