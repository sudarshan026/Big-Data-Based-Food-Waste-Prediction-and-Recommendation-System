import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Layers,
  Clock,
  Calendar,
  IndianRupee,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

import DateFilter from '../components/DateFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { analyticsAPI } from '../services/api';
import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters';

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const FoodWasteAnalytics = () => {
  const [period, setPeriod] = useState('90days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('category');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [wasteOverview, setWasteOverview] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [mealData, setMealData] = useState([]);
  const [trendsData, setTrendsData] = useState({ daily: [], weekly: [], monthly: [] });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { period };
      if (period === 'custom') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      const [wasteRes, catRes, mealRes, trendsRes] = await Promise.all([
        analyticsAPI.getWaste(params),
        analyticsAPI.getCategory(params),
        analyticsAPI.getMeal(params),
        analyticsAPI.getTrends(params)
      ]);

      setWasteOverview(wasteRes.data);
      setCategoryData(catRes.data.categories || []);
      setMealData(mealRes.data.meals || []);
      setTrendsData(trendsRes.data || { daily: [], weekly: [], monthly: [] });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Could not load detailed analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate]);

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (loading && !wasteOverview) {
    return <LoadingSpinner message="Calculating Big Data Food Waste Analytics..." />;
  }

  const tabs = [
    { id: 'category', label: 'Category Analysis', icon: Layers },
    { id: 'meal', label: 'Meal Period Analysis', icon: Clock },
    { id: 'trends', label: 'Time-Based Trends', icon: Calendar },
    { id: 'financial', label: 'Financial Loss Analysis', icon: IndianRupee }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Food Waste Analytics</h1>
        <p className="text-xs text-gray-500 mt-1">
          Detailed multi-dimensional breakdown of preparation, consumption, and financial loss patterns.
        </p>
      </div>

      {/* Date Filter */}
      <DateFilter
        period={period}
        onPeriodChange={setPeriod}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Overview Stat Ribbon */}
      {wasteOverview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500">Overall Waste Rate</span>
            <p className="text-xl font-bold text-gray-800 mt-1">{formatPercent(wasteOverview.waste_percentage)}</p>
            <span className="text-[10px] text-gray-400">Target benchmark: &lt;15%</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500">Average Daily Waste</span>
            <p className="text-xl font-bold text-gray-800 mt-1">{formatNumber(wasteOverview.avg_daily_waste)} kg</p>
            <span className="text-[10px] text-gray-400">Across {wasteOverview.unique_days || 0} active days</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500">Total Financial Loss</span>
            <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(wasteOverview.total_financial_loss)}</p>
            <span className="text-[10px] text-gray-400">Direct ingredient loss</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500">High-Waste Service Days</span>
            <p className="text-xl font-bold text-red-600 mt-1">{wasteOverview.days_with_high_waste}</p>
            <span className="text-[10px] text-gray-400">Days with &gt;20% wastage</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATEGORY ANALYSIS */}
      {activeTab === 'category' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-1">Wasted vs Consumed by Category</h3>
              <p className="text-xs text-gray-400 mb-4">Volume comparison in kilograms</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`${formatNumber(val)} kg`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="consumed" name="Consumed (kg)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wasted" name="Wasted (kg)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-1">Waste Percentage by Category</h3>
              <p className="text-xs text-gray-400 mb-4">Ratio of waste to preparation</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={75} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Waste Rate']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="waste_percentage" name="Waste %" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Category Waste Breakdown Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Prepared (kg)</th>
                    <th className="py-3 px-4 text-right">Consumed (kg)</th>
                    <th className="py-3 px-4 text-right">Wasted (kg)</th>
                    <th className="py-3 px-4 text-right">Waste %</th>
                    <th className="py-3 px-4 text-right">Financial Loss (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {categoryData.map((cat) => (
                    <tr key={cat.category} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{cat.category}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(cat.prepared)}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(cat.consumed)}</td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">{formatNumber(cat.wasted)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatPercent(cat.waste_percentage)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(cat.financial_loss)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          cat.waste_percentage > 22
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : cat.waste_percentage > 16
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {cat.waste_percentage > 22 ? 'High Waste' : cat.waste_percentage > 16 ? 'Moderate' : 'Optimal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEAL ANALYSIS */}
      {activeTab === 'meal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-1">Waste Generated by Meal Type</h3>
              <p className="text-xs text-gray-400 mb-4">Total food wasted per meal service period</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="meal_type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`${formatNumber(val)} kg`, 'Wasted']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="wasted" name="Wasted (kg)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-1">Meal Waste Distribution</h3>
              <p className="text-xs text-gray-400 mb-4">Proportion of total wasted volume</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mealData}
                      dataKey="wasted"
                      nameKey="meal_type"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {mealData.map((entry, idx) => (
                        <Cell key={`meal-cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, entry) => [`${formatNumber(val)} kg`, entry.payload.meal_type]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Meal Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Meal Service Comparative Statistics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Meal Period</th>
                    <th className="py-3 px-4 text-right">Prepared (kg)</th>
                    <th className="py-3 px-4 text-right">Consumed (kg)</th>
                    <th className="py-3 px-4 text-right">Wasted (kg)</th>
                    <th className="py-3 px-4 text-right">Waste %</th>
                    <th className="py-3 px-4 text-right">Avg. Students</th>
                    <th className="py-3 px-4 text-right">Est. Loss (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {mealData.map((m) => (
                    <tr key={m.meal_type} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{m.meal_type}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(m.prepared)}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(m.consumed)}</td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">{formatNumber(m.wasted)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatPercent(m.waste_percentage)}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(m.students, 0)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(m.financial_loss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRENDS */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Day-of-the-Week Wastage Pattern</h3>
            <p className="text-xs text-gray-400 mb-4">Average prepared vs wasted across Monday - Sunday (kg)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsData.weekly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day_of_week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`${formatNumber(val)} kg`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="prepared" name="Avg Prepared" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wasted" name="Avg Wasted" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Monthly Historical Waste Progression</h3>
            <p className="text-xs text-gray-400 mb-4">Tracking monthly total preparation vs waste rate</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.monthly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [`${formatNumber(val)} kg`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="prepared" name="Prepared" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="wasted" name="Wasted" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL LOSS */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Financial Loss by Food Category</h3>
            <p className="text-xs text-gray-400 mb-4">Total estimated monetary value lost to waste (₹)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Financial Loss']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="financial_loss" name="Loss (₹)" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodWasteAnalytics;

