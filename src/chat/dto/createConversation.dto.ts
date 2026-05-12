import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class CreateConversationDto{
    @ApiProperty({
        example: '2',
        description: 'Identifiant de l\'utilisateur',    
    })
    @IsInt()
    userId!: number

    @ApiProperty({
        example: 'Calcules de Math',
        description: 'Titre de la conversation',
    })
    @IsString()
    title!: string

}