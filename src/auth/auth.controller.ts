import { Controller, Post, Body, UseGuards, Get, Req, Patch, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { Public } from '../decorator/public.decorator';
import { RefreshTokenGuard } from '../guard/refresh-token.guart';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un nouveau compte' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Mauvaise requête (ex: mots de passe ne correspondent pas)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBody({
      schema: {
        type: 'object',
        properties: {
          pseudo: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          confirmPassword: { type: 'string' },
          avatar: {
            type: 'string',
            format: 'binary',
          },
        },
      },
  })
  async register(@Body() registerDto: CreateAuthDto,@UploadedFile() avatar: Express.Multer.File){
    return this.authService.register(registerDto,avatar);

  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion classique' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto); 
  }

  @ApiBearerAuth()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Rafraîchir les tokens' })
  @ApiResponse({ status: 200, description: 'Tokens rafraîchis avec succès' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou manquant' })
  async refresh(@Req() req) {
    const userId = req.user.userId;
    const refreshToken = req.user.refreshToken;

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Connexion via Google' })
  @ApiResponse({ status: 200, description: 'Connexion via Google réussie' })
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;

    const tokens = await this.authService.getTokens(
      user.id,
      user.pseudo,
      user.email,
      user.role || 'user',
    );

    //redirection frontend
    return res.redirect(
      `http://localhost:5003/api/docs/login-success?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`
    );
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Route protégée par JWT' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur récupéré avec succès' })
  getProfile(@Req() req) {
    return req.user;
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Mot de passe oublier' })
  async reset(@Body() dto: ResetPasswordDto) {
    console.log('Données reçues dans le controller:', dto);
    return await this.authService.resetPassword(dto);
  }

  @Public()
  @Get('/verification-account')
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé (JWT manquant ou invalide)' })
  @ApiQuery({ name: 'email', required: false, description: 'Recherche par pseudo ou email' })
  async findExitUser(@Query('email') email: string) {
    return this.authService.findExitUser(email);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe (connecté)' })
  async change(@Req() req, @Body() dto: ChangePasswordDto) {
    return await this.authService.changePassword(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Déconnexion' })
  async logout(@Req() req) {
    return await this.authService.logout(req.user.userId);
  }
}