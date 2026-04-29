import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  email!: string;
  
  @ApiProperty({ example: 'newPassword123' })
  newPassword!: string;
  
  @ApiProperty({ example: 'confirmPassword123' })
  confirmPassword!: string; // Pour la validation côté serveur
}