import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsString } from "class-validator";
import { Transform } from 'class-transformer';

export class CreateServiceDto {
    @ApiProperty()
    @IsString()
    name!: string;

    @ApiProperty()
    @IsString()
    description!: string;

    @ApiProperty({ type: [Number], example: [1, 2] })
    @Transform(({ value }) => {
        // Si la valeur est une string (ex: "2,3"), on la sépare et on convertit en nombres
        if (typeof value === 'string') {
            return value.split(',').map((id) => parseInt(id.trim(), 10));
        }
        return value;
    })
    @IsArray()
    @IsNumber({}, { each: true }) // Vérifie que chaque élément du tableau est un nombre
    categoryIds!: number[];
}
