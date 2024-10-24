import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@Controller({ path: 'report', version: '1' })
@ApiTags('Reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
  @Get('attendance')
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date in YYYY-MM-DD format',
    example: '2024-10-24',
  })
  @ApiQuery({
    name: 'format',
    required: true,
    description: 'Report format: pdf or excel',
    enum: ['pdf', 'excel'],
  })
  async generateReport(
    @Query('date') date: string,
    @Query('format') format: 'pdf' | 'excel',
    @Res() res: Response,
  ) {
    try {
      const reportDate = date ? new Date(date) : new Date();
      const report = await this.reportService.generateDailyReport(
        reportDate,
        format,
      );

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=attendance-report.pdf',
        );
      } else {
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=attendance-report.xlsx',
        );
      }

      // Convert ArrayBuffer to Buffer for PDF
      const buffer = format === 'pdf' ? Buffer.from(report) : report;
      return res.send(buffer);
    } catch (error) {
      // Handle errors appropriately
      console.error('Report generation error:', error);
      res.status(500).json({
        message: 'Error generating report',
        error: error.message,
      });
    }
  }
}
