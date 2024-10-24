import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @ApiProperty({ default: '0783544364' })
  @Matches(/(07[8,9,3,2])[0-9]{7}/, {
    message:
      'Phone number must be MTN or Airtel phone number formatted like 07********',
  })
  phoneNumber: string;
}
