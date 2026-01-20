
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { MasterData, Part, User, Role, PagePermissions, ModuleKey } from '../types';
import { syncToGoogleSheets, fetchFromGoogleSheets } from '../services/syncService';
import { downloadTemplate, templates } from '../services/templateService';

interface MasterDataEditorProps {
  masterData: MasterData;
  onUpdate: (data: MasterData) => void;
  permissions: PagePermissions;
}

type CategoryKey = keyof MasterData | 'integration' | 'parts' | 'users' | 'access';

const MasterDataEditor: React.FC<MasterDataEditorProps> = ({ masterData, onUpdate, permissions }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('departments');
  const [newItemValue, setNewItemValue] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'departments', label: 'Departments', icon: '🏢' },
    { key: 'assetTypes', label: 'Asset Definitions', icon: '🔧' },
    { key: 'parts', label: 'Parts Registry', icon: '🧩' },
    { key: 'users', label: 'User Directory', icon: '👥' },
    { key: 'access', label: 'Access Control', icon: '🔐' },
    { key: 'integration', label: 'Cloud Sync', icon: '☁️' },
  ];

  const handleUpdateRolePermission = (roleId: string, module: ModuleKey, permKey: keyof PagePermissions) => {
    const updatedRoles = masterData.roles.map(role => {
        if (role.id === roleId) {
            const newModulePerms = { ...role.permissions[module], [permKey]: !role.permissions[module][permKey] };
            return {
                ...role,
                permissions: { ...role.permissions, [module]: newModulePerms }
            };
        }
        return role;
    });
    onUpdate({ ...masterData, roles: updatedRoles });
  };

  const renderUserDirectory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Authorized Personnel</h3>
        {permissions.add && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ Add Staff</button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">System Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {masterData.users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{user.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase">{user.id}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-tighter">{user.jobTitle}</td>
                        <td className="px-6 py-4">
                            <div className="text-xs text-slate-600">{user.email}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{user.mobile}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {masterData.roles.find(r => r.id === user.roleId)?.name}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-slate-300 hover:text-blue-600 mr-2">✏️</button>
                            <button className="text-slate-300 hover:text-red-500">🗑️</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccessControl = () => (
    <div className="space-y-8">
        <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Role Permission Matrix</h3>
            <div className="grid grid-cols-1 gap-8">
                {masterData.roles.map(role => (
                    <div key={role.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center">
                            <h4 className="text-sm font-black uppercase tracking-widest">{role.name} Capabilities</h4>
                            <span className="text-[10px] opacity-50 font-mono">ROLE_ID: {role.id}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                                        <th className="px-6 py-3">Module</th>
                                        <th className="px-6 py-3 text-center">Read</th>
                                        <th className="px-6 py-3 text-center">Add</th>
                                        <th className="px-6 py-3 text-center">Edit</th>
                                        <th className="px-6 py-3 text-center">Delete</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Object.keys(role.permissions).map(moduleKey => {
                                        const m = moduleKey as ModuleKey;
                                        const p = role.permissions[m];
                                        return (
                                            <tr key={m} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">{m}</td>
                                                {['read', 'add', 'edit', 'delete'].map(perm => (
                                                    <td key={perm} className="px-6 py-3 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={(p as any)[perm]} 
                                                            disabled={!permissions.edit}
                                                            onChange={() => handleUpdateRolePermission(role.id, m, perm as keyof PagePermissions)}
                                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderPartsRegistry = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-50 p-6 rounded-2xl border border-blue-100 gap-4">
        <div>
          <h3 className="text-lg font-black text-blue-900 uppercase">Master Parts Catalog</h3>
          <p className="text-sm text-blue-700">Authoritative reference list. Changes here update the whole system.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.edit && (
              <button 
                disabled={syncStatus === 'loading'}
                onClick={() => {}} 
                className="bg-[#0F9D58] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:brightness-110 transition-all flex items-center gap-2"
              >
                {syncStatus === 'loading' ? '⏳ Syncing...' : '☁️ Push Registry'}
              </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Part ID</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Equip Category</th>
                <th className="px-6 py-4">Min Stock</th>
                <th className="px-6 py-4">Max Stock</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {masterData.parts.length > 0 ? (
                <>
                  {masterData.parts.map((part) => (
                    <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-[10px] font-mono font-black bg-slate-100 px-2 py-1 rounded border border-slate-200">{part.id}</span>
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-900">{part.name}</td>
                      <td className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        {part.category || 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-red-600">{part.minStock}</td>
                      <td className="px-6 py-3 text-xs font-bold text-green-600">{part.maxStock}</td>
                      <td className="px-6 py-3 text-right">
                        {permissions.delete && (
                            <button onClick={() => {}} className="text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Empty Registry.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[75vh]">
        <div className="w-full md:w-72 border-r border-slate-100 bg-slate-50/30 p-4 shrink-0">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 px-2">System Config</h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  selectedCategory === cat.key 
                    ? 'bg-white shadow-md shadow-slate-200/50 text-blue-600 font-bold border border-slate-100' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1 leading-none uppercase">
                {categories.find(c => c.key === selectedCategory)?.label}
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Manage administrative parameters and global system references.
              </p>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {selectedCategory === 'users' ? renderUserDirectory() : 
             selectedCategory === 'access' ? renderAccessControl() :
             selectedCategory === 'parts' ? renderPartsRegistry() : 
             selectedCategory === 'integration' ? (
              <div className="space-y-8">
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4">
                  <div className="text-2xl">💾</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-amber-900 uppercase">Recovery Mode</h4>
                    <p className="text-xs text-amber-700">Sync entire database to Google Sheets.</p>
                  </div>
                  <button className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Push All</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 opacity-30 italic">Module content pending configuration.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataEditor;
