import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SignalStatus } from '../enums/signal_status.enum';
import { SignalUrgence } from '../enums/urgence.enum';

export class CreateSignalDto {

  @ApiProperty({ description: 'Latitude of reporting', default: -18.1444 })
  latitude!: number;

  @ApiProperty({ description: 'Longitude of reporting', default: 49.4223 })
  longitude!: number;

  @ApiProperty({
    description: 'Category of reporting',
    example: 'Accident',
  })
  categorie!: string;

  @ApiProperty({ description: 'Title of the report', default: 'Lampadaire cassé' })
  titre!: string;

  @ApiProperty({
    description: 'Description of the report',
    required: false,
    nullable: true,
  })
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    
  })
  created_at!: Date;

  @ApiProperty({
    description: 'URL of the picture hosted on the external service',
    required: false,
  })
  @IsOptional()
  picture?: string;

  @ApiProperty({
    description: 'Status of the report',
    enum: SignalStatus,
    default: SignalStatus.NOUVEAU,
    required: false,
  })
  @IsEnum(SignalStatus)
  @IsOptional()
  signal_status?: SignalStatus;

  @ApiProperty({
    description: 'Priority of the report',
    enum: SignalUrgence,
    default: SignalUrgence.FAIBLE,
    required: false,
  })
  @IsOptional()
  priority?: SignalUrgence;

  @ApiProperty({
    description: 'Indicates if the report is anonymous',
    default: false,
  })
  anonyme!: boolean;

  @ApiProperty({
    description: 'ID of the service',
    format: 'number',
  })
  service_id!: number;

  @ApiProperty({
    description: 'Timestamp of the last update',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  @IsOptional()
  update_at?: Date;

  @ApiProperty({
    description: 'Timestamp of resolution',
    format: 'date-time',
    required: false,
    nullable: true,
  })
  @IsOptional()
  resolu_at?: Date;
}