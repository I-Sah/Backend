import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refreshsecret',
      passReqToCallback: true, // Permet de récupérer le token brut
    });
  }

  validate(req: Request, payload: any) {
  const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
  
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token introuvable dans les headers');
  }

  return { ...payload, refreshToken };
}
}