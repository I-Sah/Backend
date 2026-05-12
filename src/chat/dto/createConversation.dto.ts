import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class CreateConversationDto{
    @ApiProperty({
        example: 'Calcules de Math',
        description: 'Titre de la conversation',
    })
    @IsString()
    title!: string

}