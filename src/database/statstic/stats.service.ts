import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Injectable()
export class StatsService {

  async getTotalCounts() {
    try {
      const [
        totalUsers,
        totalEmployee,
        totalAttendance,
      ] = await Promise.all([
        User.count(),
        Employee.count(),
        Attendance.count(),
      ]);
      return {
        totalUsers,
        totalEmployee,
        totalAttendance,
      };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
