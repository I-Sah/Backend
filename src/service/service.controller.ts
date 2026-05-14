import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../decorator/roles.decorator';
import { RolesGuard } from '../guard/roles.guard';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('Service') // Organise Swagger par catégorie
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Créer un nouveau service avec catégories et logo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        categoryIds: { 
          type: 'array', 
          items: { type: 'number' },
          description: 'Liste des IDs de catégories (ex: [1, 2])' 
        },
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  create(
    @Body() createServiceDto: CreateServiceDto,
    @UploadedFile() logo?: Express.Multer.File // Récupère le fichier ici
  ) {
    return this.serviceService.create(createServiceDto, logo);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les services' })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query('search') search?: string) {
    return this.serviceService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un service par son ID' })
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(+id);
  }

  @Patch(':id')
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data') // Permet aussi de changer le logo en update
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Mettre à jour un service par son ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        categoryIds: { type: 'array', items: { type: 'number' } },
        logo: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @UploadedFile() logo: Express.Multer.File
  ) {
    return this.serviceService.update(+id, updateServiceDto, logo);
  }

  @Delete(':id')
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un service par son ID' })
  remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }
}