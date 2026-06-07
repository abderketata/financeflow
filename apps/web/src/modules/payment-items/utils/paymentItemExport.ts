import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type jsPDF from 'jspdf';
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

const PDF_MARGIN_X = 36;
const PDF_HEADER_BASE_Y = 26;
const PDF_HEADER_MAX_WIDTH = 770;
const PDF_TABLE_TOP_GAP = 10;
const PDF_FOOTER_Y_OFFSET = 16;

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

const formatSignedAmount = (item: PaymentItem) => {
  const numericAmount = Number(item.amount ?? 0) || 0;
  const signedAmount = item.direction === 'OUT' ? -numericAmount : numericAmount;
  const prefix = signedAmount >= 0 ? '+' : '-';

  return {
    amountValue: signedAmount,
    label: `${prefix}${formatCurrency(Math.abs(signedAmount), getPaymentItemCurrency(item))}`,
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
  const filtersText = `Filtres appliqués : ${model.filtersLabel}`;
  const filterLines = doc.splitTextToSize(filtersText, Math.min(pageWidth - (PDF_MARGIN_X * 2), PDF_HEADER_MAX_WIDTH));
  const filtersHeight = filterLines.length * 11;
  const headerBottom = PDF_HEADER_BASE_Y + 78 + filtersHeight;

  return {
    pageWidth,
    filterLines,
    headerBottom,
  };
};

const drawPdfHeader = (doc: jsPDF, model: PreparedExportModel) => {
  const { pageWidth, filterLines, headerBottom } = getPdfHeaderMetrics(doc, model);
  const titleY = PDF_HEADER_BASE_Y + 18;

  doc.setFillColor(29, 78, 216);
  doc.roundedRect(PDF_MARGIN_X, PDF_HEADER_BASE_Y, 170, 28, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(APPLICATION_NAME, PDF_MARGIN_X + 12, PDF_HEADER_BASE_Y + 18);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(17);
  doc.text(EXPORT_TITLE, pageWidth / 2, titleY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date d’édition : ${model.exportedAtLabel}`, PDF_MARGIN_X, PDF_HEADER_BASE_Y + 44);
  doc.text(`Utilisateur : ${model.userLabel}`, pageWidth - PDF_MARGIN_X, PDF_HEADER_BASE_Y + 44, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total lignes : ${model.totalLines}`, PDF_MARGIN_X, PDF_HEADER_BASE_Y + 62);
  doc.setTextColor(22, 101, 52);
  doc.text(`Total crédits : ${model.totalCreditsLabel}`, pageWidth / 2, PDF_HEADER_BASE_Y + 62, { align: 'center' });
  doc.setTextColor(185, 28, 28);
  doc.text(`Total débits : ${model.totalDebitsLabel}`, pageWidth - PDF_MARGIN_X, PDF_HEADER_BASE_Y + 62, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(filterLines, PDF_MARGIN_X, PDF_HEADER_BASE_Y + 82);

  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(1);
  doc.line(PDF_MARGIN_X, headerBottom, pageWidth - PDF_MARGIN_X, headerBottom);

  return headerBottom;
};

export const exportPaymentItemsToPdf = async (items: PaymentItem[], options: PaymentItemsExportOptions) => {
  const model = prepareExportModel(items, options);
  const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new JsPdf({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const headerBottom = drawPdfHeader(doc, model);

  autoTable(doc, {
    startY: headerBottom + PDF_TABLE_TOP_GAP,
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
      row.amount,
      row.referencePayment,
      row.effectiveDate,
      row.status,
    ]),
    styles: {
      fontSize: 8.8,
      cellPadding: 5,
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      textColor: [15, 23, 42],
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 110 },
      2: { cellWidth: 75 },
      3: { cellWidth: 58, halign: 'center' },
      4: { cellWidth: 78, halign: 'right' },
      5: { cellWidth: 95 },
      6: { cellWidth: 84, halign: 'center' },
      7: { cellWidth: 70, halign: 'center' },
    },
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
        drawPdfHeader(doc, model);
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.line(PDF_MARGIN_X, pageHeight - 24, pageWidth - PDF_MARGIN_X, pageHeight - 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${pageNumber} / ${pageCount}`, pageWidth - PDF_MARGIN_X, pageHeight - PDF_FOOTER_Y_OFFSET, { align: 'right' });
  }

  downloadBlob([
    doc.output('blob'),
  ], buildFileName('pdf', model.exportedAt), 'application/pdf');
};

