import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from '../../user/entities/user.entity'; // 👈 importer UserRole
import { Repository } from 'typeorm';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5003/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { name, emails } = profile;
    const email = emails[0].value;

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      const newUser = this.userRepository.create({
        email: email,
        pseudo: `${name.givenName}${name.familyName}`,
        password: null,
        role: UserRole.USER, // 👈 enum au lieu de string 'user'
      });

      user = await this.userRepository.save(newUser);
    }

    done(null, user); // ✅ TypeScript est content car user est forcément un User ici
  }
}