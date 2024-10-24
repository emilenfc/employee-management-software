import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PaginationHelper } from './database/helper/pagination.service';
import { User } from './database/users/entities/user.entity';
import { UsersController } from './database/users/users.controller';
import { UsersService } from './database/users/users.service';
import { StatsService } from './database/statstic/stats.service';
import { StatsController } from './database/statstic/stats.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './database/auth/auth.controller';
import { AuthService } from './database/auth/auth.service';
import { JwtStrategy } from './database/auth/jwt.strategy';
import { DatabaseModule } from './database.module';
import { EmployeeController } from './database/employee/employee.controller';
import { EmployeeService } from './database/employee/employee.service';
import { AttendanceController } from './database/attendance/attendance.controller';
import { AttendanceService } from './database/attendance/attendance.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '24h',
      },
    }),
    ConfigModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AuthController,
    UsersController,
    EmployeeController,
    AttendanceController,
    StatsController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PaginationHelper,
    AttendanceService,
    UsersService,
    StatsService,
    EmployeeService,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AppModule {}
