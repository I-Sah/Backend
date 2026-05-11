import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Like, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { string } from 'joi';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) {}

  async hashData(data: string) {
    const saltOrRounds = 10;
    return await bcrypt.hash(data, saltOrRounds);
  }

  async register(dto: CreateAuthDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    const userExists = await this.userRepository.findOne({ 
    where: { email: dto.email } 
  });

  if (userExists) {
    throw new BadRequestException('Un compte existe déjà avec cette adresse email');
  }

    const hash = await this.hashData(dto.password);
    const newUser = await this.userRepository.save({
      pseudo: dto.pseudo,
      email: dto.email,
      password: hash,
  });
    return this.getTokens(newUser.id, newUser.pseudo, newUser.email, 'user');
}

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Identifiants invalides');

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) throw new BadRequestException('Identifiants invalides');

    return this.getTokens(user.id, user.pseudo, user.email, user.role);
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Accès refusé');
    }

    // On compare le token envoyé avec le hash en base
    const rtMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!rtMatches) {
      throw new UnauthorizedException('Token invalide');
    }

    return this.getTokens(user.id, user.pseudo, user.email, user.role);
  }

  async getTokens(userId: number,pseudo: string, email: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, pseudo, email, role }, 
        { expiresIn: '15m', secret: process.env.JWT_SECRET || 'secret' } 
      ),
      this.jwtService.signAsync(
        { sub: userId, pseudo, email, role }, 
        { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || 'refreshsecret' }
      ),
    ]);
    const hashedRt = await this.hashData(rt);
    await this.userRepository.update(userId, { refreshToken: hashedRt });
    return { access_token: at, refresh_token: rt };
  }

  async resetPassword(dto: ResetPasswordDto) {

    const { email, newPassword, confirmPassword } = dto;

    if (!email || !newPassword) {
      throw new BadRequestException('Email et mot de passe requis');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('La confirmation ne correspond pas');
    }

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('Email introuvable');
    }

    user.password = await this.hashData(newPassword);
    await this.userRepository.save(user);

    return { message: 'Mot de passe modifié avec succès' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('La confirmation est différente');
    }

    user.password = await this.hashData(dto.newPassword);
    await this.userRepository.save(user);

    return { message: 'Modification réussie' };
  }

  async logout(userId: number) {
    if (!userId) {
      throw new UnauthorizedException('User ID manquant');
    }
    await this.userRepository.update({ id: userId }, { refreshToken: null });
    return { message: 'Déconnexion réussie' };
  }


  
    async findExitUser(email: string) {
      const user = await this.userRepository.find({
        where: [
          { email: Like(email) }
        ]
      });
  
  
      return await user.length ? 'true' : 'false';
    }
}