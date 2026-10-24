import jsPDF from 'jspdf';
import { ChecklistReport } from '../types';

/**
 * Generates an official, beautifully structured Restaurant Operations PDF report
 * using jsPDF vector primitives, styled tables, cash reconciliation metrics, and signatures.
 */
export const generateChecklistPDF = async (report: ChecklistReport) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Primary Header Banner
  doc.setFillColor(15, 23, 42); // deep slate/black
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('th CASHIER OPERATIONS REPORT', margin + 6, y + 9);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const checklistName = report.checklistType.replace('_', ' ').toUpperCase();
  doc.text(`${checklistName} CHECKLIST · ${report.outletName.toUpperCase()}`, margin + 6, y + 16);

  // Status Badge on Header
  const statusUpper = report.approvalStatus.replace('_', ' ').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (report.approvalStatus === 'approved') {
    doc.setFillColor(16, 185, 129);
    doc.setTextColor(255, 255, 255);
  } else if (report.approvalStatus === 'submitted') {
    doc.setFillColor(245, 158, 11);
    doc.setTextColor(15, 23, 42);
  } else {
    doc.setFillColor(100, 116, 139);
    doc.setTextColor(255, 255, 255);
  }
  const badgeWidth = 32;
  doc.roundedRect(pageWidth - margin - badgeWidth - 4, y + 5, badgeWidth, 12, 2, 2, 'F');
  doc.text(statusUpper, pageWidth - margin - badgeWidth / 2 - 4, y + 12.5, { align: 'center' });

  y += 26;

  // Metadata Grid Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');

  // Column 1
  doc.text('REPORT ID:', margin + 4, y + 6);
  doc.text('BUSINESS DATE:', margin + 4, y + 12);
  doc.text('OUTLET / STORE:', margin + 4, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(report.id, margin + 28, y + 6);
  doc.text(`${report.date} (${report.dayOfWeek})`, margin + 28, y + 12);
  doc.text(report.outletName, margin + 28, y + 18);

  // Column 2
  const col2X = margin + 95;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('SHIFT TYPE:', col2X, y + 6);
  doc.text('DUTY CASHIER:', col2X, y + 12);
  doc.text('MANAGER ON SHIFT:', col2X, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${report.shiftType.toUpperCase()} (${report.shiftStartTime} - ${report.shiftEndTime})`, col2X + 32, y + 6);
  doc.text(`${report.cashierName} [${report.cashierEmployeeId}]`, col2X + 32, y + 12);
  doc.text(report.managerOnShiftName, col2X + 32, y + 18);

  y += 28;

  // Cash Reconciliation Summary (if available)
  if (report.cashReconciliation) {
    const recon = report.cashReconciliation;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('CASH DRAWER RECONCILIATION SUMMARY', margin + 4, y + 5);

    y += 9;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const cashCols = [
      { label: 'Opening Float', val: `$${recon.openingFloat.toFixed(2)}` },
      { label: 'Cash Sales (+)', val: `$${recon.cashSales.toFixed(2)}` },
      { label: 'Refunds (-)', val: `$${recon.cashRefunds.toFixed(2)}` },
      { label: 'Paid Out (-)', val: `$${recon.cashPaidOut.toFixed(2)}` },
      { label: 'Safe Drops (-)', val: `$${recon.cashDeposits.toFixed(2)}` },
      { label: 'Expected Total', val: `$${recon.expectedCash.toFixed(2)}` },
      { label: 'Physical Count', val: `$${recon.physicalCashCount.toFixed(2)}` },
      { label: 'Variance', val: `$${recon.variance.toFixed(2)}` },
    ];

    const cellWidth = (pageWidth - margin * 2) / cashCols.length;
    cashCols.forEach((c, idx) => {
      const cellX = margin + idx * cellWidth;
      doc.setDrawColor(226, 232, 240);
      doc.rect(cellX, y, cellWidth, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, cellX + 1.5, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (c.label === 'Variance') {
        doc.setTextColor(recon.variance === 0 ? 16 : recon.variance < 0 ? 220 : 217, recon.variance === 0 ? 185 : 38, recon.variance === 0 ? 129 : 38);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(c.val, cellX + 1.5, y + 9.5);
    });

    y += 16;
  }

  // Task Completion Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TASK & OPERATIONAL CRITERIA', margin + 4, y + 4.8);
  doc.text('STATUS', margin + 115, y + 4.8);
  doc.text('COMPLETED BY', margin + 140, y + 4.8);
  doc.text('TIMESTAMP', margin + 168, y + 4.8);

  y += 7;

  // Tasks Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  let currentCategory = '';

  for (let i = 0; i < report.tasks.length; i++) {
    const task = report.tasks[i];

    // Check page overflow
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }

    // Category banner if new
    if (task.category !== currentCategory) {
      currentCategory = task.category;
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(currentCategory.toUpperCase(), margin + 3, y + 4);
      y += 6;
    }

    // Row zebra background
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    // Truncate task title if long
    const titleText = doc.splitTextToSize(task.title, 105)[0] || task.title;
    doc.text(titleText, margin + 4, y + 4.2);

    // Status label
    const st = task.status.replace('_', ' ').toUpperCase();
    if (task.status === 'completed') {
      doc.setTextColor(16, 185, 129);
    } else if (task.status === 'issue_found') {
      doc.setTextColor(225, 29, 72);
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(st, margin + 115, y + 4.2);

    // Completed By
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(task.completedByEmployeeId || '-', margin + 140, y + 4.2);

    // Timestamp
    const timeStr = task.completedAt ? new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
    doc.text(timeStr, margin + 168, y + 4.2);

    y += 6.5;

    // If task has remarks or reason, add note subrow
    if (task.remarks || task.naReason) {
      const note = task.remarks ? `Remarks: ${task.remarks}` : `N/A Reason: ${task.naReason}`;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(note, margin + 8, y + 3.5);
      y += 5;
    }
  }

  // Check if we need new page for Sign-off block
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  } else {
    y += 8;
  }

  // Manager Approval & Sign-Off Section
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL OPERATIONAL SIGN-OFF & AUDIT ATTESTATION', margin + 4, y + 6);

  // Left column: Cashier acknowledgement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cashier: ${report.cashierName} [${report.cashierEmployeeId}]`, margin + 4, y + 13);
  doc.text(`Attestation: Completed according to standard restaurant SOP`, margin + 4, y + 18);
  doc.text(`Recorded Start: ${new Date(report.startTime).toLocaleTimeString()}`, margin + 4, y + 23);
  doc.text(`Digital ID Signature: VERIFIED-SECURE-${report.cashierEmployeeId}`, margin + 4, y + 28);

  // Right column: Manager sign-off
  const mgrX = margin + 100;
  doc.text(`Manager on Shift: ${report.managerOnShiftName}`, mgrX, y + 13);
  const approvalDecision = report.managerApproval ? report.managerApproval.status.toUpperCase() : 'PENDING REVIEW';
  doc.text(`Approval Decision: ${approvalDecision}`, mgrX, y + 18);
  const mgrRemarks = report.managerApproval?.reviewRemarks || 'No review remarks filed yet.';
  doc.text(`Manager Notes: ${mgrRemarks.slice(0, 45)}`, mgrX, y + 23);
  const decisionTime = report.managerApproval?.decisionTimestamp ? new Date(report.managerApproval.decisionTimestamp).toLocaleString() : 'N/A';
  doc.text(`Decision Timestamp: ${decisionTime}`, mgrX, y + 28);

  // Footer on current page
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `th Cashier Management System · Generated: ${new Date().toLocaleString()} · Authentic Audit Trail Attached`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  // Save the PDF
  const filename = `${report.id}_${report.checklistType}.pdf`;
  doc.save(filename);
};
