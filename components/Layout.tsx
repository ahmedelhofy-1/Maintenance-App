
import React, { useState } from 'react';
import { User, Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  currentUserRole: Role;
  users: User[];
  onUserSwitch: (id: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  currentUserRole, 
  users, 
  onUserSwitch,
  onLogout 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'assets', label: 'Assets', icon: '🏭' },
    { id: 'workorders', label: 'Work Orders', icon: '📝' },
    { id: 'approvals', label: 'Approval Hub', icon: '⚖️' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'requests', label: 'Parts Requests', icon: '📥' },
    { id: 'annual', label: 'Annual Planning', icon: '📅' },
    { id: 'ai', label: 'AI Diagnostic', icon: '🤖' },
    { id: 'masterdata', label: 'Master Data', icon: '⚙️' },
  ];

  // Filter navigation items based on READ permission
  const filteredNavItems = navItems.filter(item => {
    const perm = currentUserRole.permissions[item.id as keyof typeof currentUserRole.permissions];
    return perm?.read;
  });

  const isAdmin = currentUserRole.id === 'admin';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-6 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg font-bold text-xl shadow-lg shadow-blue-500/10">MX</div>
          <h1 className="text-xl font-bold tracking-tight">MaintenX</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-800 relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-2 w-full hover:bg-slate-800 rounded-xl transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs border border-blue-400/30">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-black tracking-widest leading-none">{currentUserRole.name}</p>
            </div>
            <span className="text-xs text-slate-500 transition-transform" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 w-full bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 mb-2 z-50 animate-in slide-in-from-bottom-2 duration-200">
                {isAdmin && (
                  <>
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 mb-1 tracking-widest">Admin Actions</p>
                    {users.map(u => (
                        <button 
                            key={u.id}
                            onClick={() => {
                                onUserSwitch(u.id);
                                setIsUserMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 transition-colors ${currentUser.id === u.id ? 'font-black text-blue-600 bg-blue-50' : ''}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${currentUser.id === u.id ? 'bg-blue-600' : 'bg-slate-300'}`} />
                            {u.name}
                        </button>
                    ))}
                    <div className="h-px bg-slate-100 my-1" />
                  </>
                )}
                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-xs font-black text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors uppercase tracking-widest"
                >
                  🚪 Sign Out
                </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              ☰
            </button>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{currentUser.jobTitle}</span>
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Facility Level: {currentUserRole.name}</span>
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-72 h-full bg-slate-900 p-6 flex flex-col animate-in slide-in-from-left duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg font-bold text-xl text-white">MX</div>
                <h1 className="text-xl font-bold tracking-tight text-white">MaintenX</h1>
              </div>
              <button className="text-slate-400 text-2xl hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>&times;</button>
            </div>
            <nav className="flex-1 space-y-1">
              {filteredNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-bold text-sm uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </nav>
            <button 
              onClick={onLogout}
              className="mt-4 w-full p-4 rounded-xl bg-red-600/10 text-red-500 font-black uppercase text-xs tracking-[0.2em] border border-red-500/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
