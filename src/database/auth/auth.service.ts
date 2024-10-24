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
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private blacklistedTokens: Set<string> = new Set();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,

  ) {}
  addToBlacklist(id: string) {
    this.blacklistedTokens.add(id);
  }

  isTokenBlacklisted(id: string): boolean {
    return this.blacklistedTokens.has(id);
  }
  async removeToBlackList(id: string) {
     this.blacklistedTokens.delete(id);
  }

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
      await this.removeToBlackList(user.id);
      const payload: any = { id: user.id };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken, user };
    } else {
      throw new UnauthorizedException(
        'Please check your login credentials or signup.',
      );
    }
  }
   async logout(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token is required for logout');
    }
    this.addToBlacklist(token);
    return { message: 'Logout successful' };
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

    // Send reset code email
    await this.mailService.sendResetCodeEmail({
      email: user.email,
      name: user.firstName,
      resetCode: resetCode,
    });

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
