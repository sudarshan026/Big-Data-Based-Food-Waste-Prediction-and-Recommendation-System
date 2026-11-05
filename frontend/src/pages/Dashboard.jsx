import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  Trash2,
  Percent,
  IndianRupee,
  Apple,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import KPICard from '../components/KPICard';
import DateFilter from '../components/DateFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { dashboardAPI } from '../services/api';
import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters';

const PIE_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#059669', '#10b981', '#34d399', '#6ee7b7'];

const Dashboard = () => {
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { period };
      if (period === 'custom') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }
      if (category) {
        params.category = category;
      }
      const response = await dashboardAPI.getData(params);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard metrics. Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, startDate, endDate, category]);

  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (loading && !data) {
    return <LoadingSpinner message="Loading FoodWaste Analytics Dashboard..." />;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Canteen Waste Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time food preparation, consumption, and sustainability metrics &bull; SDG 12 &bull; SDG 2
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Date Filter Bar */}
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

      {/* 6 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Prepared"
          value={`${formatNumber(kpis.total_prepared)} kg`}
          subtitle="Total canteen food"
          icon={UtensilsCrossed}
          color="border-green-500"
        />
        <KPICard
          title="Total Consumed"
          value={`${formatNumber(kpis.total_consumed)} kg`}
          subtitle="Served & eaten"
          icon={ChefHat}
          color="border-blue-500"
        />
        <KPICard
          title="Total Wasted"
          value={`${formatNumber(kpis.total_wasted)} kg`}
          subtitle="Disposal & surplus"
          icon={Trash2}
          color="border-red-500"
        />
        <KPICard
          title="Waste Percentage"
          value={formatPercent(kpis.waste_percentage)}
          subtitle={kpis.waste_percentage > 20 ? 'Action required' : 'Optimal range'}
          icon={Percent}
          color="border-orange-500"
        />
        <KPICard
          title="Estimated Loss"
          value={formatCurrency(kpis.financial_loss)}
          subtitle="Financial loss value"
          icon={IndianRupee}
          color="border-purple-500"
        />
        <KPICard
          title="Items Monitored"
          value={formatNumber(kpis.food_items_count, 0)}
          subtitle={`${kpis.total_records || 0} total records`}
          icon={Apple}
          color="border-teal-500"
        />
      </div>

      {kpis.total_records === 0 ? (
        <EmptyState
          title="No food waste records found"
          description="There is no historical data recorded for the selected time range. Please select another range or add records."
        />
      ) : (
        <div className="space-y-6">
          {/* Row 1: Prepared vs Consumed vs Wasted & Waste by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800">Food Prepared vs Consumed vs Wasted</h3>
                <p className="text-xs text-gray-400">Comparison across main food categories (kg)</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.prepared_consumed_wasted || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`${formatNumber(val)} kg`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="prepared" name="Prepared" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="consumed" name="Consumed" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wasted" name="Wasted" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800">Waste by Food Category</h3>
                <p className="text-xs text-gray-400">Proportional share of total waste</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.waste_by_category || []}
                      dataKey="wasted"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {(charts.waste_by_category || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, entry) => [`${formatNumber(val)} kg (${entry.payload.percentage || 0}%)`, entry.payload.category]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', maxHeight: '60px', overflowY: 'auto' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Monthly Waste Trend & Meal Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800">Monthly Food Waste Trend</h3>
                <p className="text-xs text-gray-400">Monthly evolution of preparation vs waste (kg)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.monthly_waste_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wasteColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="prepColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`${formatNumber(val)} kg`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                    <Area type="monotone" dataKey="prepared" name="Prepared" stroke="#16a34a" fillOpacity={1} fill="url(#prepColor)" />
                    <Area type="monotone" dataKey="wasted" name="Wasted" stroke="#ef4444" fillOpacity={1} fill="url(#wasteColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800">Waste by Meal Period</h3>
                <p className="text-xs text-gray-400">Total wastage comparison across meals (kg)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.waste_by_meal || []} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="meal_type" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      formatter={(val, name, entry) => [`${formatNumber(val)} kg (${entry.payload.percentage || 0}%)`, 'Wasted']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="wasted" name="Wasted" fill="#15803d" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Top 5 Most Wasted Items & Daily Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800">Top 5 Most Wasted Food Items</h3>
                <p className="text-xs text-gray-400">Ranked by total kilograms wasted</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.top_wasted_items || []} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="food_item" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip
                      formatter={(val) => [`${formatNumber(val)} kg`, 'Wasted']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="total_wasted" name="Total Wasted" fill="#dc2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800">Daily Consumption vs Preparation</h3>
                <p className="text-xs text-gray-400">Timeline of food utilization</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(charts.daily_consumption || []).slice(-30)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`${formatNumber(val)} kg`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                    <Line type="monotone" dataKey="prepared" name="Prepared" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="consumed" name="Consumed" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

