import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateAuthDto {
      @ApiProperty({ example: 'Rakoto' })
      @IsString()
      pseudo!: string;

      @ApiProperty({ example: 'rakoto@example.com' })
      @IsEmail()
      email!: string;
    
      @ApiProperty({ example: 'password123' })
      @IsString()
      password!: string;

      @ApiProperty({ example: 'password123' })
      @IsString() 
      @IsNotEmpty() 
      confirmPassword!: string;
}
