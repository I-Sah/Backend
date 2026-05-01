import { Controller, Post, Body, UseGuards, Get, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un nouveau compte' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Mauvaise requête (ex: mots de passe ne correspondent pas)' })
  async register(@Body() dto: CreateAuthDto) {
    return this.authService.register(dto);

  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion classique' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto); 
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Renouveler l access token' })
  @ApiResponse({ status: 200, description: 'Tokens renouvelés avec succès' })
  async refresh() { /* Logique refresh */ }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Connexion via Google' })
  @ApiResponse({ status: 200, description: 'Connexion via Google réussie' })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    // req.user contient les infos de Google grâce à la stratégie
    return this.authService.getTokens(req.user.id, req.user.email, 'user');
}

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Connexion via Facebook' })
  @ApiResponse({ status: 200, description: 'Connexion via Facebook réussie' })
  async facebookAuth(@Req() req) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiOperation({ summary: 'Route protégée par JWT' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur récupéré avec succès' })
  getProfile(@Req() req) {
    return req.user;
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser via email (oubli)' })
  async reset(@Body() dto: ResetPasswordDto) {
    console.log('Données reçues dans le controller:', dto);
    return await this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe (connecté)' })
  async change(@Req() req, @Body() dto: ChangePasswordDto) {
    return await this.authService.changePassword(req.user.sub, dto);
  }
}