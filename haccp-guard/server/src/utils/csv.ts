import { format, Formatter } from '@fast-csv/format';
import { Response } from 'express';

export function streamCsv(res: Response, rows: Record<string, any>[], filename: string) {
  const csvStream: Formatter<any, any> = format({ headers: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  csvStream.pipe(res);
  rows.forEach((row) => csvStream.write(row));
  csvStream.end();
}
