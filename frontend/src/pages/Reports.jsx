import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, 
  FileDown, 
  AlertCircle, 
  ShieldAlert, 
  UserCheck, 
  History, 
  Printer, 
  Download,
  Database
} from 'lucide-react';

const Reports = () => {
  const [loadingReport, setLoadingReport] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const reportTypes = [
    {
      id: 'loans',
      title: 'FPO Loan Applications Report',
      description: 'Comprehensive list of all loan applications, including requested capital, purposes, risk assessments, and approval states.',
      endpoint: '/reports/loans',
      filename: 'fpo_loan_applications_report'
    },
    {
      id: 'repayments',
      title: 'EMI Repayment History Audits',
      description: 'Complete schedules of all loan repayments, tracking paid values, principal reductions, due dates, and default margins.',
      endpoint: '/reports/repayments',
      filename: 'repayment_history_audits_report'
    },
    {
      id: 'farmers',
      title: 'Farmer Financial Summaries',
      description: 'Agrarian stats aggregated by farmer, detailing crops cultivated, land holding scopes, health scores, and net credit margins.',
      endpoint: '/reports/farmers',
      filename: 'farmer_financial_summaries_report'
    },
    {
      id: 'risk-alerts',
      title: 'Active Default Alerts & High-Risk Borrowers',
      description: 'Audit lists identifying overdue EMIs and active loans flagged under HIGH or CRITICAL risk thresholds.',
      endpoint: '/reports/risk-alerts',
      filename: 'active_default_risk_warnings_report'
    }
  ];

  // Helper to convert JSON array to CSV format
  const jsonToCsv = (items) => {
    if (items.length === 0) return '';
    const replacer = (key, value) => (value === null ? '' : value);
    const header = Object.keys(items[0]);
    let csv = items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(',')); // Add header
    return csv.join('\r\n');
  };

  const handleExportExcel = async (report) => {
    setLoadingReport(report.id + '_excel');
    setErrorMsg('');

    try {
      const response = await axios.get(report.endpoint);
      const data = response.data;
      
      if (data.length === 0) {
        setErrorMsg('The report query returned zero rows. Seeding data is required.');
        setLoadingReport('');
        return;
      }

      const csvContent = jsonToCsv(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${report.filename}_${Date.now().toString().slice(-4)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to download spreadsheet report.');
    } finally {
      setLoadingReport('');
    }
  };

  const handleExportPDF = async (report) => {
    setLoadingReport(report.id + '_pdf');
    setErrorMsg('');

    try {
      const response = await axios.get(report.endpoint);
      const data = response.data;

      if (data.length === 0) {
        setErrorMsg('The report query returned zero rows to print.');
        setLoadingReport('');
        return;
      }

      // Open new print window and write clean print stylesheet
      const printWindow = window.open('', '_blank');
      const headers = Object.keys(data[0]);

      let tableHeadersHtml = headers.map(h => `<th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left; text-transform: uppercase; font-size: 10px; color: #475569;">${h.replace(/([A-Z])/g, ' $1')}</th>`).join('');
      let tableRowsHtml = data.map(row => {
        return `<tr>${headers.map(h => `<td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 11px; color: #334155;">${row[h] !== undefined ? row[h] : '-'}</td>`).join('')}</tr>`;
      }).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>AgriLend360 - ${report.title}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; margin: 0; color: #1e293b; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-b: 3px solid #10b981; padding-bottom: 15px; }
              .header h1 { font-size: 24px; color: #069669; margin: 0; }
              .header p { font-size: 11px; color: #64748b; margin: 3px 0 0 0; }
              .title { font-size: 16px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 10px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>AgriLend360</h1>
                <p>Intelligent Loan Repayment & Risk Analytics Platform for FPOs</p>
              </div>
              <div style="text-align: right;">
                <p style="font-weight: bold; color: #334155;">Date: ${new Date().toLocaleDateString()}</p>
                <p>Report System Console</p>
              </div>
            </div>
            <div class="title">${report.title}</div>
            <table>
              <thead>
                <tr>${tableHeadersHtml}</tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
            <div class="footer">
              AgriLend360 &copy; ${new Date().getFullYear()} Farmer Producer Organization FinPlatform. Strictly Confidential.
            </div>
            <script>
              window.onload = function() {
                window.print();
                // window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate PDF document layout.');
    } finally {
      setLoadingReport('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 text-slate-200 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
          <span>FPO Reports & Export Console</span>
        </h2>
        <p className="text-sm text-slate-400">
          Generate, review, and export formatted worksheets and printable summary lists for audits and banking submissions.
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-950/30 border border-red-900 text-red-400 p-3 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md hover:border-slate-750 transition">
            
            {/* Title / Description */}
            <div className="space-y-1.5 max-w-xl">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{report.title}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                {report.description}
              </p>
            </div>

            {/* Export Actions */}
            <div className="flex sm:items-center gap-3.5 flex-shrink-0">
              {/* Excel button */}
              <button
                onClick={() => handleExportExcel(report)}
                disabled={!!loadingReport}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-650 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {loadingReport === report.id + '_excel' ? (
                  <span>Exporting...</span>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Export Excel</span>
                  </>
                )}
              </button>

              {/* PDF button */}
              <button
                onClick={() => handleExportPDF(report)}
                disabled={!!loadingReport}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {loadingReport === report.id + '_pdf' ? (
                  <span>Generating...</span>
                ) : (
                  <>
                    <Printer className="h-3.5 w-3.5" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Audit disclaimer */}
      <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl text-[10px] text-slate-500 leading-normal flex items-start space-x-2">
        <ShieldAlert className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-400 block mb-0.5">Audit Security & File Tracking Protocol</span>
          All report downloads and printing triggers are recorded in the central database audit logs containing active timestamps, user roles, and originating IP handles. Exposing confidential farmer government identifiers or proprietary land registry title records publicly is strictly prohibited.
        </div>
      </div>

    </div>
  );
};

export default Reports;
