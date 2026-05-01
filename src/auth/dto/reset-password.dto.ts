import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;

  @IsNotEmpty()
  confirmPassword!: string;
}