
import React, { useState } from 'react';
import { MOCK_PARTS } from '../constants';
import { Part } from '../types';

const Inventory: React.FC = () => {
  const [parts, setParts] = useState<Part[]>(MOCK_PARTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search parts by name or ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <span>+</span> Add Part to Store
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Part Information</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4">Storage Location</th>
                <th className="px-6 py-4">Unit Cost</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{part.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">{part.id} • {part.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${part.stock <= part.minStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="font-black text-slate-900">{part.stock} {part.unit}</span>
                    </div>
                    {part.stock <= part.minStock && (
                      <div className="text-[9px] font-black text-red-500 uppercase mt-0.5 tracking-tighter">REORDER POINT REACHED (Min: {part.minStock})</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    <span className="opacity-60 mr-1">📍</span> {part.location}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    ${part.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all">
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredParts.length === 0 && (
        <div className="py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed">
          <p className="text-4xl mb-2">📦</p>
          <p className="font-black uppercase tracking-widest text-sm text-slate-400">Inventory Registry Empty</p>
        </div>
      )}
    </div>
  );
};

export default Inventory;
