import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  BrainCircuit,
  Lightbulb,
  Database,
  Cpu,
  FileText,
  Leaf,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart3, label: 'Food Waste Analytics' },
  { to: '/prediction', icon: BrainCircuit, label: 'Demand Prediction' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { to: '/records', icon: Database, label: 'Record Management' },
  { to: '/big-data', icon: Cpu, label: 'Big Data Processing' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-green-900 to-green-950 text-white flex flex-col z-50">
      <div className="p-5 border-b border-green-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">FoodWaste</h1>
            <p className="text-xs text-green-300/80">Analytics</p>
          </div>
        </div>
        <p className="text-[10px] text-green-400/60 mt-2 uppercase tracking-widest">Big Data Analytics Platform</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-green-700/50 text-white border-l-4 border-white pl-2'
                      : 'text-green-100/70 hover:bg-green-800/40 hover:text-white border-l-4 border-transparent pl-2'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-green-800/50">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="text-[10px] px-2 py-1 bg-green-700/40 rounded-full text-green-300 font-medium">SDG 12</span>
            <span className="text-[10px] px-2 py-1 bg-green-700/40 rounded-full text-green-300 font-medium">SDG 2</span>
          </div>
          <span className="text-[10px] text-green-500/60">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
