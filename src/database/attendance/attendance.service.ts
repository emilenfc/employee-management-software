import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { CheckInDto, CheckOutDto } from './dto/create-attendance.dto';
import { PaginationHelper } from '../helper/pagination.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly paginationHelper: PaginationHelper) {}

 async checkIn(checkInDto: CheckInDto): Promise<any> {
    const { employeeIdentifier } = checkInDto;

    const employee = await this.findbyEmployeeByIdentifier(employeeIdentifier);

   const existingCheckIn = await this.verifyCheckinTime(employee.id);
    if (existingCheckIn) {
      throw new BadRequestException('You have already checked in today');
    }

    const attendance = Attendance.create({
      checkinTime: new Date(new Date().getTime() + (2 * 60 * 60 * 1000)),
      employee,
    });
    
    const attendanceCreated = await Attendance.save(attendance);
    return {
      message: 'Check-in successful',
      data: {
        'checkin time': attendanceCreated.checkinTime,
        "employee": `${attendanceCreated.employee.firstName} ${attendanceCreated.employee.lastName}`,
      },
    };
}

  async checkOut(checkOutDto: CheckOutDto): Promise<any> {
    const { employeeIdentifier } = checkOutDto;
    const employee = await this.findbyEmployeeByIdentifier(employeeIdentifier);

    let attendance = await this.verifyCheckinTime(employee.id);

    if (!attendance) {
      throw new BadRequestException(
        'You did not checked in today, Please chechin before checking out',
      );
    }
    //check if has attended today
    const hasCheckedOut = attendance.checkoutTime;

    if (hasCheckedOut) {
      throw new ConflictException('You have already checked out today');
    }
    // Proceed with check-out
    attendance.checkoutTime = new Date(new Date().getTime() + (2 * 60 * 60 * 1000));

    attendance.employee = employee;
    const attendanceCreated = await Attendance.save(attendance);

    return {
      message: 'Checkin successfull',
      data: {
        'checkin time': attendanceCreated.checkinTime,
        'checkout time': attendanceCreated.checkoutTime,
        "employee": `${attendanceCreated.employee.firstName} ${attendanceCreated.employee.lastName}`,
      },
    };
  }

  private async findbyEmployeeByIdentifier(employeeIdentifier: string) {
    const employee = await Employee.findOne({ where: { employeeIdentifier } });
    if (!employee) {
      throw new NotFoundException('Invalid identifier, Employee not found');
    }

    if (!employee.active) { 
      throw new BadRequestException('Employee is not active, You are not allowed to check in or out');
    }

    return employee;
  }

  private async verifyCheckinTime(employeeId:string) {
    // Get start and end of today( TODO: I added two hours to mstch timezone)
        const now = new Date();

    const startOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
    ));

     const endOfDay = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23, 59, 59, 999
    ));

    console.log(startOfDay, endOfDay)
      return await Attendance.findOne({
      where: {
        employee: { id: employeeId},
        checkinTime: Between(startOfDay, endOfDay),
        },
        
    });
  }

  async findEmployeeAttendance(
    employeeIdentifier?: string,
    from?: string,
    to?: string,
    pageSize?: number,
    pageNumber?: number,
  ) {
    const filter: any = {};
    if (employeeIdentifier) {
      filter.employee = { employeeIdentifier };
    }
    
    if (from && to) {
      filter.createdAt =Between(from, to);
    } else if (from) {
      filter.createdAt = MoreThanOrEqual(from);
    } else if (to) {
      filter.createdAt =LessThanOrEqual(to);
    }
    console.log(filter)
    return await this.paginationHelper.paginate(
      Attendance,
      pageSize,
      pageNumber,
      {
        where: filter,
        relations: ['employee'],
        select: {
          id: true,
          checkinTime: true,
          checkoutTime: true,
          createdAt: true,
          employee: {
            id: true,
            employeeIdentifier: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber:true,
          },
        },
        order: { createdAt: 'DESC' },
      },
    );
  }
}

