import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { reportAPI } from '../services/api';
import DateFilter from '../components/DateFilter';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [message, setMessage] = useState(null);

  const handleDownload = async (format) => {
    try {
      setDownloading(format);
      setMessage(null);
      const params = { format, period };
      if (period === 'custom') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      const response = await reportAPI.download(params);
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `FoodWaste_${format.toUpperCase()}_Report_${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `${format.toUpperCase()} report successfully generated and downloaded.` });
    } catch (err) {
      console.error('Download error:', err);
      setMessage({ type: 'error', text: `Failed to generate ${format.toUpperCase()} report. Please check server logs.` });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Report Generation &amp; Export</h1>
        <p className="text-xs text-gray-500 mt-1">
          Export full canteen food consumption audit data in CSV format or generate publication-ready PDF analytics reports.
        </p>
      </div>

      {/* Date Filter */}
      <DateFilter
        period={period}
        onPeriodChange={setPeriod}
        startDate={startDate}
        endDate={endDate}
        onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
      />

      {message && (
        <div className={`p-4 rounded-xl text-xs border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Two Main Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Report Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Executive PDF Analytical Report</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Complete formatted academic &amp; managerial audit report built with ReportLab. Includes executive KPI metrics, category &amp; meal breakdown tables, financial loss summaries, and SDG 12/2 alignment recommendations.
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Formatted tables with brand styling
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Top 5 most wasted food items breakdown
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Actionable preparation guidelines &amp; savings
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            {downloading === 'pdf' ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner /> Generating PDF...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF Report
              </>
            )}
          </button>
        </div>

        {/* CSV Data Export Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Raw Data CSV Export</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Export all granular food consumption and waste records for the selected period into a standard comma-separated values (CSV) spreadsheet. Suitable for additional offline analysis in Excel, Python, or R.
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                All 12 tabular columns included
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Includes computed financial loss &amp; waste %
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Instant direct file stream
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            {downloading === 'csv' ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner /> Exporting CSV...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download CSV Dataset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;

