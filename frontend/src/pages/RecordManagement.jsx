import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Database,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { recordsAPI } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import Notification from '../components/Notification';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, formatCurrency, formatDate } from '../utils/formatters';

const CATEGORIES = ['Rice', 'Curry', 'Bread', 'Snacks', 'Beverages', 'Desserts', 'Salad', 'Fruits'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner'];

const RecordManagement = () => {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [mealFilter, setMealFilter] = useState('');

  // Modals & Notifications
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    food_item: '',
    food_category: 'Rice',
    meal_type: 'Lunch',
    quantity_prepared: '',
    quantity_consumed: '',
    students_served: '',
    cost_per_kg: '',
    special_event: false,
    remarks: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: perPage,
        search,
        category: categoryFilter,
        meal_type: mealFilter
      };
      const res = await recordsAPI.getAll(params);
      setRecords(res.data.records || []);
      setTotalRecords(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching records:', err);
      setNotification({ type: 'error', message: 'Failed to retrieve food records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, categoryFilter, mealFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormData(initialFormState);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setEditingRecord(rec);
    setFormData({
      date: rec.date || '',
      food_item: rec.food_item || '',
      food_category: rec.food_category || 'Rice',
      meal_type: rec.meal_type || 'Lunch',
      quantity_prepared: rec.quantity_prepared || '',
      quantity_consumed: rec.quantity_consumed || '',
      students_served: rec.students_served || '',
      cost_per_kg: rec.cost_per_kg || '',
      special_event: !!rec.special_event,
      remarks: rec.remarks || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const prep = parseFloat(formData.quantity_prepared);
    const cons = parseFloat(formData.quantity_consumed);

    if (isNaN(prep) || prep <= 0) {
      setFormError('Quantity Prepared must be greater than 0.');
      return;
    }
    if (isNaN(cons) || cons < 0) {
      setFormError('Quantity Consumed cannot be negative.');
      return;
    }
    if (cons > prep) {
      setFormError('Quantity Consumed cannot exceed Quantity Prepared.');
      return;
    }

    try {
      if (editingRecord) {
        await recordsAPI.update(editingRecord.id, formData);
        setNotification({ type: 'success', message: 'Food record updated successfully.' });
      } else {
        await recordsAPI.create(formData);
        setNotification({ type: 'success', message: 'New food record created.' });
      }
      setIsModalOpen(false);
      fetchRecords();
    } catch (err) {
      console.error('Save error:', err);
      setFormError(err.response?.data?.error || 'Failed to save record.');
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteConfirmId) return;
    try {
      await recordsAPI.delete(deleteConfirmId);
      setNotification({ type: 'success', message: 'Food record deleted successfully.' });
      setDeleteConfirmId(null);
      fetchRecords();
    } catch (err) {
      console.error('Delete error:', err);
      setNotification({ type: 'error', message: 'Failed to delete record.' });
    }
  };

  const calculatedWasted = () => {
    const prep = parseFloat(formData.quantity_prepared) || 0;
    const cons = parseFloat(formData.quantity_consumed) || 0;
    return Math.max(0, prep - cons).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Food Waste Records</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create, search, audit, and manage individual daily canteen food consumption entries.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Food Record
        </button>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by food item or remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={mealFilter}
            onChange={(e) => { setMealFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Meal Periods</option>
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Fetching food waste records from SQLite..." />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No records matched your search or filter criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Food Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Meal Period</th>
                    <th className="py-3 px-4 text-right">Prepared (kg)</th>
                    <th className="py-3 px-4 text-right">Consumed (kg)</th>
                    <th className="py-3 px-4 text-right">Wasted (kg)</th>
                    <th className="py-3 px-4 text-right">Waste %</th>
                    <th className="py-3 px-4 text-right">Students</th>
                    <th className="py-3 px-4 text-right">Cost/kg (₹)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-500">{formatDate(rec.date)}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{rec.food_item}</td>
                      <td className="py-3 px-4">{rec.food_category}</td>
                      <td className="py-3 px-4">{rec.meal_type}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatNumber(rec.quantity_prepared)}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">{formatNumber(rec.quantity_consumed)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">{formatNumber(rec.quantity_wasted)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{rec.waste_percentage}%</td>
                      <td className="py-3 px-4 text-right">{rec.students_served || '—'}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(rec.cost_per_kg)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            className="p-1 text-gray-400 hover:text-emerald-600 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Showing Page {currentPage} of {totalPages} ({totalRecords.toLocaleString()} total entries)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-gray-800">{currentPage}</span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">
                {editingRecord ? 'Edit Food Record' : 'Add New Daily Food Record'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Service Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Food Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plain Rice"
                    value={formData.food_item}
                    onChange={(e) => setFormData({ ...formData, food_item: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Category</label>
                  <select
                    value={formData.food_category}
                    onChange={(e) => setFormData({ ...formData, food_category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Meal Period</label>
                  <select
                    value={formData.meal_type}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Prepared (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.quantity_prepared}
                    onChange={(e) => setFormData({ ...formData, quantity_prepared: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Consumed (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.quantity_consumed}
                    onChange={(e) => setFormData({ ...formData, quantity_consumed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Wasted (Auto)</label>
                  <input
                    type="text"
                    readOnly
                    value={`${calculatedWasted()} kg`}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-600 bg-gray-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Students Served</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.students_served}
                    onChange={(e) => setFormData({ ...formData, students_served: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Cost per kg (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.cost_per_kg}
                    onChange={(e) => setFormData({ ...formData, cost_per_kg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal_special"
                  checked={formData.special_event}
                  onChange={(e) => setFormData({ ...formData, special_event: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="modal_special" className="text-gray-700 font-medium cursor-pointer">
                  Special College Event / Gathering
                </label>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Remarks (Optional)</label>
                <textarea
                  rows="2"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Notes regarding weather, exams, or student attendance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingRecord ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Delete Food Record"
        message="Are you sure you want to permanently delete this food record? This action cannot be undone."
        onConfirm={handleDeleteRecord}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};

export default RecordManagement;

