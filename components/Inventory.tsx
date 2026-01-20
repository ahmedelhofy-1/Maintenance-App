
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_PARTS } from '../constants';
import { Part } from '../types';

const Inventory: React.FC = () => {
  const [parts, setParts] = useState<Part[]>(MOCK_PARTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredParts = parts.filter(p => 
    String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadTemplate = () => {
    const headers = [
      ['Part ID', 'Part Name', 'Category', 'Stock Level', 'Min Stock Level', 'Max Stock Level', 'Unit', 'Unit Cost', 'Storage Location']
    ];
    const example = [
      ['PRT-EX-001', 'Ball Bearing 6203', 'Bearings', '20', '5', '100', 'pcs', '12.50', 'Shelf B-12']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Template");
    XLSX.writeFile(wb, "MaintenX_Inventory_Template.xlsx");
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const newPartsList: Part[] = data.map((row: any) => {
          const id = row['Part ID'] || `PRT-BULK-${Math.floor(1000 + Math.random() * 9000)}`;
          return {
            id,
            name: String(row['Part Name'] || 'New Part'),
            category: String(row['Category'] || 'General'),
            stock: parseInt(row['Stock Level']) || 0,
            minStock: parseInt(row['Min Stock Level']) || 0,
            maxStock: parseInt(row['Max Stock Level']) || 0,
            unit: String(row['Unit'] || 'pcs'),
            cost: parseFloat(row['Unit Cost']) || 0,
            location: String(row['Storage Location'] || 'Storehouse')
          };
        });

        setParts(prev => [...newPartsList, ...prev]);
        alert(`Successfully imported ${newPartsList.length} parts to inventory.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Failed to parse inventory file. Please ensure you use the provided template.");
      }
    };
    reader.readAsBinaryString(file);
  };

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
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={downloadTemplate}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <span>📥</span> Template
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-slate-900 transition-all flex items-center gap-2"
          >
            <span>📄</span> Bulk Upload
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleBulkUpload} 
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <span>+</span> Add Part to Store
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Part ID</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Min Level</th>
                <th className="px-6 py-4">Max Level</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Unit Cost</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono text-slate-600 font-black uppercase bg-slate-100 px-2 py-1 rounded">
                      {part.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{part.name}</div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{part.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${part.stock <= part.minStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="font-black text-slate-900">{part.stock} <span className="text-slate-400 font-bold">{part.unit}</span></span>
                    </div>
                    {part.stock <= part.minStock && (
                      <div className="text-[9px] font-black text-red-500 uppercase mt-0.5 tracking-tighter">REORDER POINT REACHED</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {part.minStock} {part.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      {part.maxStock} {part.unit}
                    </span>
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
