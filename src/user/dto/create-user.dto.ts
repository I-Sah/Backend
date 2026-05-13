import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { User, UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Rakoto' })
  @IsString()
  pseudo!: string;

  @ApiProperty({ example: 'rakoto@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: UserRole.USER, enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: 'image.png'})
  @IsString()
  avatar!: string;


  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;
}