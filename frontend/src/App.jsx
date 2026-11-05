import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import FoodWasteAnalytics from './pages/FoodWasteAnalytics';
import DemandPrediction from './pages/DemandPrediction';
import Recommendations from './pages/Recommendations';
import RecordManagement from './pages/RecordManagement';
import BigDataProcessing from './pages/BigDataProcessing';
import Reports from './pages/Reports';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<FoodWasteAnalytics />} />
        <Route path="/prediction" element={<DemandPrediction />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/records" element={<RecordManagement />} />
        <Route path="/big-data" element={<BigDataProcessing />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

export default App;
