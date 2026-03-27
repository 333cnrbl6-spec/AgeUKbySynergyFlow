import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { metrics, conversionFunnel, serviceUsageTrends, areaDemandData } = body;

    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Helper function for page break
    const addPageBreak = () => {
      doc.addPage();
      yPosition = 20;
    };

    // Title
    doc.setFontSize(20);
    doc.setTextColor(124, 58, 237); // Primary purple
    doc.text('Analytics Report', margin, yPosition);
    yPosition += 12;

    // Date and header info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin, yPosition);
    yPosition += 8;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Key Metrics Summary', margin, yPosition);
    yPosition += 8;

    // Create metrics table
    const metricsData = [
      ['Metric', 'Value'],
      ['Total Prospects', metrics.totalProspects.toString()],
      ['Converted to Client', metrics.convertedProspects.toString()],
      ['Conversion Rate', `${metrics.conversionRate}%`],
      ['Contacted Prospects', metrics.contactedProspects.toString()],
      ['Interested Prospects', metrics.interestedProspects.toString()],
    ];

    doc.setFontSize(10);
    doc.autoTable({
      startY: yPosition,
      head: metricsData.slice(0, 1),
      body: metricsData.slice(1),
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Check if we need a new page
    if (yPosition > 250) {
      addPageBreak();
    }

    // Conversion Funnel Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Conversion Funnel', margin, yPosition);
    yPosition += 8;

    const funnelData = [
      ['Stage', 'Count', 'Percentage'],
      ...conversionFunnel.map(stage => [
        stage.name,
        stage.value.toString(),
        `${stage.percentage}%`
      ])
    ];

    doc.setFontSize(10);
    doc.autoTable({
      startY: yPosition,
      head: funnelData.slice(0, 1),
      body: funnelData.slice(1),
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Check if we need a new page
    if (yPosition > 250) {
      addPageBreak();
    }

    // Service Usage Trends Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Service Usage Trends (Monthly)', margin, yPosition);
    yPosition += 8;

    const trendsData = [
      ['Month', 'Jobs', 'Activities Booked', 'Referrals'],
      ...serviceUsageTrends.map(trend => [
        trend.month,
        trend.jobs.toString(),
        trend.bookings.toString(),
        trend.referrals.toString()
      ])
    ];

    doc.setFontSize(9);
    doc.autoTable({
      startY: yPosition,
      head: trendsData.slice(0, 1),
      body: trendsData.slice(1),
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Check if we need a new page
    if (yPosition > 250) {
      addPageBreak();
    }

    // Area Demand Section
    if (areaDemandData && areaDemandData.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Area Demand Summary', margin, yPosition);
      yPosition += 8;

      const demandData = [
        ['Area', 'Jobs', 'Isolated', 'Activities', 'Total Demand'],
        ...areaDemandData.map(area => [
          area.town,
          area.jobCount.toString(),
          area.isolatedCount.toString(),
          area.bookingCount.toString(),
          (area.jobCount + area.isolatedCount + area.bookingCount).toString()
        ])
      ];

      doc.setFontSize(9);
      doc.autoTable({
        startY: yPosition,
        head: demandData.slice(0, 1),
        body: demandData.slice(1),
        margin: { left: margin, right: margin },
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
    }

    // Footer on every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | Age UK Bury Analytics Report`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});