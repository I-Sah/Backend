import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 1,
    description: 'Identifiant de la conversation',
  })
  @IsNumber()
  @IsNotEmpty()
  conversationId!: number;


  @ApiProperty({
    example: 'Salame!! Afaka manampy ahy ve enao',
    description: 'Message utilisateur',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;
}