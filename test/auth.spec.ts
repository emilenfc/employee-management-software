import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/database/auth/auth.controller';
import { AuthService } from 'src/database/auth/auth.service';
import { UserRole } from 'src/database/users/entities/user.entity';
import { JwtAuthGuard } from 'src/database/auth/jwt-auth.guard';
import { RoleGuard } from 'src/database/auth/roles/role.guard';

import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from 'src/database/users/entities/user.entity';
import { MailService } from 'src/database/mail/mail.service';


describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let mailService: MailService;

  const mockAuthService = {
    login: jest.fn(),
    logout: jest.fn(),
    changeRole: jest.fn(),
    changePassword: jest.fn(),
    requestResetPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        }
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access token and user', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const expectedResult = {
        accessToken: 'jwt-token',
        user: { id: '1', email: 'test@example.com' },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.signIn(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const req = { user: { id: '1' } };
      const expectedResult = { message: 'Logout successful' };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(req);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.logout).toHaveBeenCalledWith(req.user.id);
    });
  });

  describe('changeRole', () => {
    it('should change user role', async () => {
      const userId = '1';
      const roleDto = { role: UserRole.ADMIN };
      const expectedResult = { 
        message: 'Role changed successfully',
        data: { id: '1', role: UserRole.ADMIN }
      };

      mockAuthService.changeRole.mockResolvedValue(expectedResult);

      const result = await controller.changeRole(userId, roleDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.changeRole).toHaveBeenCalledWith(userId, roleDto);
    });
  });
});
// auth.service.spec.ts

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let mailService: MailService;


  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };
    const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);

    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
    jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user data when credentials are valid', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = { 
        id: '1', 
        email: 'test@example.com',
        password: 'hashedPassword'
      };
      const mockToken = 'jwt-token';

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: mockToken,
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const token = 'valid-token';
      
      const result = await service.logout(token);

      expect(result).toEqual({ message: 'Logout successful' });
      expect(service.isTokenBlacklisted(token)).toBeTruthy();
    });

    it('should throw BadRequestException when token is missing', async () => {
      await expect(service.logout('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', async () => {
      const userId = '1';
      const roleDto = { role: UserRole.ADMIN };
      const mockUser = { 
        id: userId, 
        role: UserRole.USER 
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, role: UserRole.ADMIN });

      const result = await service.changeRole(userId, roleDto);

      expect(result.message).toBe('Role changed successfully');
      expect(result.data.role).toBe(UserRole.ADMIN);
    });

    it('should throw BadRequestException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.changeRole('1', { role: UserRole.ADMIN }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const email = 'test@example.com';
      const resetCode = '123456';
      const newPassword = 'newPassword123';
      const mockUser = { 
        email, 
        resetCode,
        password: 'oldPassword' 
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.resetPassword(email, resetCode, newPassword);

      expect(result.message).toBe('Password reset successfully');
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        password: 'hashedPassword',
        resetCode: null
      }));
    });

    it('should throw BadRequestException when reset code is invalid', async () => {
      const mockUser = { 
        email: 'test@example.com', 
        resetCode: '123456' 
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.resetPassword('test@example.com', 'wrongcode', 'newpass'))
        .rejects.toThrow(BadRequestException);
    });
  });
});