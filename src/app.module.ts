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
import { Employee } from './database/employee/entities/employee.entity';
import { Attendance } from './database/attendance/entities/attendance.entity';
import { BullModule } from '@nestjs/bull';
import { MailService } from './database/mail/mail.service';
import { ReportService } from './database/report/report.service';
import { ReportController } from './database/report/report.controller';
import { AttendanceNotificationProcessor } from './database/helper/processors/attendance.processor';
import { OpenAIService } from './database/open-ai/open-ai.service';
import * as Joi from 'joi';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '24h',
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        // Server config
        PORT: Joi.number().default(5000),

        // Database config
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),

        // JWT config
        JWT_SECRET: Joi.string().required(),

        // Mail config
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().required(),
        MAIL_USER: Joi.string().required().email(),
        MAIL_PASSWORD: Joi.string().required(),

        // Redis config
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().port().default(6379),

        //OpenAI, TODO: add anything as value in env if you don't have one
        OPENAI_API_KEY: Joi.string().required(),
      }),
      validationOptions: {
        abortEarly: false, // shows all errors at once instead of stopping at first error
        allowUnknown: true, // allows other env variables that aren't validated
      },
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([User, Employee, Attendance]),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
    BullModule.registerQueue({
      name: 'attendanceNotifications',
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    EmployeeController,
    AttendanceController,
    StatsController,
    ReportController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PaginationHelper,
    AttendanceService,
    UsersService,
    StatsService,
    EmployeeService,
    MailService,
    ReportService,
    AttendanceNotificationProcessor,
    OpenAIService,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AppModule {}
