import { Controller, Post, 
  Body, Get, Param,Put, Delete, Query, UseInterceptors, UploadedFile, HttpStatus,
  HttpCode, ParseIntPipe,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SignalService } from './signal.service';
import { CreateSignalDto } from './dto/create-signal.dto';
import { UpdateSignalDto } from './dto/update-signal.dto';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { SignalUrgence } from './enums/urgence.enum';
import { sign } from 'node:crypto';
import { SignalStatus } from './enums/signal_status.enum';
import multer from 'multer';

@ApiTags('Signalements')
@Controller('signals')
export class SignalController {
  constructor(private readonly signalService: SignalService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau signalement avec une photo',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Données du signalement et fichier image',
    schema: {
      type: 'object',

      properties: {

        fichier: {
          type: 'string',
          format: 'binary',
          description: 'Photo du signalement (optionnel)',
        },

        latitude: {
          type: 'number',
          default: -18.1444,
        },

        longitude: {
          type: 'number',
          default: 49.4223,
        },

        categorie: {
          type: 'string',
          example: 'Accident',
        },

        titre: {
          type: 'string',
          default: 'Lampadaire cassé',
        },

        signal_status: {
          type: 'enum',
          enum: Object.values(SignalStatus),
          description: 'Statut du signalement ',
        },

        description: {
          type: 'string',
          default: 'Description détaillée du signalement',
          description: 'Description détaillée du signalement (optionnel)',
        },

        priority: {
          type: 'enum',
          enum: Object.values(SignalUrgence),
          description: 'Priorité du signalement ',
        },

        anonyme: {
          type: 'boolean',
        },

        service_id: {
          type: 'number',
        },

        created_at: {
          type: 'string',
          format: 'date-time',
        },

        update_at: {
          type: 'string',
          format: 'date-time',
        },

        resolu_at: {
          type: 'string',
          format: 'date-time',
        },
      },

      required: [
        'latitude',
        'longitude',
        'categorie',
        'titre',
        'service_id',
        'created_at',
      ],
    },
  })
  @UseInterceptors(
  FileInterceptor('fichier', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
  }),
)
  async create(
    @Req() req: any,
    @Body() createSignalDto: CreateSignalDto,
    @UploadedFile() fichier?: Express.Multer.File,
  ) {

    // récupération automatique depuis le JWT
    const userId = req.user.sub;

    return await this.signalService.createSignal(
      createSignalDto,
      fichier,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les signalements (Pagination)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de la page (Défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (Défaut: 10)' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.signalService.findAll(+page, +limit);
  }

  @Get('all')
  @ApiOperation({ summary: 'Alternative - Obtenir la liste de tous les signalements' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllSignals(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.signalService.getAllSignals(+page, +limit);
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,) {
    return await this.signalService.getSignalById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un signalement existant (Données ou Photo)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Données à mettre à jour et/ou nouvelle photo',
    schema: {
      type: 'object',
      properties: {
        fichier: {
          type: 'string',
          format: 'binary',
          description: 'Nouvelle photo pour remplacer l\'ancienne (Optionnel)',
        },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        signal_type: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string' },
        signal_status: { type: 'string', description: 'Statut du signalement (PENDING, VALIDATED, etc.)' }
      },
    },
  })
  @UseInterceptors(FileInterceptor('fichier'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSignalDto: UpdateSignalDto,
    @UploadedFile() fichier?: Express.Multer.File,
  ) {
    return await this.signalService.updateSignal(id, updateSignalDto, fichier);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un signalement' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.signalService.deleteSignal(id);
  }
}