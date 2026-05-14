import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer'; // 🚀 IMPORTANT
import { SignalStatus } from '../enums/signal_status.enum';
import { SignalUrgence } from '../enums/urgence.enum';

export class CreateSignalDto {

  @ApiProperty({ description: 'Latitude of reporting', default: -18.1444 })
  @Transform(({ value }) => Number(value)) // Convertit la string en number
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Longitude of reporting', default: 49.4223 })
  @Transform(({ value }) => Number(value)) // Convertit la string en number
  @IsNumber()
  longitude!: number;

  @ApiProperty({ description: 'Category of reporting' })
  @Transform(({ value }) => Number(value)) // Convertit la string en number
  @IsNumber()
  categorie_id!: number;

  @ApiProperty({ description: 'Title of the report', default: 'Lampadaire cassé' })
  @IsNotEmpty()
  titre!: string;

  @ApiProperty({ description: 'Description of the report', required: false, nullable: true })
  @IsOptional()
  description?: string;

  @ApiProperty({ type: String, format: 'date-time', required: false })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : new Date()) // Gère la date automatiquement
  created_at!: Date;

  @ApiProperty({ description: 'URL of the picture hosted on the external service', required: false })
  @IsOptional()
  picture?: string;

  @ApiProperty({ description: 'Status of the report', enum: SignalStatus, default: SignalStatus.NOUVEAU, required: false })
  @IsEnum(SignalStatus)
  @IsOptional()
  signal_status?: SignalStatus;

  @ApiProperty({ description: 'Priority of the report', enum: SignalUrgence, default: SignalUrgence.FAIBLE, required: false })
  @IsOptional()
  priority?: SignalUrgence;

  @ApiProperty({ description: 'Indicates if the report is anonymous', default: false })
  @Transform(({ value }) => value === 'true' || value === true || value === '1') // Convertit en vrai booléen
  @IsBoolean()
  anonyme!: boolean;

  @ApiProperty({ description: 'ID of the service', format: 'number' , nullable: true })
  @Transform(({ value }) => Number(value)) // Convertit la string en number
  @IsNumber()
  service_id!: number;
}