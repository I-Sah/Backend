import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { UserRole } from './entities/user.entity';
import { RolesGuard } from '../guard/roles.guard';
import { Roles } from '../decorator/roles.decorator';
import { Public } from '../decorator/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (protégé par JWT)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard) // Apply JwtAuthGuard first, then RolesGuard
  @Roles(UserRole.ADMIN) 
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pseudo: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'enum', enum: Object.values(UserRole) },
        password: { type: 'string' },
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() createUserDto: CreateUserDto,@UploadedFile() avatar: Express.Multer.File){
    return this.userService.create(createUserDto,avatar);
  }

  


  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER) // Both admins and regular users can view all users (adjust as needed)
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs (protégé par JWT)' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé (JWT manquant ou invalide)' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par pseudo ou email' })
  async findAll(@Query('search') search?: string) {
    return this.userService.findAll(search);
  }


  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs (protégé par JWT)' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }


  @Patch('upade-profile/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Ajouter ou Mettre à jour l\'image de la profil d\'un utilisateur par son ID (protégé par JWT)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Utilisaeur mis à jour'})
  async uploadAvatar(@Req() user, @UploadedFile() file: Express.Multer.File){
    return this.userService.uploadAvatar(user.user.userId, file);
  }



  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can delete users
  @ApiOperation({ summary: 'Supprimer un utilisateur par son ID' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  } 
}
