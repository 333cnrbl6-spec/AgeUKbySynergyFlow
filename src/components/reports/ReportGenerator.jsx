import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Eye, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import ReportPreview from './ReportPreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ReportGenerator() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateStakeholderReport', {
        month: selectedMonth,
        year: selectedYear
      });

      if (result.data.success) {
        setReportData(result.data);
        setShowPreview(true);
        toast.success('Report generated successfully!');
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      toast.error('Error generating report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = document.getElementById('report-preview');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      const filename = `Age-UK-Bury-Report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`;
      pdf.save(filename);
      toast.success('Report exported as PDF');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Stakeholder Reports</h1>
        <p className="text-muted-foreground mt-1">AI-powered monthly analysis of service delivery, feedback trends, and volunteer performance</p>
      </div>

      {/* Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Monthly Report</CardTitle>
          <CardDescription>Select a month and year to generate a comprehensive stakeholder report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Month</label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Year</label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">AI-Powered Analysis</p>
              <p className="mt-1">The report uses AI to analyze service metrics, client feedback patterns, and volunteer engagement to provide actionable insights for stakeholders.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {reportData && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jobs Completed</p>
                    <p className="text-3xl font-bold mt-1">{reportData.rawMetrics.completedJobs}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                    <p className="text-3xl font-bold mt-1">{reportData.rawMetrics.avgSatisfaction}/5</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Would Recommend</p>
                    <p className="text-3xl font-bold mt-1">{reportData.rawMetrics.recommendationRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold mt-1">£{reportData.rawMetrics.totalRevenue.toFixed(0)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-amber-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Hide Preview' : 'Preview Report'}
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export as PDF
                </>
              )}
            </Button>
          </div>

          {/* Preview */}
          {showPreview && <ReportPreview reportData={reportData} month={months[selectedMonth - 1]} year={selectedYear} />}
        </div>
      )}
    </div>
  );
}