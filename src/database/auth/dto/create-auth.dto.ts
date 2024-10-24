import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';

import { UserRole } from 'src/database/users/entities/user.entity';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
export class RoleDto {
  @ApiProperty({ enum: UserRole, default: UserRole.ADMIN })
  @IsEnum(UserRole)
  role: UserRole;
}
export class ChangePasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
  @ApiProperty()
  @MinLength(6)
  newPassword: string;
}

export class RequestResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
  @ApiProperty()
  @MinLength(6)
  newPassword: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  resetCode: string;
}
