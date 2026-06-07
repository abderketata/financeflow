import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type jsPDF from 'jspdf';
import markUrl from '@/assets/flux-financier-mark.svg';
import { PaymentItem } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  getPaymentItemClientPrimary,
  getPaymentItemCurrency,
  getPaymentItemDirectionLabel,
  getPaymentItemEffectiveDate,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
  getPaymentItemTypeLabel,
} from '@/modules/payment-items/utils/paymentItemPresentation';

const APPLICATION_NAME = 'Flux Financier';
const EXPORT_TITLE = 'Liste des chèques / traites';
const SHEET_NAME = 'ChequesTraites';
const FILE_NAME_PREFIX = 'flux-financier-cheques-traites';
const EXPORT_COLUMNS = [
  { key: 'reference', header: 'Référence', width: 20 },
  { key: 'client', header: 'Client', width: 28 },
  { key: 'type', header: 'Type', width: 18 },
  { key: 'direction', header: 'Sens', width: 14 },
  { key: 'amount', header: 'Montant', width: 18 },
  { key: 'referencePayment', header: 'Référence paiement', width: 22 },
  { key: 'effectiveDate', header: 'Échéance / émission', width: 20 },
  { key: 'status', header: 'Statut', width: 16 },
] as const;

const PDF_MARGIN_X = 24;
const PDF_HEADER_BASE_Y = 26;
const PDF_HEADER_MAX_WIDTH = 770;
const PDF_TABLE_TOP_GAP = 10;
const PDF_FOOTER_Y_OFFSET = 16;
const PDF_TOP_CARD_GAP = 14;
const PDF_SUMMARY_CARD_GAP = 12;
const PDF_SUMMARY_CARD_HEIGHT = 52;
const PDF_FILTER_BOX_PADDING = 10;

let pdfLogoDataUrlPromise: Promise<string | null> | null = null;

const STATUS_STYLES: Record<string, { fill: string; font: string }> = {
  'Déposé': { fill: 'FEF3C7', font: 'B45309' },
  'Payé': { fill: 'DCFCE7', font: '166534' },
  'Annulé': { fill: 'E2E8F0', font: '475569' },
  'En retard': { fill: 'FEE2E2', font: 'B91C1C' },
};

interface PaymentItemsExportOptions {
  userLabel: string;
  appliedFilters: string[];
  exportedAt?: Date;
}

interface PreparedExportRow {
  reference: string;
  client: string;
  type: string;
  direction: string;
  amount: string;
  amountValue: number;
  referencePayment: string;
  effectiveDate: string;
  status: string;
}

interface PreparedExportModel {
  rows: PreparedExportRow[];
  exportedAt: Date;
  exportedAtLabel: string;
  userLabel: string;
  filtersLabel: string;
  totalLines: number;
  totalCreditsLabel: string;
  totalDebitsLabel: string;
}

const safeText = (value?: string | null) => value?.trim() || '—';
const normalizePdfText = (value: string) => value.replace(/[\u00A0\u202F\u2007]/g, ' ');

const formatSignedAmount = (item: PaymentItem) => {
  const numericAmount = Number(item.amount ?? 0) || 0;
  const signedAmount = item.direction === 'OUT' ? -numericAmount : numericAmount;
  const prefix = signedAmount >= 0 ? '+' : '-';

  return {
    amountValue: signedAmount,
    label: normalizePdfText(`${prefix}${formatCurrency(Math.abs(signedAmount), getPaymentItemCurrency(item))}`),
  };
};

const sanitizeFileNamePart = (value: string) => value.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

const buildFileName = (extension: 'xlsx' | 'pdf', exportedAt: Date) => {
  const suffix = sanitizeFileNamePart(format(exportedAt, 'yyyy-MM-dd-HHmmss'));
  return `${FILE_NAME_PREFIX}-${suffix}.${extension}`;
};

const downloadBlob = (parts: BlobPart[], fileName: string, mimeType: string) => {
  const blob = new Blob(parts, { type: mimeType });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  return [0, 2, 4].map((offset) => Number.parseInt(safeHex.slice(offset, offset + 2), 16)) as [number, number, number];
};

const loadImageAsDataUrl = (src: string) => new Promise<string | null>((resolve) => {
  const image = new Image();

  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.onload = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      resolve(null);
      return;
    }

    canvas.width = image.naturalWidth || 160;
    canvas.height = image.naturalHeight || 160;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/png'));
  };
  image.onerror = () => resolve(null);
  image.src = src;
});

const getPdfLogoDataUrl = () => {
  if (!pdfLogoDataUrlPromise) {
    pdfLogoDataUrlPromise = loadImageAsDataUrl(markUrl);
  }

  return pdfLogoDataUrlPromise;
};

const prepareExportModel = (items: PaymentItem[], options: PaymentItemsExportOptions): PreparedExportModel => {
  const rows = items.map<PreparedExportRow>((item) => {
    const { label, amountValue } = formatSignedAmount(item);

    return {
      reference: getPaymentItemReference(item),
      client: getPaymentItemClientPrimary(item.client),
      type: getPaymentItemTypeLabel(item),
      direction: getPaymentItemDirectionLabel(item.direction),
      amount: label,
      amountValue,
      referencePayment: safeText(item.referencePayment),
      effectiveDate: formatDate(getPaymentItemEffectiveDate(item)),
      status: String(getPaymentItemStatusLabel(item.status)),
    };
  });

  const totalCredits = items.reduce((sum, item) => sum + (item.direction === 'IN' ? Number(item.amount ?? 0) || 0 : 0), 0);
  const totalDebits = items.reduce((sum, item) => sum + (item.direction === 'OUT' ? Number(item.amount ?? 0) || 0 : 0), 0);
  const exportedAt = options.exportedAt ?? new Date();

  return {
    rows,
    exportedAt,
    exportedAtLabel: format(exportedAt, 'dd/MM/yyyy HH:mm', { locale: fr }),
    userLabel: options.userLabel,
    filtersLabel: options.appliedFilters.length
      ? options.appliedFilters.join(' • ')
      : 'Aucun filtre appliqué • Portée : liste complète filtrée',
    totalLines: rows.length,
    totalCreditsLabel: formatCurrency(totalCredits),
    totalDebitsLabel: formatCurrency(totalDebits),
  };
};

const getStatusStyle = (status: string) => STATUS_STYLES[status] ?? { fill: 'E2E8F0', font: '334155' };

export const exportPaymentItemsToExcel = async (items: PaymentItem[], options: PaymentItemsExportOptions) => {
  const model = prepareExportModel(items, options);
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ state: 'frozen', ySplit: 7 }],
  });

  workbook.creator = APPLICATION_NAME;
  workbook.company = APPLICATION_NAME;
  workbook.created = model.exportedAt;
  workbook.modified = model.exportedAt;

  worksheet.columns = EXPORT_COLUMNS.map((column) => ({ key: column.key, width: column.width }));
  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.35,
      right: 0.35,
      top: 0.45,
      bottom: 0.45,
      header: 0.2,
      footer: 0.2,
    },
  };
  worksheet.properties.defaultRowHeight = 20;

  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = APPLICATION_NAME;
  worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D4ED8' } };

  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = EXPORT_TITLE;
  worksheet.getCell('A2').font = { size: 14, bold: true, color: { argb: '0F172A' } };
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:D3');
  worksheet.getCell('A3').value = `Date d’édition : ${model.exportedAtLabel}`;
  worksheet.getCell('A3').font = { size: 11, color: { argb: '334155' } };

  worksheet.mergeCells('E3:H3');
  worksheet.getCell('E3').value = `Utilisateur : ${model.userLabel}`;
  worksheet.getCell('E3').font = { size: 11, color: { argb: '334155' } };

  worksheet.mergeCells('A4:D4');
  worksheet.getCell('A4').value = `Total lignes : ${model.totalLines}`;
  worksheet.getCell('A4').font = { bold: true, color: { argb: '0F172A' } };

  worksheet.mergeCells('E4:F4');
  worksheet.getCell('E4').value = `Total crédits : ${model.totalCreditsLabel}`;
  worksheet.getCell('E4').font = { bold: true, color: { argb: '166534' } };

  worksheet.mergeCells('G4:H4');
  worksheet.getCell('G4').value = `Total débits : ${model.totalDebitsLabel}`;
  worksheet.getCell('G4').font = { bold: true, color: { argb: 'B91C1C' } };

  worksheet.mergeCells('A5:H6');
  worksheet.getCell('A5').value = `Filtres appliqués : ${model.filtersLabel}`;
  worksheet.getCell('A5').alignment = { wrapText: true, vertical: 'top' };
  worksheet.getCell('A5').font = { size: 10, color: { argb: '475569' } };
  worksheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
  worksheet.getCell('A5').border = {
    top: { style: 'thin', color: { argb: 'E2E8F0' } },
    right: { style: 'thin', color: { argb: 'E2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
    left: { style: 'thin', color: { argb: 'E2E8F0' } },
  };

  const headerRowIndex = 7;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.values = EXPORT_COLUMNS.map((column) => column.header);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'DBEAFE' } },
      right: { style: 'thin', color: { argb: 'DBEAFE' } },
      bottom: { style: 'thin', color: { argb: 'DBEAFE' } },
      left: { style: 'thin', color: { argb: 'DBEAFE' } },
    };
  });

  model.rows.forEach((row) => {
    const worksheetRow = worksheet.addRow({
      reference: row.reference,
      client: row.client,
      type: row.type,
      direction: row.direction,
      amount: row.amount,
      referencePayment: row.referencePayment,
      effectiveDate: row.effectiveDate,
      status: row.status,
    });

    worksheetRow.height = 22;
    worksheetRow.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 5 ? 'right' : 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: worksheetRow.number % 2 === 0 ? 'FFFFFF' : 'F8FAFC' },
      };
      cell.font = { color: { argb: '0F172A' } };
    });

    const amountCell = worksheetRow.getCell(5);
    amountCell.font = {
      bold: true,
      color: { argb: row.amountValue >= 0 ? '166534' : 'B91C1C' },
    };

    const statusCell = worksheetRow.getCell(8);
    const statusStyle = getStatusStyle(row.status);
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusStyle.fill } };
    statusCell.font = { bold: true, color: { argb: statusStyle.font } };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: EXPORT_COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob([
    buffer,
  ], buildFileName('xlsx', model.exportedAt), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

const getPdfHeaderMetrics = (doc: jsPDF, model: PreparedExportModel) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (PDF_MARGIN_X * 2);
  const brandBoxWidth = Math.min(182, Math.max(164, contentWidth * 0.22));
  const metaBoxWidth = Math.min(228, Math.max(208, contentWidth * 0.28));
  const metaInnerWidth = metaBoxWidth - 24;
  const titleMaxWidth = Math.max(220, contentWidth - brandBoxWidth - metaBoxWidth - (PDF_TOP_CARD_GAP * 2));
  const filtersText = `Filtres appliqués : ${model.filtersLabel}`;
  const dateLines = doc.splitTextToSize(`Date d’édition : ${model.exportedAtLabel}`, metaInnerWidth);
  const userLines = doc.splitTextToSize(`Utilisateur : ${model.userLabel}`, metaInnerWidth);
  const titleLines = doc.splitTextToSize(EXPORT_TITLE, Math.min(titleMaxWidth, PDF_HEADER_MAX_WIDTH));
  const summaryCardWidth = (contentWidth - (PDF_SUMMARY_CARD_GAP * 2)) / 3;
  const metaContentHeight = 24 + ((dateLines.length + userLines.length) * 11);
  const titleHeight = Math.max(22, titleLines.length * 16);
  const topSectionHeight = Math.max(58, metaContentHeight + 10, titleHeight + 22);
  const filterLines = doc.splitTextToSize(filtersText, Math.min(contentWidth - (PDF_FILTER_BOX_PADDING * 2), PDF_HEADER_MAX_WIDTH));
  const filtersHeight = (filterLines.length * 11) + (PDF_FILTER_BOX_PADDING * 2);
  const headerBottom = PDF_HEADER_BASE_Y
    + topSectionHeight
    + 12
    + PDF_SUMMARY_CARD_HEIGHT
    + 12
    + filtersHeight
    + 14;

  return {
    pageWidth,
    contentWidth,
    brandBoxWidth,
    metaBoxWidth,
    topSectionHeight,
    dateLines,
    userLines,
    titleLines,
    titleHeight,
    summaryCardWidth,
    filterLines,
    filtersHeight,
    headerBottom,
  };
};

const drawSummaryCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  options: {
    fillColor: [number, number, number];
    borderColor: [number, number, number];
    valueColor: [number, number, number];
  },
) => {
  doc.setFillColor(...options.fillColor);
  doc.setDrawColor(...options.borderColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, width, PDF_SUMMARY_CARD_HEIGHT, 10, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(label.toUpperCase(), x + 12, y + 16);

  doc.setFontSize(12.5);
  doc.setTextColor(...options.valueColor);
  doc.text(value, x + 12, y + 35);
};

const getPdfTableColumnStyles = (contentWidth: number) => {
  const ratios = [0.125, 0.235, 0.09, 0.075, 0.12, 0.16, 0.1, 0.095] as const;
  const widths = ratios.map((ratio) => Number((contentWidth * ratio).toFixed(2)));
  const consumedWidth = widths.reduce((sum, width) => sum + width, 0);
  widths[widths.length - 1] = Number((widths[widths.length - 1] + (contentWidth - consumedWidth)).toFixed(2));

  return {
    0: { cellWidth: widths[0], overflow: 'ellipsize' as const },
    1: { cellWidth: widths[1], overflow: 'linebreak' as const },
    2: { cellWidth: widths[2], halign: 'center' as const },
    3: { cellWidth: widths[3], halign: 'center' as const },
    4: { cellWidth: widths[4], halign: 'right' as const },
    5: { cellWidth: widths[5], overflow: 'linebreak' as const },
    6: { cellWidth: widths[6], halign: 'center' as const },
    7: { cellWidth: widths[7], halign: 'center' as const },
  };
};

const drawPdfHeader = (doc: jsPDF, model: PreparedExportModel, logoDataUrl: string | null) => {
  const {
    pageWidth,
    contentWidth,
    brandBoxWidth,
    metaBoxWidth,
    topSectionHeight,
    dateLines,
    userLines,
    titleLines,
    titleHeight,
    summaryCardWidth,
    filterLines,
    filtersHeight,
    headerBottom,
  } = getPdfHeaderMetrics(doc, model);
  const titleAreaX = PDF_MARGIN_X + brandBoxWidth + PDF_TOP_CARD_GAP;
  const metaBoxX = pageWidth - PDF_MARGIN_X - metaBoxWidth;
  const titleAreaWidth = Math.max(180, metaBoxX - titleAreaX - PDF_TOP_CARD_GAP);
  const titleCenterX = titleAreaX + (titleAreaWidth / 2);
  let currentY = PDF_HEADER_BASE_Y;

  doc.setFillColor(29, 78, 216);
  doc.setDrawColor(29, 78, 216);
  doc.roundedRect(PDF_MARGIN_X, currentY, brandBoxWidth, topSectionHeight, 12, 12, 'FD');

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', PDF_MARGIN_X + 12, currentY + 12, 32, 32);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(APPLICATION_NAME, PDF_MARGIN_X + 52, currentY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Export PDF', PDF_MARGIN_X + 52, currentY + 40);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(titleLines, titleCenterX, currentY + ((topSectionHeight - titleHeight) / 2) + 13, { align: 'center', maxWidth: titleAreaWidth });

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(metaBoxX, currentY, metaBoxWidth, topSectionHeight, 12, 12, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('INFORMATIONS D’ÉDITION', metaBoxX + 12, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dateLines, metaBoxX + 12, currentY + 31);
  doc.text(userLines, metaBoxX + 12, currentY + 31 + (dateLines.length * 11));

  currentY += topSectionHeight + 12;

  drawSummaryCard(doc, PDF_MARGIN_X, currentY, summaryCardWidth, 'Total lignes', String(model.totalLines), {
    fillColor: [248, 250, 252],
    borderColor: [226, 232, 240],
    valueColor: [15, 23, 42],
  });
  drawSummaryCard(doc, PDF_MARGIN_X + summaryCardWidth + PDF_SUMMARY_CARD_GAP, currentY, summaryCardWidth, 'Total crédits', normalizePdfText(model.totalCreditsLabel), {
    fillColor: [236, 253, 245],
    borderColor: [167, 243, 208],
    valueColor: [22, 101, 52],
  });
  drawSummaryCard(doc, PDF_MARGIN_X + ((summaryCardWidth + PDF_SUMMARY_CARD_GAP) * 2), currentY, summaryCardWidth, 'Total débits', normalizePdfText(model.totalDebitsLabel), {
    fillColor: [254, 242, 242],
    borderColor: [252, 165, 165],
    valueColor: [185, 28, 28],
  });

  currentY += PDF_SUMMARY_CARD_HEIGHT + 12;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(PDF_MARGIN_X, currentY, contentWidth, filtersHeight, 10, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('FILTRES APPLIQUÉS', PDF_MARGIN_X + PDF_FILTER_BOX_PADDING, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(normalizePdfText(filterLines.join('\n')).split('\n'), PDF_MARGIN_X + PDF_FILTER_BOX_PADDING, currentY + 31);

  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(1);
  doc.line(PDF_MARGIN_X, headerBottom, pageWidth - PDF_MARGIN_X, headerBottom);

  return headerBottom;
};

export const exportPaymentItemsToPdf = async (items: PaymentItem[], options: PaymentItemsExportOptions) => {
  const model = prepareExportModel(items, options);
  const [logoDataUrl, { default: JsPdf }, { default: autoTable }] = await Promise.all([
    getPdfLogoDataUrl(),
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new JsPdf({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (PDF_MARGIN_X * 2);

  const headerBottom = drawPdfHeader(doc, model, logoDataUrl);

  autoTable(doc, {
    startY: headerBottom + PDF_TABLE_TOP_GAP,
    tableWidth: contentWidth,
    margin: {
      top: headerBottom + PDF_TABLE_TOP_GAP,
      left: PDF_MARGIN_X,
      right: PDF_MARGIN_X,
      bottom: 28,
    },
    head: [EXPORT_COLUMNS.map((column) => column.header)],
    body: model.rows.map((row) => [
      row.reference,
      row.client,
      row.type,
      row.direction,
      normalizePdfText(row.amount),
      row.referencePayment,
      row.effectiveDate,
      row.status,
    ]),
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 4.5, right: 5.5, bottom: 4.5, left: 5.5 },
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      textColor: [15, 23, 42],
      overflow: 'linebreak',
      valign: 'middle',
      minCellHeight: 22,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: { top: 5, right: 5.5, bottom: 5, left: 5.5 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: getPdfTableColumnStyles(contentWidth),
    didParseCell: (hookData) => {
      if (hookData.section !== 'body') {
        return;
      }

      if (hookData.column.index === 4) {
        const row = model.rows[hookData.row.index];
        hookData.cell.styles.textColor = hexToRgb(row.amountValue >= 0 ? '#166534' : '#B91C1C');
        hookData.cell.styles.fontStyle = 'bold';
      }

      if (hookData.column.index === 7) {
        const row = model.rows[hookData.row.index];
        const statusStyle = getStatusStyle(row.status);
        hookData.cell.styles.fillColor = hexToRgb(`#${statusStyle.fill}`);
        hookData.cell.styles.textColor = hexToRgb(`#${statusStyle.font}`);
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 1) {
        drawPdfHeader(doc, model, logoDataUrl);
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pdfPageWidth = doc.internal.pageSize.getWidth();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(PDF_MARGIN_X, pageHeight - 24, pdfPageWidth - PDF_MARGIN_X, pageHeight - 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${pageNumber} / ${pageCount}`, pdfPageWidth - PDF_MARGIN_X, pageHeight - PDF_FOOTER_Y_OFFSET, { align: 'right' });
  }

  downloadBlob([
    doc.output('blob'),
  ], buildFileName('pdf', model.exportedAt), 'application/pdf');
};

