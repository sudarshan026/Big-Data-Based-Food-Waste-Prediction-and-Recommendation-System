import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Info,
  Search,
  Filter,
  ArrowDownRight,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { recommendationAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatPercent } from '../utils/formatters';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [preparationTable, setPreparationTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [recsRes, prepRes] = await Promise.all([
          recommendationAPI.getAll(),
          recommendationAPI.getPreparation()
        ]);
        setRecommendations(recsRes.data.recommendations || []);
        setPreparationTable(prepRes.data.preparation_table || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendation engine data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Generating Data-Driven Recommendations..." />;
  }

  // Filter smart recommendation cards
  const filteredRecs = recommendations.filter((r) => {
    if (typeFilter === 'all') return true;
    return r.type === typeFilter;
  });

  // Filter preparation table
  const filteredTable = preparationTable.filter((item) => {
    const matchesSearch = item.food_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.food_category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter ? item.food_category === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

  const uniqueCategories = Array.from(new Set(preparationTable.map((i) => i.food_category))).sort();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Smart Recommendation Engine</h1>
        <p className="text-xs text-gray-500 mt-1">
          Rule-based actionable guidance derived from real historical canteen consumption and waste patterns.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* SECTION 1: SMART RECOMMENDATION CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-800">Dynamic Action Insights</h2>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {['all', 'critical', 'warning', 'success', 'info'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecs.map((rec) => {
            const isCritical = rec.type === 'critical';
            const isWarning = rec.type === 'warning';
            const isSuccess = rec.type === 'success';

            const borderClass = isCritical
              ? 'border-l-4 border-l-red-500 border-gray-100'
              : isWarning
              ? 'border-l-4 border-l-amber-500 border-gray-100'
              : isSuccess
              ? 'border-l-4 border-l-emerald-500 border-gray-100'
              : 'border-l-4 border-l-blue-500 border-gray-100';

            const Icon = isCritical
              ? AlertOctagon
              : isWarning
              ? AlertTriangle
              : isSuccess
              ? CheckCircle
              : Info;

            const iconColor = isCritical
              ? 'text-red-500'
              : isWarning
              ? 'text-amber-500'
              : isSuccess
              ? 'text-emerald-500'
              : 'text-blue-500';

            return (
              <div key={rec.id} className={`bg-white rounded-xl p-5 shadow-sm border ${borderClass} space-y-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                    <h3 className="text-sm font-bold text-gray-900">{rec.title}</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {rec.category}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Observation: </span>
                  {rec.issue}
                </p>

                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <p className="text-emerald-900 font-medium">
                    <span className="font-semibold text-gray-700">Recommended Action: </span>
                    {rec.action}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    <span className="font-semibold text-gray-600">Expected Benefit: </span>
                    {rec.expected_benefit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PREPARATION RECOMMENDATION ENGINE TABLE */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Food Preparation Optimization Table</h2>
            <p className="text-xs text-gray-400">
              Optimal preparation target = Historical Demand + 10% Safety Buffer
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search food item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Food Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Avg Prep (kg)</th>
                <th className="py-3 px-4 text-right">Avg Consumed</th>
                <th className="py-3 px-4 text-right">Avg Wasted</th>
                <th className="py-3 px-4 text-right">Waste %</th>
                <th className="py-3 px-4 text-right">Recommended Prep</th>
                <th className="py-3 px-4 text-right">Potential Cut (kg)</th>
                <th className="py-3 px-4 text-center">Action Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredTable.map((row) => (
                <tr key={`${row.food_item}-${row.food_category}`} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-900">{row.food_item}</td>
                  <td className="py-3 px-4 text-gray-500">{row.food_category}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(row.avg_prepared)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatNumber(row.avg_consumed)}</td>
                  <td className="py-3 px-4 text-right text-red-600 font-medium">{formatNumber(row.avg_wasted)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatPercent(row.waste_percentage)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-800 bg-emerald-50/40">
                    {formatNumber(row.recommended_preparation)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-600">
                    {row.potential_waste_reduction > 0 ? `-${formatNumber(row.potential_waste_reduction)}` : '0.0'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      title={row.recommendation_detail}
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        row.action_type === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : row.action_type === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : row.action_type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {row.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;

