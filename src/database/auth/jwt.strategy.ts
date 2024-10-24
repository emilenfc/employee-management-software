import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();
import { AuthService } from './auth.service';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tokenService: AuthService,
  ) {
    super({
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any): Promise<any> {
    const { id } = payload;
    // Check if the token is blacklisted means the user has logged out
    if (this.tokenService.isTokenBlacklisted(id)) {
      throw new UnauthorizedException('You has been logged out. Please login again');
    }
    const user: User = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new UnauthorizedException('Login first');
    }

    return user;
  }
}
