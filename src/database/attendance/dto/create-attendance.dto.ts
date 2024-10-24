import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ description: 'Employee identifier code' })
  @IsString()
  @IsNotEmpty()
  employeeIdentifier: string;
}

export class CheckOutDto {
  @ApiProperty({ description: 'Employee identifier code' })
  @IsString()
  @IsNotEmpty()
  employeeIdentifier: string;
}
