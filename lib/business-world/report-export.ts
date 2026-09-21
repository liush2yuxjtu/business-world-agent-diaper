import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import PptxGenJS from 'pptxgenjs';
import type { SavedReport } from './report-model';
import { reportSections, wrapReportText } from './report-content';

let fontBytes: Promise<Buffer> | undefined;
function loadFont() {
  return fontBytes ??= readFile(join(process.cwd(), 'lib/business-world/fonts/NotoSansSC-Regular.ttf'));
}

export async function exportReportPdf(report: SavedReport) {
  const document = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: {
    Title: report.title, Author: 'eve Business World', Subject: `Saved report ${report.id}; revision ${report.revision}`,
  } });
  const chunks: Buffer[] = [];
  const result = new Promise<Uint8Array>((resolve, reject) => {
    document.on('data', chunk => chunks.push(chunk));
    document.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    document.on('error', reject);
  });
  document.font(await loadFont()).fillColor('#20382E');
  let y = 48;
  const nextPage = () => { document.addPage(); y = 48; };
  function write(text: string, size: number, gap: number) {
    document.fontSize(size);
    for (const line of wrapReportText(text, 499, text => document.widthOfString(text))) {
      if (y > 770) nextPage();
      document.text(line, 48, y, { lineBreak: false });
      y += gap;
    }
  }
  write(report.title, 22, 32);
  y += 12;
  for (const section of reportSections(report)) {
    if (y > 712) nextPage();
    write(section.heading, 15, 26);
    write(section.text, 11, 18);
    y += 18;
  }
  const count = document.bufferedPageRange().count;
  for (let index = 0; index < count; index++) {
    document.switchToPage(index);
    const mode = report.snapshot.data?.meta.dataMode === 'simulated' ? '合成演示' : '经营快照';
    document.fontSize(9).fillColor('#617165').text(`eve Business World · ${mode} · ${index + 1} / ${count}`, 48, 805, { lineBreak: false });
  }
  document.end();
  return result;
}

export async function exportReportPptx(report: SavedReport) {
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_WIDE';
  presentation.author = 'eve Business World';
  presentation.title = report.title;
  presentation.subject = `Saved report ${report.id}; revision ${report.revision}`;
  presentation.theme = { headFontFace: 'Noto Sans SC', bodyFontFace: 'Noto Sans SC' };
  let number = 0;
  for (const section of reportSections(report)) {
    // Conservative full-width allocation also bounds long URLs and unbroken Latin words.
    const lines = wrapReportText(section.text, 44, text => Array.from(text).length);
    for (let start = 0; start < lines.length; start += 12) {
      const slide = presentation.addSlide();
      slide.background = { color: 'F4F2EB' };
      slide.addText(`${section.heading}${start ? '（续）' : ''}`, { x: .65, y: .5, w: 12, h: .6, fontSize: 28, bold: true, color: '20382E', margin: 0 });
      lines.slice(start, start + 12).forEach((line, index) => {
        slide.addText(line || ' ', { x: .7, y: 1.55 + index * .36, w: 11.9, h: .34, fontSize: 16, color: '20382E', margin: 0, breakLine: false, valign: 'middle', lang: 'zh-CN' });
      });
      const mode = report.snapshot.data?.meta.dataMode === 'simulated' ? '合成演示' : '经营快照';
      slide.addText(`eve Business World · ${mode} · ${++number}`, { x: .7, y: 6.85, w: 12, h: .3, fontSize: 10, color: '617165', margin: 0 });
      slide.addNotes(`${report.title}\n报告生成时间：${report.createdAt}\n本页内容来自已保存报告及其独立人工备注。`);
    }
  }
  return new Uint8Array(await presentation.write({ outputType: 'arraybuffer', compression: true }) as ArrayBuffer);
}
