import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaginationHelper } from 'src/database/helper/pagination.service';
import { User } from 'src/database/users/entities/user.entity';
import { UsersService } from 'src/database/users/users.service';
import { CreateUserDto } from 'src/database/users/dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let mockPaginationHelper: { paginate: jest.Mock };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockPaginationHelper = {
      paginate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PaginationHelper,
          useValue: mockPaginationHelper,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

describe('create', () => {
  it('should create a new user', async () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '0789123456',
      password: 'password123',
    };
    
    const user = new User();
    Object.assign(user, createUserDto);
    
    mockUserRepository.findOne!.mockResolvedValue(null);
    mockUserRepository.create!.mockReturnValue(user);
    mockUserRepository.save!.mockResolvedValue(user);

    const result = await service.create(createUserDto);

    expect(result).toEqual(user);
    expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
    expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });

  it('should throw ConflictException if user already exists', async () => {
    const createUserDto: CreateUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '0789123456',
      password: 'password123',
    };
    
    mockUserRepository.findOne!.mockResolvedValue(new User());

    await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
  });

  
});

  describe('findAllUsers', () => {
    it('should return paginated users', async () => {
      const paginatedResult = { items: [], meta: {} };
      mockPaginationHelper.paginate.mockResolvedValue(paginatedResult);

      const result = await service.findAllUsers();

      expect(result).toBe(paginatedResult);
      expect(mockPaginationHelper.paginate).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = new User();
      mockUserRepository.findOne!.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toBe(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const user = new User();
      const updateUserDto = { firstName: 'John' };
      mockUserRepository.findOne!.mockResolvedValue(user);
      mockUserRepository.save!.mockResolvedValue({ ...user, ...updateUserDto });

      const result = await service.update('1', updateUserDto);

      expect(result).toEqual({ ...user, ...updateUserDto });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockUserRepository.save).toHaveBeenCalledWith({ ...user, ...updateUserDto });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should deactivate an active user', async () => {
      const user = new User();
      user.active = true;
      mockUserRepository.findOne!.mockResolvedValue(user);
      mockUserRepository.save!.mockResolvedValue({ ...user, active: false });

      const result = await service.remove('1');

      expect(result).toEqual({
        message: 'User deactivated successfully',
        data: { ...user, active: false },
      });
    });

    it('should activate an inactive user', async () => {
      const user = new User();
      user.active = false;
      mockUserRepository.findOne!.mockResolvedValue(user);
      mockUserRepository.save!.mockResolvedValue({ ...user, active: true });

      const result = await service.remove('1');

      expect(result).toEqual({
        message: 'User restored successfully',
        data: { ...user, active: true },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne!.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});