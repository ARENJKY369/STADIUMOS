import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠', desc: 'Overview' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Live Operations' },
  { path: '/operations', label: 'Operations', icon: '⚙️', desc: 'Crowd & Zones' },
  { path: '/analytics', label: 'Analytics', icon: '📈', desc: 'Insights & Reports' },
  { path: '/events', label: 'Events', icon: '🏆', desc: 'Matches' },
  { path: '/staff', label: 'Staff', icon: '👥', desc: 'Team Management' },
  { path: '/settings', label: 'Settings', icon: '🔧', desc: 'Configuration' },
  { path: '/profile', label: 'Profile', icon: '👤', desc: 'My Account' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose}></div>}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 z-30 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1 text-left">
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-xs opacity-70">{item.desc}</div>
                </div>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <p className="font-semibold text-sm">FIFA World Cup 2026</p>
              <p className="text-xs opacity-90 mt-1">12 stadiums • 104 matches • 16 host cities</p>
              <div className="mt-3 flex gap-2">
                <div className="text-xs"><span className="font-bold">43</span> days to go</div>
                <div className="text-xs opacity-75">•</div>
                <div className="text-xs"><span className="font-bold">98%</span> ready</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> System Health
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-slate-400">API</span><span className="text-green-400">98ms</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400">DB</span><span className="text-green-400">42ms</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400">ML</span><span className="text-green-400">Online</span></div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center">StadiumOS v1.0.0 • Production Ready</p>
          </div>
        </div>
      </aside>
    </>
  );
}
