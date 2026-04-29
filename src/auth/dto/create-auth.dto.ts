import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateAuthDto {
     @ApiProperty({ example: 'user@example.com' })
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
