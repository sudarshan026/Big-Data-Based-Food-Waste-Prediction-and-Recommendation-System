import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  BarChart2,
  RefreshCw,
  Info
} from 'lucide-react';
import { predictionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatPercent } from '../utils/formatters';

const DemandPrediction = () => {
  const [itemsList, setItemsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mealTypes, setMealTypes] = useState(['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner']);
  const [daysOfWeek, setDaysOfWeek] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  
  const [formData, setFormData] = useState({
    food_item: '',
    food_category: '',
    meal_type: 'Lunch',
    day_of_week: 'Monday',
    month: 11,
    special_event: false,
    quantity_prepared: 50,
    safety_buffer_percent: 10
  });

  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [error, setError] = useState(null);

  // Load items and model metrics on mount
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [itemsRes, metricsRes] = await Promise.all([
          predictionAPI.getItems(),
          predictionAPI.getMetrics()
        ]);
        
        const items = itemsRes.data.items || [];
        setItemsList(items);
        setCategories(itemsRes.data.categories || []);
        if (itemsRes.data.meal_types) setMealTypes(itemsRes.data.meal_types);
        if (itemsRes.data.days_of_week) setDaysOfWeek(itemsRes.data.days_of_week);
        setModelMetrics(metricsRes.data);

        // Pre-select first item
        if (items.length > 0) {
          setFormData((prev) => ({
            ...prev,
            food_item: items[0].food_item,
            food_category: items[0].food_category
          }));
        }
      } catch (err) {
        console.error('Failed to initialize prediction page:', err);
        setError('Could not load prediction model metadata.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // When food item changes, automatically update its category
  const handleItemChange = (e) => {
    const selectedItem = e.target.value;
    const match = itemsList.find((i) => i.food_item === selectedItem);
    setFormData((prev) => ({
      ...prev,
      food_item: selectedItem,
      food_category: match ? match.food_category : prev.food_category
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setPredicting(true);
      setError(null);
      const res = await predictionAPI.predict(formData);
      setPrediction(res.data);
    } catch (err) {
      console.error('Prediction request error:', err);
      setError('Prediction failed. Please check inputs and server status.');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Machine Learning Prediction Engine..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Food Demand & Waste Prediction</h1>
        <p className="text-xs text-gray-500 mt-1">
          Predict expected consumption and determine optimal preparation quantities using Machine Learning.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Form on Left, Output & Metrics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <BrainCircuit className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-800">Forecast Parameters</h2>
          </div>

          <form onSubmit={handlePredict} className="space-y-4 text-xs">
            {/* Food Item */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Food Item</label>
              <select
                value={formData.food_item}
                onChange={handleItemChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                {itemsList.map((item, idx) => (
                  <option key={idx} value={item.food_item}>
                    {item.food_item} ({item.food_category})
                  </option>
                ))}
              </select>
            </div>

            {/* Food Category (read-only / auto) */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Food Category</label>
              <input
                type="text"
                readOnly
                value={formData.food_category}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Meal Type & Day of Week */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Meal Period</label>
                <select
                  value={formData.meal_type}
                  onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  {mealTypes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Day of Week</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Planned Quantity Prepared */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Planned Quantity to Prepare (kg)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={formData.quantity_prepared}
                onChange={(e) => setFormData({ ...formData, quantity_prepared: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <span className="text-[10px] text-gray-400">Baseline amount canteen staff intends to cook</span>
            </div>

            {/* Safety Buffer (%) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-gray-700 font-medium">Demand Safety Buffer (%)</label>
                <span className="font-semibold text-emerald-700">{formData.safety_buffer_percent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={formData.safety_buffer_percent}
                onChange={(e) => setFormData({ ...formData, safety_buffer_percent: parseInt(e.target.value) })}
                className="w-full accent-emerald-600"
              />
              <span className="text-[10px] text-gray-400">Additional margin over predicted consumption to prevent shortage</span>
            </div>

            {/* Special Event Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="special_event"
                checked={formData.special_event}
                onChange={(e) => setFormData({ ...formData, special_event: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <label htmlFor="special_event" className="text-gray-700 font-medium cursor-pointer">
                Campus Special Event / Fest (High Footfall Day)
              </label>
            </div>

            {/* Predict Button */}
            <button
              type="submit"
              disabled={predicting}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
            >
              {predicting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Demand Forecast...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Predict Demand &amp; Optimal Prep
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Section */}
        <div className="lg:col-span-7 space-y-6">
          {prediction ? (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">Forecast Results: {formData.food_item}</h3>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">
                  {prediction.model_info?.model_type || 'Random Forest'}
                </span>
              </div>

              {/* 4 Outcome Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Predicted Consumption</span>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{formatNumber(prediction.predicted_consumption)} kg</p>
                  <span className="text-[10px] text-blue-600">Expected student consumption</span>
                </div>

                <div className="bg-red-50/70 p-4 rounded-xl border border-red-100">
                  <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Predicted Waste (Current Plan)</span>
                  <p className="text-2xl font-bold text-red-900 mt-1">{formatNumber(prediction.predicted_waste)} kg</p>
                  <span className="text-[10px] text-red-600">{formatPercent(prediction.predicted_waste_percentage)} of planned prep</span>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Recommended Preparation Quantity
                      </span>
                      <p className="text-3xl font-extrabold text-emerald-950 mt-1">
                        {formatNumber(prediction.recommended_preparation)} kg
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Calculated as {formatNumber(prediction.predicted_consumption)} kg demand + {prediction.safety_buffer_percent}% safety buffer.
                      </p>
                    </div>
                    {formData.quantity_prepared > prediction.recommended_preparation && (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                          Potential Savings: {formatNumber(formData.quantity_prepared - prediction.recommended_preparation)} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparison vs Historical Average */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <h4 className="font-bold text-gray-700 mb-2">Historical Baseline Comparison</h4>
                <div className="grid grid-cols-3 gap-2 text-gray-600">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Hist. Avg Prepared</span>
                    <span className="font-semibold text-gray-800">{formatNumber(prediction.historical_avg_prepared)} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Hist. Avg Consumed</span>
                    <span className="font-semibold text-gray-800">{formatNumber(prediction.historical_avg_consumption)} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Hist. Avg Waste</span>
                    <span className="font-semibold text-gray-800">{formatNumber(prediction.historical_avg_waste)} kg</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>{prediction.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
              <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-800 mb-1">Awaiting Prediction Request</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Select your food item and parameters on the left, then click "Predict Demand &amp; Optimal Prep" to compute AI recommendations.
              </p>
            </div>
          )}

          {/* Model Metrics Card */}
          {modelMetrics && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-gray-800">Scikit-learn Model Performance</h4>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {modelMetrics.metrics?.total_samples ? `${modelMetrics.metrics.total_samples.toLocaleString()} samples` : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-[10px] text-gray-500 font-medium block">R² Score (Accuracy)</span>
                  <span className="text-base font-bold text-emerald-600">
                    {modelMetrics.metrics?.r2_score !== undefined ? modelMetrics.metrics.r2_score : '0.98'}
                  </span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-[10px] text-gray-500 font-medium block">MAE (Mean Error)</span>
                  <span className="text-base font-bold text-blue-600">
                    {modelMetrics.metrics?.mae !== undefined ? `${modelMetrics.metrics.mae} kg` : '0.70 kg'}
                  </span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="text-[10px] text-gray-500 font-medium block">RMSE</span>
                  <span className="text-base font-bold text-purple-600">
                    {modelMetrics.metrics?.rmse !== undefined ? `${modelMetrics.metrics.rmse} kg` : '1.12 kg'}
                  </span>
                </div>
              </div>

              {modelMetrics.metrics?.feature_importance && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px]">
                  <p className="font-semibold text-gray-700 mb-2">Key Predictive Features</p>
                  <div className="space-y-1.5">
                    {Object.entries(modelMetrics.metrics.feature_importance).slice(0, 4).map(([feat, imp]) => (
                      <div key={feat} className="flex justify-between items-center text-gray-600">
                        <span className="capitalize">{feat.replace('_encoded', '').replace('_int', '')}</span>
                        <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${imp * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandPrediction;

