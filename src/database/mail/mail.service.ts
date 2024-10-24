import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OpenAIService } from '../open-ai/open-ai.service';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private openaiService: OpenAIService,
  ) {}

  // TODO:run when the module initializes
  async onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendAttendanceNotification(data: {
    email: string;
    name: string;
    type: 'checkin' | 'checkout';
    time: Date;
  }) {
    try {
      // TODO:Generate AI content
      const emailContent = await this.openaiService.generateEmailContent({
        name: data.name,
        type: data.type,
        time: data.time,
      });

      // Send email
      const result = await this.transporter.sendMail({
        from: '"Employee Service Ltd" <noreply@employee.com>',
        to: data.email,
        subject: emailContent.subject,
        html: emailContent.content,
      });
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendResetCodeEmail(data: {
  email: string;
  name: string;
  resetCode: string;
}) {
  try {
    const subject = 'Password Reset Code';
    const content = `
      <h1>Password Reset</h1>
      <p>Hello ${data.name},</p>
      <p>You have requested to reset your password. Please use the following code to reset your password:</p>
      <h2>${data.resetCode}</h2>
      <p>If you did not request this, please ignore this email.</p>
      <p>Thank you,</p>
      <p>Employee Service Ltd</p>
    `;

    const result = await this.transporter.sendMail({
      from: '"Employee Service Ltd" <noreply@employee.com>',
      to: data.email,
      subject: subject,
      html: content,
    });

    return result;
  } catch (error) {
    console.error('Failed to send reset code email:', error);
    throw new Error(`Failed to send reset code email: ${error.message}`);
  }
}
}
