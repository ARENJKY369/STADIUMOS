import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const unreadCount = useSelector(state => state.notifications.unreadCount);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 h-16 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">SO</div>
          <div>
            <h1 className="font-bold text-white text-sm lg:text-base leading-tight">StadiumOS</h1>
            <p className="text-xs text-slate-400 hidden sm:block">FIFA World Cup 2026</p>
          </div>
        </div>
        <div className="hidden md:flex items-center ml-6 gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> LIVE
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">MetLife Stadium</span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="relative p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition">
            <img src={`https://ui-avatars.com/api/?name=${user?.firstName || user?.email}&background=2563eb&color=fff`} alt="avatar" className="w-8 h-8 rounded-full" />
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-white leading-tight">{user?.firstName || user?.email?.split('@')[0]} {user?.lastName || ''}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role || 'staff'}</p>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-700">
                <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="p-2">
                <a href="/profile" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700 text-slate-300 text-sm">Profile Settings</a>
                <a href="/settings" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700 text-slate-300 text-sm">Preferences</a>
                <button onClick={() => { logout(); window.location.href='/login'; }} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/20 text-red-400 text-sm">Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
