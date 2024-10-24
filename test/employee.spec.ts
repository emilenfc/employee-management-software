import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from 'src/database/employee/employee.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeeController } from 'src/database/employee/employee.controller';
import { Employee } from 'src/database/employee/entities/employee.entity';
import { PaginationHelper } from 'src/database/helper/pagination.service';
// Mock the Employee entity
jest.mock('src/database/employee/entities/employee.entity');

describe('EmployeeService', () => {
  let service: EmployeeService;
  let paginationHelper: PaginationHelper;

  const mockPaginationHelper = {
    paginate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: PaginationHelper,
          useValue: mockPaginationHelper,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    paginationHelper = module.get<PaginationHelper>(PaginationHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createEmployeeDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '1234567890',
    };

    it('should create a new employee successfully', async () => {
      const mockSavedEmployee = {
        ...createEmployeeDto,
        id: '1',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (Employee.findOne as jest.Mock).mockResolvedValueOnce(null);
      
      const saveMock = jest.fn().mockResolvedValueOnce(mockSavedEmployee);
      (Employee as any).mockImplementation(() => ({
        save: saveMock,
        ...createEmployeeDto,
      }));

      const result = await service.create(createEmployeeDto);

      expect(result).toEqual(mockSavedEmployee);
      expect(Employee.findOne).toHaveBeenCalledWith({
        where: { email: createEmployeeDto.email },
      });
    });

    it('should throw ConflictException if employee already exists', async () => {
      // Mock findOne to return an existing employee
      (Employee.findOne as jest.Mock).mockResolvedValueOnce({ id: '1' });

      await expect(service.create(createEmployeeDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockPaginatedResult = {
        data: [],
        meta: {
          total: 0,
          pageSize: 10,
          currentPage: 1,
          totalPages: 0,
        },
      };

      mockPaginationHelper.paginate.mockResolvedValueOnce(mockPaginatedResult);

      const result = await service.findAll(10, 1, true, 'search');

      expect(result).toEqual(mockPaginatedResult);
      expect(mockPaginationHelper.paginate).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an employee by id', async () => {
      const mockEmployee = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      };

      (Employee.findOne as jest.Mock).mockResolvedValueOnce(mockEmployee);

      const result = await service.findOne('1');

      expect(result).toEqual(mockEmployee);
      expect(Employee.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('update', () => {
    const updateEmployeeDto = {
      firstName: 'Jane',
      email: 'jane@example.com',
    };

    it('should update an employee successfully', async () => {
      const mockExistingEmployee = {
        id: '1',
        firstName: 'John',
        email: 'john@example.com',
        save: jest.fn(),
      };

      (Employee.findOne as jest.Mock)
        .mockResolvedValueOnce(mockExistingEmployee) // First call for finding target employee
        .mockResolvedValueOnce(null); // Second call for checking email uniqueness

      mockExistingEmployee.save.mockResolvedValueOnce({
        ...mockExistingEmployee,
        ...updateEmployeeDto,
      });

      const result = await service.update('1', updateEmployeeDto);

      expect(result.firstName).toBe(updateEmployeeDto.firstName);
      expect(result.email).toBe(updateEmployeeDto.email);
    });

    it('should throw NotFoundException if employee not found', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.update('1', updateEmployeeDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activateordiactivateEmployee', () => {
    it('should toggle employee active status', async () => {
      const mockEmployee = {
        id: '1',
        active: true,
        save: jest.fn(),
      };

      (Employee.findOne as jest.Mock).mockResolvedValueOnce(mockEmployee);
      mockEmployee.save.mockResolvedValueOnce({ ...mockEmployee, active: false });

      const result = await service.activateordiactivateEmployee('1');

      expect(result.active).toBe(false);
      expect(mockEmployee.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.activateordiactivateEmployee('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  const mockEmployeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    activateordiactivateEmployee: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
  });

  describe('create', () => {
    it('should create an employee', async () => {
      const createEmployeeDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      };

      mockEmployeeService.create.mockResolvedValueOnce(createEmployeeDto);

      const result = await controller.create(createEmployeeDto);

      expect(result).toEqual(createEmployeeDto);
      expect(mockEmployeeService.create).toHaveBeenCalledWith(createEmployeeDto);
    });
  });

  describe('findAll', () => {
    it('should return all employees with pagination', async () => {
      const mockPaginatedResult = {
        data: [],
        meta: {
          total: 0,
          pageSize: 10,
          currentPage: 1,
          totalPages: 0,
        },
      };

      mockEmployeeService.findAll.mockResolvedValueOnce(mockPaginatedResult);

      const result = await controller.findAll(true, 'search', 10, 1);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockEmployeeService.findAll).toHaveBeenCalledWith(
        10,
        1,
        true,
        'search',
      );
    });
  });

  describe('findOne', () => {
    it('should return an employee by id', async () => {
      const mockEmployee = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockEmployeeService.findOne.mockResolvedValueOnce(mockEmployee);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeeService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const updateEmployeeDto = {
        firstName: 'Jane',
      };

      const mockUpdatedEmployee = {
        id: '1',
        ...updateEmployeeDto,
      };

      mockEmployeeService.update.mockResolvedValueOnce(mockUpdatedEmployee);

      const result = await controller.update('1', updateEmployeeDto);

      expect(result).toEqual(mockUpdatedEmployee);
      expect(mockEmployeeService.update).toHaveBeenCalledWith(
        '1',
        updateEmployeeDto,
      );
    });
  });

  describe('remove', () => {
    it('should toggle employee active status', async () => {
      const mockEmployee = {
        id: '1',
        active: false,
      };

      mockEmployeeService.activateordiactivateEmployee.mockResolvedValueOnce(
        mockEmployee,
      );

      const result = await controller.remove('1');

      expect(result).toEqual(mockEmployee);
      expect(
        mockEmployeeService.activateordiactivateEmployee,
      ).toHaveBeenCalledWith('1');
    });
  });
});