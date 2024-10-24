import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Between } from 'typeorm';

@Injectable()
export class ReportService {
  async generateDailyReport(date: Date, format: 'pdf' | 'excel') {
    const startOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const endOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const attendances = await Attendance.find({
      where: {
        checkinTime: Between(startOfDay, endOfDay),
      },
      relations: ['employee'],
    });

    if (format === 'pdf') {
      return await this.generatePDFReport(attendances);
    } else {
      return await this.generateExcelReport(attendances);
    }
  }

  async generateExcelReport(attendances: Attendance[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Check-in Time', key: 'checkinTime', width: 20 },
      { header: 'Check-out Time', key: 'checkoutTime', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
    ];

    attendances.forEach((attendance) => {
      worksheet.addRow({
        employeeId: attendance.employee.employeeIdentifier,
        name: `${attendance.employee.firstName} ${attendance.employee.lastName}`,
        checkinTime: new Date(attendance.checkinTime).toLocaleString(),
        checkoutTime: attendance.checkoutTime
          ? new Date(attendance.checkoutTime).toLocaleString()
          : 'Not checked out',
        date: new Date(attendance.checkinTime).toLocaleDateString(),
      });
    });

    return await workbook.xlsx.writeBuffer();
  }

  async generatePDFReport(attendances: Attendance[]) {
    const doc = new jsPDF();
    let yPos = 30; // initial Y position for better spacing

    // Add main title with larger font
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE REPORT', 105, yPos, { align: 'center' });
    yPos += 20;

    // date with medium font
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Generated on: ${currentDate}`, 105, yPos, { align: 'center' });
    yPos += 20;

    // Set up table headers with improved styling
    doc.setFillColor(240, 240, 240); // Light gray background for header
    doc.setDrawColor(200, 200, 200); // Light gray border
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    const headers = ['Employee ID', 'Name', 'Check-in Time', 'Check-out Time'];
    const colWidths = [30, 50, 50, 50];
    const startX = 20;
    let xPos = startX;

    // Draw header background and borders
    doc.rect(
      startX,
      yPos - 5,
      colWidths.reduce((a, b) => a + b, 0),
      10,
      'FD',
    );

    // Draw headers with improved spacing
    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPos, {
        maxWidth: colWidths[index] - 4,
      });
      xPos += colWidths[index];
    });
    yPos += 15;

    // Draw content with improved styling
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    attendances.forEach((attendance, index) => {
      xPos = startX;

      // Add zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(
          startX,
          yPos - 5,
          colWidths.reduce((a, b) => a + b, 0),
          10,
          'F',
        );
      }

      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 30;

        // Redraw headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        xPos = startX;
        doc.setFillColor(240, 240, 240);
        doc.rect(
          startX,
          yPos - 5,
          colWidths.reduce((a, b) => a + b, 0),
          10,
          'FD',
        );

        headers.forEach((header, index) => {
          doc.text(header, xPos + 2, yPos, {
            maxWidth: colWidths[index] - 4,
          });
          xPos += colWidths[index];
        });

        yPos += 15;
        xPos = startX;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }

      const rowData = [
        attendance.employee.employeeIdentifier,
        `${attendance.employee.firstName} ${attendance.employee.lastName}`,
        new Date(attendance.checkinTime).toLocaleString(),
        attendance.checkoutTime
          ? new Date(attendance.checkoutTime).toLocaleString()
          : 'Not checked out',
      ];

      rowData.forEach((text, index) => {
        doc.text(text.toString(), xPos + 2, yPos, {
          maxWidth: colWidths[index] - 4,
        });
        xPos += colWidths[index];
      });

      yPos += 10;
    });

    // Add footer with improved styling
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Total Records: ${attendances.length}`, 20, 290);

    return doc.output('arraybuffer');
  }
}
