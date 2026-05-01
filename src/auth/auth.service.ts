import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
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
    return this.getTokens(newUser.id, newUser.email, 'user');
}

async login(dto: LoginDto) {
  const user = await this.userRepository.findOne({ where: { email: dto.email } });
  if (!user) throw new BadRequestException('Identifiants invalides');

  const passwordMatches = await bcrypt.compare(dto.password, user.password);
  if (!passwordMatches) throw new BadRequestException('Identifiants invalides');

  return this.getTokens(user.id, user.email, user.role);
}

async getTokens(userId: number, email: string, role: string) {
  const [at, rt] = await Promise.all([
    this.jwtService.signAsync(
      { sub: userId, email, role }, 
      { expiresIn: '15m', secret: process.env.JWT_SECRET || 'secret' } 
    ),
    this.jwtService.signAsync(
      { sub: userId, email, role }, 
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET || 'refreshsecret' }
    ),
  ]);
  return { access_token: at, refresh_token: rt };
}

  async resetPassword(dto: ResetPasswordDto) {
  console.log('DTO reçu par le service:', dto);

  // Si dto est undefined ou vide, c'est un problème de configuration NestJS ou Postman
  if (!dto || !dto.email || !dto.newPassword) {
    throw new BadRequestException('Email et nouveau mot de passe requis');
  }

  const { email, newPassword, confirmPassword } = dto;

  if (newPassword !== confirmPassword) {
    throw new BadRequestException('La confirmation ne correspond pas');
  }

  const user = await this.userRepository.findOne({ where: { email } });
  
  if (!user) {
    throw new BadRequestException('Cet email n’existe pas dans notre base');
  }

  user.password = await this.hashData(newPassword);
  await this.userRepository.save(user);

  return { message: 'Succès' };
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
}