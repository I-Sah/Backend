import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty()
    @IsString()
    name!: string;
}
