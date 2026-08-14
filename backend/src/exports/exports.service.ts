import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { ExportQueryDto } from './dto/export-query.dto';

interface ExportRow {
  date: Date;
  account: string;
  category: string;
  type: string;
  amount: string;
  note: string;
}

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async fetchRows(
    userId: string,
    query: ExportQueryDto,
  ): Promise<ExportRow[]> {
    const where = {
      isDeleted: false,
      account: { userId },
      ...(query.accountId ? { accountId: query.accountId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: 'asc' },
    });

    return transactions.map((tx) => ({
      date: tx.date,
      account: tx.account.name,
      category: tx.category?.name ?? '-',
      type: tx.type,
      amount: tx.amount.toString(),
      note: tx.note ?? '',
    }));
  }

  private csvEscape(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async toCsv(userId: string, query: ExportQueryDto): Promise<string> {
    const rows = await this.fetchRows(userId, query);
    const header = [
      'Tanggal',
      'Akun',
      'Kategori',
      'Tipe',
      'Nominal',
      'Catatan',
    ];
    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push(
        [
          row.date.toISOString().slice(0, 10),
          row.account,
          row.category,
          row.type,
          row.amount,
          row.note,
        ]
          .map((v) => this.csvEscape(String(v)))
          .join(','),
      );
    }
    return lines.join('\n');
  }

  async toXlsx(userId: string, query: ExportQueryDto): Promise<Buffer> {
    const rows = await this.fetchRows(userId, query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transaksi');
    sheet.columns = [
      { header: 'Tanggal', key: 'date', width: 14 },
      { header: 'Akun', key: 'account', width: 20 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Tipe', key: 'type', width: 12 },
      { header: 'Nominal', key: 'amount', width: 16 },
      { header: 'Catatan', key: 'note', width: 30 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const row of rows) {
      sheet.addRow({
        date: row.date.toISOString().slice(0, 10),
        account: row.account,
        category: row.category,
        type: row.type,
        amount: Number(row.amount),
        note: row.note,
      });
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async toPdf(userId: string, query: ExportQueryDto): Promise<Buffer> {
    const rows = await this.fetchRows(userId, query);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(16).text('Laporan Transaksi — Fintra', { align: 'left' });
    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor('#555')
      .text(`Dicetak: ${new Date().toISOString()}`);
    doc.moveDown();

    const columns = [
      { label: 'Tanggal', width: 70 },
      { label: 'Akun', width: 90 },
      { label: 'Kategori', width: 90 },
      { label: 'Tipe', width: 60 },
      { label: 'Nominal', width: 90 },
      { label: 'Catatan', width: 100 },
    ];

    const drawHeader = () => {
      doc.fontSize(9).fillColor('#000');
      let x = doc.page.margins.left;
      const y = doc.y;
      for (const col of columns) {
        doc.text(col.label, x, y, { width: col.width, continued: false });
        x += col.width;
      }
      doc.moveDown(0.5);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      doc.moveDown(0.3);
    };

    drawHeader();

    for (const row of rows) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage();
        drawHeader();
      }
      let x = doc.page.margins.left;
      const y = doc.y;
      const values = [
        row.date.toISOString().slice(0, 10),
        row.account,
        row.category,
        row.type,
        row.amount,
        row.note,
      ];
      values.forEach((value, i) => {
        doc.text(value, x, y, { width: columns[i].width });
        x += columns[i].width;
      });
      doc.moveDown(0.4);
    }

    doc.end();
    return done;
  }
}
