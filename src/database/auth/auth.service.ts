import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto, RoleDto } from './dto/create-auth.dto';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(
    authcredentialsDto: LoginDto,
  ): Promise<{ accessToken: string; user: any }> {
    const { email, password } = authcredentialsDto;
    if (!email) {
      throw new BadRequestException('Enter email and password');
    }
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: any = { id: user.id };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken, user };
    } else {
      throw new UnauthorizedException(
        'Please check your login credentials or signup.',
      );
    }
  }

  async changeRole(userId: string, roleDto: RoleDto): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      user.role = roleDto.role;
      const data = await this.userRepository.save(user);
      return {
        message: 'Role changed successfully',
        data,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async changePassword(email: string, newPassword: string): Promise<any> {
    const user = await this.getUser(email);
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return {
      message: 'Password changed successfully',
    };
  }

  async requestResetPassword(email: string): Promise<any> {
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(resetCode);

    const user = await this.getUser(email);

    user.resetCode = resetCode;
    await this.userRepository.save(user);

    // TODO: add send email service

    return {
      message: 'reset code sent to ' + email + ', check your email',
    };
  }

  async resetPassword(
    email: string,
    resetCode: string,
    newPassword: string,
  ): Promise<any> {
    const user = await this.getUser(email);

    if (user.resetCode !== resetCode) {
      throw new BadRequestException('Invalid reset code');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    await this.userRepository.save(user);
    return {
      message: 'Password reset successfully',
    };
  }

  private async getUser(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException(
        'User with this email: ' + email + ' not found',
      );
    }
    return user;
  }
}
