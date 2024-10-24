import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto } from './dto/create-attendance.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller({path:'attendance', version: '1'})
@ApiTags("Attendances")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('checkin')
  async checkIn(@Body() checkInDto: CheckInDto) {
    return await this.attendanceService.checkIn(checkInDto);
  }
  @Post('checkout')
  async checkOut(@Body() checkOutDto: CheckOutDto) {
    return await this.attendanceService.checkOut(checkOutDto);
  }

  @Get()
  @ApiQuery({ name: "employeeIdentifier", required: false, description: "Employee identifier code" })
  @ApiQuery({ name: "from", required: false, description: "From date in YYYY-MM-DD format",example:"2024-10-20T21:57:07.852Z" })
  @ApiQuery({ name: "to", required: false, description: "To date in YYYY-MM-DD format",example:"2025-10-20T21:57:07.852Z" }) 
  @ApiQuery({ name: "pageSize", required: false, description: "Page size" })
  @ApiQuery({ name: "pageNumber", required: false, description: "Page number" })
  async findEmployeeAttendance(
    @Query('employeeIdentifier') employeeIdentifier?: string,
    @Query('from') from?: string, 
    @Query('to') to?: string,
    @Query('pageSize') pageSize?: number,
    @Query('pageNumber') pageNumber?: number,
  ) {
  

    return await this.attendanceService.findEmployeeAttendance(
      employeeIdentifier,
      from,
      to,
      pageSize,
      pageNumber,
    );
  }
}
