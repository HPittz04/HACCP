import path from 'path';
import puppeteer from 'puppeteer';
import { env } from '../config/env';

export async function renderPdfFromHtml(html: string) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: env.pdfChromeExecutable || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const buffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return buffer;
}

export async function renderEjsToPdf(viewPath: string, data: Record<string, any>) {
  const ejs = await import('ejs');
  const absolute = path.resolve(viewPath);
  const html = await ejs.renderFile(absolute, data, { async: true });
  return renderPdfFromHtml(html);
}
