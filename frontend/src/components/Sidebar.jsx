import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  MapPin,
  FileSignature,
  Users,
  LogOut,
  User,
  ShieldCheck,
  Coins,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    Farmer: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/my-profile', label: 'My Financial Profile', icon: User },
      { path: '/apply', label: 'Apply for Loan', icon: FileSignature },
    ],
    'Loan Officer': [
      { path: '/', label: 'Officer Queue', icon: LayoutDashboard },
      { path: '/farmers', label: 'Farmer Profiles', icon: Users },
      { path: '/reports', label: 'Reports Console', icon: FileSpreadsheet },
    ],
    Admin: [
      { path: '/', label: 'Admin Dashboard', icon: LayoutDashboard },
      { path: '/farmers', label: 'Manage Farmers', icon: Users },
      { path: '/map', label: 'Geo-Analytics Map', icon: MapPin },
      { path: '/reports', label: 'Reports Panel', icon: FileSpreadsheet },
    ],
  };

  const currentNavs = navItems[user?.role] || [];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-xl z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-primary-500 p-2 rounded-lg text-white shadow-md shadow-primary-500/20">
          <Coins className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            AgriLend360
          </h1>
          <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
            FPO FinPlatform
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {currentNavs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600/25 text-emerald-400 border-l-4 border-emerald-500 pl-3 shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-3 px-2 py-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
            {user?.role === 'Admin' ? (
              <ShieldCheck className="h-5 w-5 text-amber-400" />
            ) : user?.role === 'Loan Officer' ? (
              <UserCheck className="h-5 w-5 text-indigo-400" />
            ) : (
              <User className="h-5 w-5 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              {user?.role}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-900 rounded-lg text-sm font-medium transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
