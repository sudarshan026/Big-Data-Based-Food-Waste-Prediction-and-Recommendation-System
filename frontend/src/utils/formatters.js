export const formatNumber = (num, decimals = 1) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN', { maximumFractionDigits: decimals });
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '0%';
  return Number(value).toFixed(1) + '%';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
