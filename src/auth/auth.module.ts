import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

const authProviders = [
  AuthService,
  JwtStrategy,
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_SECRET ? [GoogleStrategy] : []),
  ...(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_SECRET ? [FacebookStrategy] : []),
];

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '15m' },
    }),
    TypeOrmModule.forFeature([User])
  ],
  controllers: [AuthController],
  providers: authProviders,
})
export class AuthModule {}