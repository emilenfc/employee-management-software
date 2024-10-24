import { Test, TestingModule } from '@nestjs/testing';

import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AttendanceController } from 'src/database/attendance/attendance.controller';
import { AttendanceService } from 'src/database/attendance/attendance.service';
import { Attendance } from 'src/database/attendance/entities/attendance.entity';
import { Employee } from 'src/database/employee/entities/employee.entity';
import { PaginationHelper } from 'src/database/helper/pagination.service';

// Mock the entities
jest.mock('src/database/attendance/entities/attendance.entity');
jest.mock('src/database/employee/entities/employee.entity');

describe('AttendanceService', () => {
  let service: AttendanceService;
  let mockQueue;
  let paginationHelper: PaginationHelper;

  const mockPaginationHelper = {
    paginate: jest.fn(),
  };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getQueueToken('attendanceNotifications'),
          useValue: mockQueue,
        },
        {
          provide: PaginationHelper,
          useValue: mockPaginationHelper,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    paginationHelper = module.get<PaginationHelper>(PaginationHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    const mockEmployee = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      active: true,
    };

    const checkInDto = {
      employeeIdentifier: 'john123456',
    };

    it('should successfully check in an employee', async () => {
      // Mock employee findOne
      (Employee.findOne as jest.Mock).mockResolvedValueOnce(mockEmployee);
      
      // Mock attendance findOne (no existing check-in)
      (Attendance.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock attendance creation
      const mockAttendance = {
        checkinTime: new Date(),
        employee: mockEmployee,
      };
      
      (Attendance.create as jest.Mock).mockReturnValueOnce(mockAttendance);
      (Attendance.save as jest.Mock).mockResolvedValueOnce(mockAttendance);

      const result = await service.checkIn(checkInDto);

      expect(result.message).toBe('Check-in successful');
      expect(mockQueue.add).toHaveBeenCalledWith('attendanceNotification', expect.any(Object));
    });

    it('should throw NotFoundException for invalid employee identifier', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.checkIn(checkInDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive employee', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValueOnce({ ...mockEmployee, active: false });

      await expect(service.checkIn(checkInDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkOut', () => {
    const mockEmployee = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      active: true,
    };

    const checkOutDto = {
      employeeIdentifier: 'john123456',
    };

    it('should successfully check out an employee', async () => {
      // Mock employee findOne
      (Employee.findOne as jest.Mock).mockResolvedValueOnce(mockEmployee);

      // Mock existing check-in
      const mockAttendance = {
        checkinTime: new Date(),
        employee: mockEmployee,
        checkoutTime: null,
      };
      
      (Attendance.findOne as jest.Mock).mockResolvedValueOnce(mockAttendance);
      (Attendance.save as jest.Mock).mockResolvedValueOnce({
        ...mockAttendance,
        checkoutTime: new Date(),
      });

      const result = await service.checkOut(checkOutDto);

      expect(result.message).toBe('Checkin successfull');
      expect(mockQueue.add).toHaveBeenCalledWith('attendanceNotification', expect.any(Object));
    });

    it('should throw BadRequestException if no check-in exists', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValueOnce(mockEmployee);
      (Attendance.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.checkOut(checkOutDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findEmployeeAttendance', () => {
    it('should return paginated attendance records', async () => {
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

      const result = await service.findEmployeeAttendance(
        'john123456',
        '2024-01-01',
        '2024-12-31',
        10,
        1
      );

      expect(result).toEqual(mockPaginatedResult);
      expect(mockPaginationHelper.paginate).toHaveBeenCalled();
    });
  });
});

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  const mockAttendanceService = {
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    findEmployeeAttendance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('checkIn', () => {
    it('should check in an employee', async () => {
      const checkInDto = {
        employeeIdentifier: 'john123456',
      };

      const mockResponse = {
        message: 'Check-in successful',
        data: {
          'checkin time': new Date(),
          employee: 'John Doe',
        },
      };

      mockAttendanceService.checkIn.mockResolvedValueOnce(mockResponse);

      const result = await controller.checkIn(checkInDto);

      expect(result).toEqual(mockResponse);
      expect(mockAttendanceService.checkIn).toHaveBeenCalledWith(checkInDto);
    });
  });

  describe('checkOut', () => {
    it('should check out an employee', async () => {
      const checkOutDto = {
        employeeIdentifier: 'john123456',
      };

      const mockResponse = {
        message: 'Checkin successfull',
        data: {
          'checkin time': new Date(),
          'checkout time': new Date(),
          employee: 'John Doe',
        },
      };

      mockAttendanceService.checkOut.mockResolvedValueOnce(mockResponse);

      const result = await controller.checkOut(checkOutDto);

      expect(result).toEqual(mockResponse);
      expect(mockAttendanceService.checkOut).toHaveBeenCalledWith(checkOutDto);
    });
  });

  describe('findEmployeeAttendance', () => {
    it('should return paginated attendance records', async () => {
      const mockPaginatedResult = {
        data: [],
        meta: {
          total: 0,
          pageSize: 10,
          currentPage: 1,
          totalPages: 0,
        },
      };

      mockAttendanceService.findEmployeeAttendance.mockResolvedValueOnce(mockPaginatedResult);

      const result = await controller.findEmployeeAttendance(
        'john123456',
        '2024-01-01',
        '2024-12-31',
        10,
        1
      );

      expect(result).toEqual(mockPaginatedResult);
      expect(mockAttendanceService.findEmployeeAttendance).toHaveBeenCalledWith(
        'john123456',
        '2024-01-01',
        '2024-12-31',
        10,
        1
      );
    });
  });
});