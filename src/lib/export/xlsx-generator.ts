import ExcelJS from "exceljs";
import { getCurrency } from "@/lib/format";

/* ── Types ─────────────────────────────────────────────── */

interface TransactionRow {
  date: string;
  mainCategory: string;
  subCategory: string;
  amount: number;
  label: string;
}

interface LabelSummaryRow {
  label: string;
  total: number;
}

interface ExportOptions {
  year: number;
  month: number;
  conversionRate: number;
  transactions: TransactionRow[];
  labelSummaries: LabelSummaryRow[];
  cardPurchaseTotal: number; // Total credit card purchases for reconciliation
}

/* ── Colors ────────────────────────────────────────────── */

const HEADER_BG = "4472C4";       // Blue header background
const HEADER_FG = "FFFFFF";       // White header text
const AMOUNT_FILL = "E2EFDA";     // Green amount cell fill
const LABEL_FILL = "FFF2CC";      // Yellow label row fill
const BORDER_COLOR = "D9D9D9";    // Light gray borders

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Generator ─────────────────────────────────────────── */

export async function generateXlsx(options: ExportOptions): Promise<Buffer> {
  const { year, month, conversionRate, transactions, labelSummaries, cardPurchaseTotal } = options;
  const monthName = MONTH_NAMES[month - 1];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CardPulse";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`${monthName} ${year}`, {
    properties: { defaultColWidth: 16 },
  });

  // ── Column widths ──────────────────────────────────
  // A: Date, B: Main Category, C: Sub-Category, D: Amount, E: Label, F: spacer, G: label, H: value
  sheet.columns = [
    { key: "date", width: 14 },
    { key: "mainCategory", width: 22 },
    { key: "subCategory", width: 22 },
    { key: "amount", width: 16 },
    { key: "label", width: 24 },
    { key: "spacer", width: 4 },
    { key: "convLabel", width: 20 },
    { key: "convValue", width: 14 },
  ];

  // ── Helper: thin border style ──────────────────────
  const thinBorder: ExcelJS.Border = { style: "thin", color: { argb: BORDER_COLOR } };
  const allBorders: Partial<ExcelJS.Borders> = {
    top: thinBorder,
    left: thinBorder,
    bottom: thinBorder,
    right: thinBorder,
  };

  // ── Title row ──────────────────────────────────────
  const titleRow = sheet.addRow([`Monthly Expense Report — ${monthName} ${year}`]);
  const titleCell = titleRow.getCell(1);
  titleCell.font = { bold: true, size: 14, color: { argb: HEADER_BG } };
  sheet.mergeCells("A1:E1");
  sheet.addRow([]); // Blank row

  // ── Headers (row 3) ────────────────────────────────
  const currency = getCurrency();
  const headerValues = ["Date", "Main Category", "Sub-Category", `Amount (${currency})`, "Label"];
  const headerRow = sheet.addRow(headerValues);
  headerRow.eachCell((cell, colIdx) => {
    if (colIdx <= 5) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: HEADER_BG },
      };
      cell.font = { bold: true, color: { argb: HEADER_FG }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = allBorders;
    }
  });
  headerRow.height = 28;

  // ── Conversion rate cells (G3:H3) ─────────────────
  const convLabelCell = headerRow.getCell(7);
  convLabelCell.value = "Conversion rate =";
  convLabelCell.font = { bold: true, size: 11, color: { argb: HEADER_BG } };
  convLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  const convValueCell = headerRow.getCell(8);
  convValueCell.value = conversionRate;
  convValueCell.font = { bold: true, size: 11 };
  convValueCell.alignment = { horizontal: "center", vertical: "middle" };
  convValueCell.border = allBorders;
  convValueCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: AMOUNT_FILL },
  };

  // ── Category transaction rows ──────────────────────
  // Group by main category for visual separation
  const grouped: Record<string, TransactionRow[]> = {};
  for (const txn of transactions) {
    const key = txn.mainCategory;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(txn);
  }

  // Sort categories alphabetically
  const sortedCategories = Object.keys(grouped).sort();

  let dataRowCount = 0;
  for (const catName of sortedCategories) {
    const catTransactions = grouped[catName];
    // Sort by date within category
    catTransactions.sort((a, b) => a.date.localeCompare(b.date));

    for (const txn of catTransactions) {
      const row = sheet.addRow([
        txn.date,
        txn.mainCategory,
        txn.subCategory,
        txn.amount,
        txn.label,
      ]);
      dataRowCount++;

      // Style cells
      row.eachCell((cell, colIdx) => {
        if (colIdx <= 5) {
          cell.border = allBorders;
          cell.alignment = { vertical: "middle" };
        }
      });

      // Date formatting
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(1).font = { size: 10 };

      // Amount cell — green fill + number format
      const amountCell = row.getCell(4);
      amountCell.numFmt = "#,##0.00";
      amountCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: AMOUNT_FILL },
      };
      amountCell.font = { size: 10 };
      amountCell.alignment = { horizontal: "right", vertical: "middle" };
    }
  }

  // ── Category total row ─────────────────────────────
  if (dataRowCount > 0) {
    sheet.addRow([]); // Blank separator
    const totalRow = sheet.addRow(["", "", "Category Total", 0, ""]);
    const totalAmountCell = totalRow.getCell(4);
    // Sum formula for all transaction amounts: from row 4 to row 3+dataRowCount
    totalAmountCell.value = {
      formula: `SUM(D4:D${3 + dataRowCount})`,
      result: transactions.reduce((s, t) => s + t.amount, 0),
    };
    totalAmountCell.numFmt = "#,##0.00";
    totalAmountCell.font = { bold: true, size: 11 };
    totalAmountCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: AMOUNT_FILL },
    };
    totalAmountCell.border = allBorders;

    totalRow.getCell(3).font = { bold: true, size: 11 };
    totalRow.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
  }

  // ── Blank separator rows ───────────────────────────
  sheet.addRow([]);
  sheet.addRow([]);

  // ── Label summary section ──────────────────────────
  const labelHeaderValues = ["Label", "", "", `Total (${currency})`, ""];
  const labelHeaderRow = sheet.addRow(labelHeaderValues);
  labelHeaderRow.eachCell((cell, colIdx) => {
    if (colIdx <= 5) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: HEADER_BG },
      };
      cell.font = { bold: true, color: { argb: HEADER_FG }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = allBorders;
    }
  });
  labelHeaderRow.height = 28;

  // Merge A:C for label name column
  const labelHeaderRowNum = labelHeaderRow.number;
  sheet.mergeCells(`A${labelHeaderRowNum}:C${labelHeaderRowNum}`);

  // ── Label rows ─────────────────────────────────────
  for (const labelRow of labelSummaries) {
    const row = sheet.addRow([labelRow.label, "", "", labelRow.total, ""]);
    const rowNum = row.number;
    sheet.mergeCells(`A${rowNum}:C${rowNum}`);

    row.eachCell((cell, colIdx) => {
      if (colIdx <= 5) {
        cell.border = allBorders;
        cell.alignment = { vertical: "middle" };
      }
    });

    // Label cell — yellow fill
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: LABEL_FILL },
    };
    row.getCell(1).font = { size: 10 };

    // Amount cell — green fill
    const amtCell = row.getCell(4);
    amtCell.numFmt = "#,##0.00";
    amtCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: AMOUNT_FILL },
    };
    amtCell.font = { size: 10 };
    amtCell.alignment = { horizontal: "right", vertical: "middle" };
  }

  // ── Credit Card Purchase reconciliation row ────────
  if (cardPurchaseTotal > 0) {
    const ccRow = sheet.addRow(["Credit Card Purchase", "", "", cardPurchaseTotal, ""]);
    const ccRowNum = ccRow.number;
    sheet.mergeCells(`A${ccRowNum}:C${ccRowNum}`);

    ccRow.eachCell((cell, colIdx) => {
      if (colIdx <= 5) {
        cell.border = allBorders;
        cell.alignment = { vertical: "middle" };
      }
    });

    ccRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: LABEL_FILL },
    };
    ccRow.getCell(1).font = { bold: true, size: 10 };

    const ccAmtCell = ccRow.getCell(4);
    ccAmtCell.numFmt = "#,##0.00";
    ccAmtCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: AMOUNT_FILL },
    };
    ccAmtCell.font = { bold: true, size: 10 };
    ccAmtCell.alignment = { horizontal: "right", vertical: "middle" };
  }

  // ── Label total row ────────────────────────────────
  if (labelSummaries.length > 0) {
    sheet.addRow([]);
    const labelTotalRow = sheet.addRow(["", "", "Label Total", 0, ""]);
    const labelTotalCell = labelTotalRow.getCell(4);
    labelTotalCell.value = {
      formula: `SUM(D${labelHeaderRowNum + 1}:D${labelHeaderRowNum + labelSummaries.length + (cardPurchaseTotal > 0 ? 1 : 0)})`,
      result: labelSummaries.reduce((s, l) => s + l.total, 0) + (cardPurchaseTotal > 0 ? cardPurchaseTotal : 0),
    };
    labelTotalCell.numFmt = "#,##0.00";
    labelTotalCell.font = { bold: true, size: 11 };
    labelTotalCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: AMOUNT_FILL },
    };
    labelTotalCell.border = allBorders;

    labelTotalRow.getCell(3).font = { bold: true, size: 11 };
    labelTotalRow.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
  }

  // ── Generate buffer ────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
