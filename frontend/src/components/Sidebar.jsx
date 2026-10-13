import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AboutModal from './AboutModal';
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
  Info,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    Farmer: [
      { path: '/', label: 'FPO Dashboard', icon: LayoutDashboard },
      { path: '/my-profile', label: 'My Financial Profile', icon: User },
      { path: '/apply', label: 'Apply for Credit', icon: FileSignature },
    ],
    'Loan Officer': [
      { path: '/', label: 'Officer Queue', icon: LayoutDashboard },
      { path: '/farmers', label: 'Farmer Profiles', icon: Users },
      { path: '/reports', label: 'Reports Console', icon: FileSpreadsheet },
    ],
    Admin: [
      { path: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
      { path: '/farmers', label: 'Manage Farmers', icon: Users },
      { path: '/map', label: 'Geo-Analytics Map', icon: MapPin },
      { path: '/reports', label: 'Reports Panel', icon: FileSpreadsheet },
    ],
  };

  const currentNavs = navItems[user?.role] || [];

  return (
    <>
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 shadow-xl z-20">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-lg text-white shadow-md shadow-emerald-500/20">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              AgriLend360
            </h1>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
              FPO Credit & Risk Platform
            </span>
          </div>
        </div>

        {/* Top Feature: About AgriLend360 */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800/60">
          <button
            onClick={() => setIsAboutOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 hover:text-white border border-emerald-800/60 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <Info className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>About AgriLend360</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {currentNavs.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400 border-l-4 border-emerald-500 pl-3 shadow-inner'
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

        {/* About Button & Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <button
            onClick={() => setIsAboutOpen(true)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-emerald-400 border border-slate-800 hover:border-emerald-900/60 rounded-lg text-xs font-semibold transition"
          >
            <Info className="h-3.5 w-3.5 text-emerald-400" />
            <span>About AgriLend360</span>
          </button>

          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
              {user?.role === 'Admin' ? (
                <ShieldCheck className="h-4.5 w-4.5 text-amber-400" />
              ) : user?.role === 'Loan Officer' ? (
                <UserCheck className="h-4.5 w-4.5 text-indigo-400" />
              ) : (
                <User className="h-4.5 w-4.5 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800/80 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-900 rounded-lg text-xs font-medium transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};

export default Sidebar;
