import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/roles/role.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller({ path: 'employee', version: '1' })
@ApiTags('Employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @ApiQuery({ required: false, name: 'active', type: Boolean })
  @ApiQuery({
    required: false,
    name: 'search',
    description:
      'Search using first name, last name, email,employee identifier, phone number',
  })
  @ApiQuery({ required: false, name: 'pageSize', type: Number })
  @ApiQuery({ required: false, name: 'pageNumber', type: Number })
  findAll(
    @Query('active') active?: boolean,
    @Query('search') search?: string,
    @Query('pageSize') pageSize?: number,
    @Query('pageNumber') pageNumber?: number,
  ) {
    return this.employeeService.findAll(pageSize, pageNumber, active, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @ApiOperation({ summary: 'Activate or deactivate an employee' })
  remove(@Param('id') id: string) {
    return this.employeeService.activateordiactivateEmployee(id);
  }
}
