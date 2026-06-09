import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ReportExport } from '@/models';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;

    const body = await request.json();
    const { reportName = 'Exported Report', dataset = [], type = 'CSV' } = body;

    if (!Array.isArray(dataset) || dataset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Dataset must be a non-empty array' },
        { status: 400 }
      );
    }

    const t0 = Date.now();

    // 1. Gather all unique keys from dataset objects to form CSV headers
    const headers = Object.keys(dataset[0]);

    // 2. Generate Excel-Ready CSV strings
    let csvLines = [headers.join(',')];
    dataset.forEach((row: any) => {
      const line = headers.map((header) => {
        const val = row[header];
        if (typeof val === 'string') {
          // Escape quotes inside string columns
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val === undefined || val === null ? '' : String(val);
      });
      csvLines.push(line.join(','));
    });

    const csvContent = csvLines.join('\n');
    const t1 = Date.now();

    // 3. Log a record in our ReportExport schema
    const exportRecord = new ReportExport({
      companyId,
      userId,
      userName,
      format: 'csv',
      url: `/api/protected/analytics/exports/download?id=${t0}`, // Mock download link
      rowSize: dataset.length,
      generationTimeMs: t1 - t0,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // expires in 24 hours
    });

    await exportRecord.save();

    // Return the CSV content directly along with the logged metadata
    return NextResponse.json({
      success: true,
      csv: csvContent,
      filename: `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export_${t0}.csv`,
      meta: exportRecord,
    });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
