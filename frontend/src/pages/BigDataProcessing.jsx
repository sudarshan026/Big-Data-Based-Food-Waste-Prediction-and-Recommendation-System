import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  FileCheck,
  BarChart3,
  RefreshCw,
  FolderDown,
  ArrowRight
} from 'lucide-react';
import { sparkAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters';

const BigDataProcessing = () => {
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [aggregations, setAggregations] = useState(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatusAndResults = async () => {
    try {
      setLoading(true);
      const [statusRes, resultsRes] = await Promise.all([
        sparkAPI.getStatus(),
        sparkAPI.getResults()
      ]);
      setPipelineStatus(statusRes.data);
      setAggregations(resultsRes.data);
    } catch (err) {
      console.error('Failed to load spark status:', err);
      setError('Could not fetch pipeline execution state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndResults();
  }, []);

  const handleRunPipeline = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await sparkAPI.process();
      setPipelineStatus(res.data);
      // Fetch fresh aggregations
      const resultsRes = await sparkAPI.getResults();
      setAggregations(resultsRes.data);
    } catch (err) {
      console.error('Spark run error:', err);
      setError(err.response?.data?.error || 'Spark pipeline execution encountered an error.');
    } finally {
      setRunning(false);
    }
  };

  if (loading && !pipelineStatus) {
    return <LoadingSpinner message="Checking PySpark Big Data Engine status..." />;
  }

  const isCompleted = pipelineStatus?.status === 'completed';
  const stages = pipelineStatus?.stages || {};
  const summary = pipelineStatus?.summary || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold tracking-wider uppercase">
              BDSMA Microproject
            </span>
            <span className="text-xs text-gray-400 font-mono">PySpark 4.3</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">PySpark Big Data Processing Pipeline</h1>
          <p className="text-xs text-gray-500">
            Distributed data ingestion, cleaning, multi-dimensional feature engineering, and aggregations for 10,000+ canteen records.
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running PySpark Pipeline...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Execute PySpark Pipeline
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Execution Status Banner */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
          }`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">Pipeline Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
              }`}>
                {pipelineStatus?.status?.toUpperCase() || 'NOT EXECUTED'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Engine: {pipelineStatus?.engine || 'Apache PySpark'} &bull; Last run: {pipelineStatus?.processed_at ? new Date(pipelineStatus.processed_at).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>

        {pipelineStatus?.processing_time_seconds !== undefined && (
          <div className="flex items-center gap-2 bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-100 text-xs text-emerald-800 font-semibold">
            <Clock className="w-4 h-4 text-emerald-600" />
            Execution Duration: {pipelineStatus.processing_time_seconds} seconds
          </div>
        )}
      </div>

      {/* 5-STAGE PIPELINE CARDS */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          Distributed Processing Stages
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Stage 1 */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Stage 1</span>
                <CheckCircle2 className={`w-4 h-4 ${stages.ingestion ? 'text-emerald-500' : 'text-gray-300'}`} />
              </div>
              <h3 className="text-xs font-bold text-gray-900 mb-1">Data Ingestion</h3>
              <p className="text-[11px] text-gray-500">SparkSession CSV load &amp; schema inference.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 text-[11px] text-gray-700">
              <span className="text-gray-400 block text-[10px]">Records Loaded</span>
              <span className="font-bold">{stages.ingestion?.records_loaded ? stages.ingestion.records_loaded.toLocaleString() : '—'}</span>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Stage 2</span>
                <CheckCircle2 className={`w-4 h-4 ${stages.cleaning ? 'text-emerald-500' : 'text-gray-300'}`} />
              </div>
              <h3 className="text-xs font-bold text-gray-900 mb-1">Data Cleaning</h3>
              <p className="text-[11px] text-gray-500">dropDuplicates, null imputation, constraints.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 text-[11px] text-gray-700">
              <span className="text-gray-400 block text-[10px]">Duplicates Purged</span>
              <span className="font-bold">{stages.cleaning?.duplicates_removed !== undefined ? stages.cleaning.duplicates_removed : '—'}</span>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Stage 3</span>
                <CheckCircle2 className={`w-4 h-4 ${stages.transformation ? 'text-emerald-500' : 'text-gray-300'}`} />
              </div>
              <h3 className="text-xs font-bold text-gray-900 mb-1">Transformation</h3>
              <p className="text-[11px] text-gray-500">withColumn waste%, loss, date partitioning.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 text-[11px] text-gray-700">
              <span className="text-gray-400 block text-[10px]">Derived Columns</span>
              <span className="font-bold">{stages.transformation?.new_columns_added?.length || 6} features</span>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Stage 4</span>
                <CheckCircle2 className={`w-4 h-4 ${stages.aggregation ? 'text-emerald-500' : 'text-gray-300'}`} />
              </div>
              <h3 className="text-xs font-bold text-gray-900 mb-1">Aggregations</h3>
              <p className="text-[11px] text-gray-500">groupBy, agg, window functions across metrics.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 text-[11px] text-gray-700">
              <span className="text-gray-400 block text-[10px]">Data Marts</span>
              <span className="font-bold">{stages.aggregation?.analyses_performed?.length || 5} aggregated views</span>
            </div>
          </div>

          {/* Stage 5 */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Stage 5</span>
                <CheckCircle2 className={`w-4 h-4 ${stages.output ? 'text-emerald-500' : 'text-gray-300'}`} />
              </div>
              <h3 className="text-xs font-bold text-gray-900 mb-1">Data Export</h3>
              <p className="text-[11px] text-gray-500">Cleaned dataset &amp; analytics export.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 text-[11px] text-gray-700">
              <span className="text-gray-400 block text-[10px]">Status</span>
              <span className="font-bold text-emerald-600">CSV &amp; JSON Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* PIPELINE SUMMARY CARD */}
      {summary.total_records_processed && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Big Data Aggregation Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block text-[10px]">Processed Records</span>
              <span className="text-base font-bold text-gray-900">{summary.total_records_processed?.toLocaleString()}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block text-[10px]">Total Food Prepared</span>
              <span className="text-base font-bold text-blue-700">{formatNumber(summary.total_prepared_kg)} kg</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block text-[10px]">Total Food Wasted</span>
              <span className="text-base font-bold text-red-600">{formatNumber(summary.total_wasted_kg)} kg ({summary.overall_waste_pct}%)</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-400 block text-[10px]">Total Financial Loss</span>
              <span className="text-base font-bold text-emerald-700">{formatCurrency(summary.total_financial_loss)}</span>
            </div>
          </div>
        </div>
      )}

      {/* AGGREGATED SPARK RESULTS TABLES */}
      {aggregations && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Wasted Items View */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800">PySpark Top 10 Most Wasted Items</h3>
              <span className="text-[10px] text-gray-400">groupBy('food_item')</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Wasted (kg)</th>
                    <th className="py-2.5 px-3 text-right">Waste %</th>
                    <th className="py-2.5 px-3 text-right">Loss (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {(aggregations.top_wasted_items || []).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-gray-900">{row.food_item}</td>
                      <td className="py-2 px-3 text-gray-500">{row.food_category}</td>
                      <td className="py-2 px-3 text-right font-medium text-red-600">{formatNumber(row.total_wasted)}</td>
                      <td className="py-2 px-3 text-right">{row.waste_percentage}%</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(row.financial_loss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Aggregations View */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800">PySpark Category Aggregations</h3>
              <span className="text-[10px] text-gray-400">groupBy('food_category')</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Prepared</th>
                    <th className="py-2.5 px-3 text-right">Consumed</th>
                    <th className="py-2.5 px-3 text-right">Wasted</th>
                    <th className="py-2.5 px-3 text-right">Waste %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {(aggregations.category_waste || []).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-gray-900">{row.food_category}</td>
                      <td className="py-2 px-3 text-right">{formatNumber(row.total_prepared)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-medium">{formatNumber(row.total_consumed)}</td>
                      <td className="py-2 px-3 text-right text-red-600 font-medium">{formatNumber(row.total_wasted)}</td>
                      <td className="py-2 px-3 text-right font-semibold">{row.waste_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BigDataProcessing;

