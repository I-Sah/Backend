import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  newPassword!: string;

  @ApiProperty({ example: 'confirmPassword123' })
  @IsString()
  confirmPassword!: string;
}