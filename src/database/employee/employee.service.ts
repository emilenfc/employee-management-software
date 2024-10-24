import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { PaginationHelper } from '../helper/pagination.service';
import { ILike, Not } from 'typeorm';

@Injectable()
export class EmployeeService {
  constructor(private readonly paginationHelper: PaginationHelper) {}
  async create(createEmployeeDto: CreateEmployeeDto) {
    const { email } = createEmployeeDto;
    const employee = await Employee.findOne({ where: { email } });
    if (employee) {
      throw new ConflictException('Employee already exists');
    }
    const newEmployee = new Employee();

    newEmployee.firstName = createEmployeeDto.firstName;
    newEmployee.lastName = createEmployeeDto.lastName;
    newEmployee.email = createEmployeeDto.email;
    newEmployee.phoneNumber = createEmployeeDto.phoneNumber;

    const data = await newEmployee.save();

    return data;
  }

  async findAll(
    pageSize?: number,
    pageNumber?: number,
    active?: boolean,
    search?: string,
  ) {
    const filter = {
      where: [],
      order: {
        createdAt: 'DESC',
      },
    };

    if (active) {
      filter.where.push({ active });
    }
    if (search) {
      filter.where.push([
        { firstName: ILike(`%${search}%`) },
        { lastName: ILike(`%${search}%`) },
        { email: ILike(`%${search}%`) },
        { phoneNumber: ILike(`%${search}%`) },
        { employeeIdentifier: ILike(`%${search}%`) },
      ]);
    }
    console.log(filter);
    return await this.paginationHelper.paginate(
      Employee,
      pageSize,
      pageNumber,
      filter,
    );
  }

  findOne(id: string) {
    return Employee.findOne({ where: { id } });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (updateEmployeeDto.email) {
      const employee = await Employee.findOne({
        where: {
          email: updateEmployeeDto.email,
          id: Not(id),
        },
      });
      if (employee) {
        throw new ConflictException('Employee already exist with this email');
      }
    }
    Object.assign(user, updateEmployeeDto);
    return await user.save();
  }

  async activateordiactivateEmployee(id: string) {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.active = !user.active;
    return await user.save();
  }
}
