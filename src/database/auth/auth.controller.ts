import {
  Body,
  Controller,
  Post,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
  RoleDto,
} from './dto/create-auth.dto';
import { Roles } from './roles/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { RoleGuard } from './roles/role.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller({ path: 'auth', version: '1' })
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  signIn(
    @Body() authCredentialsDto: LoginDto,
  ): Promise<{ accessToken: string; user: any }> {
    return this.authService.login(authCredentialsDto);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req:any): Promise<{ message: string }> {
    const id = req.user.id
    return this.authService.logout(id);
  }

  @Patch('/change-role/:userId')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  changeRole(
    @Param('userId') userId: string,
    @Body() role: RoleDto,
  ): Promise<any> {
    return this.authService.changeRole(userId, role);
  }

  @Post('/change-password')
  resetPassword(@Body() dto: ChangePasswordDto): Promise<void> {
    const { email, newPassword } = dto;
    return this.authService.changePassword(email, newPassword);
  }

  @Post('/request/reset/password')
  request_reset(@Body() dto: RequestResetPasswordDto): Promise<void> {
    const { email } = dto;
    return this.authService.requestResetPassword(email);
  }

  @Post('/user/reset/password')
  reset(@Body() dto: ResetPasswordDto): Promise<void> {
    const { email, resetCode, newPassword } = dto;
    return this.authService.resetPassword(email, resetCode, newPassword);
  }
}
