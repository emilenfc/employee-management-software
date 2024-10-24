import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailService } from '../../mail/mail.service';

@Processor('attendanceNotifications')
export class AttendanceNotificationProcessor {
  constructor(private readonly mailService: MailService) {}

  @Process('attendanceNotification')
  async handleAttendanceNotification(job: Job) {
    await this.mailService.sendAttendanceNotification(job.data);
  }
}
