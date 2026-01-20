
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_ANNUAL_REQUESTS, MOCK_PARTS } from '../constants';
import { AnnualPartRequest, RequestStatus, Part } from '../types';

const AnnualRequests: React.FC = () => {
  const [requests, setRequests] = useState<AnnualPartRequest[]>(MOCK_ANNUAL_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = [
      ['Requested By', 'Store Location', 'Target Year', 'Part ID', 'Quantity', 'Notes']
    ];
    const example = [
      ['Maintenance Head', 'Central Store A', '2025', 'PRT-001', '250', 'Annual bulk order for filtration units']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Annual Requests Template");
    XLSX.writeFile(wb, "MaintenX_Annual_Parts_Request.xlsx");
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

        const newRequests: AnnualPartRequest[] = data.map((row: any) => {
          const id = `ANN-BULK-${Math.floor(1000 + Math.random() * 9000)}`;
          return {
            id,
            requestedBy: String(row['Requested By'] || 'System User'),
            storeLocation: String(row['Store Location'] || 'Unspecified Store'),
            requestDate: new Date().toISOString().split('T')[0],
            targetYear: String(row['Target Year'] || new Date().getFullYear().toString()),
            status: 'Pending',
            items: [{
              partId: String(row['Part ID'] || ''),
              quantity: parseInt(row['Quantity']) || 0
            }],
            notes: String(row['Notes'] || 'Annual planning upload.')
          };
        });

        const validRequests = newRequests.filter(r => r.items[0].partId && r.items[0].quantity > 0);
        setRequests(prev => [...validRequests, ...prev]);
        alert(`Successfully imported ${validRequests.length} annual planning entries.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Failed to parse annual request file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Issued': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const flattenedItems = requests.flatMap(req => 
    req.items.map(item => {
      const part = MOCK_PARTS.find(p => p.id === item.partId);
      const stockInLoc = part?.location.toLowerCase().includes(req.storeLocation.toLowerCase()) ? part.stock : 0;
      const totalStock = part?.stock || 0;

      return {
        requestId: req.id,
        year: req.targetYear,
        status: req.status,
        store: req.storeLocation,
        partId: item.partId,
        partName: part?.name || 'N/A',
        qtyRequested: item.quantity,
        stockInLoc: stockInLoc,
        totalStock: totalStock,
        maxLevel: part?.maxStock || 0,
        unit: part?.unit || 'pcs'
      };
    })
  );

  const filteredItems = flattenedItems.filter(item => 
    item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.partId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.requestId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search planning by Part ID or Name..."
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
            className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-500/20 hover:bg-slate-900 transition-all flex items-center gap-2"
          >
            <span>📄</span> Bulk Import
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleBulkUpload} 
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Part ID</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Quantity Request</th>
                <th className="px-6 py-4">Stock (Target Store)</th>
                <th className="px-6 py-4">Total Stock</th>
                <th className="px-6 py-4">Max Level</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => {
                const isOverCapacity = (item.stockInLoc + item.qtyRequested) > item.maxLevel;
                
                return (
                  <tr key={`${item.requestId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono text-slate-600 font-black uppercase bg-slate-100 px-2 py-1 rounded">
                        {item.partId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.partName}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">REF: {item.requestId} • {item.year}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-blue-600">{item.qtyRequested}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{item.stockInLoc}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">IN {item.store}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{item.totalStock}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">ALL LOCATIONS</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{item.maxLevel}</div>
                      {isOverCapacity && (
                        <div className="text-[8px] font-black text-orange-500 uppercase mt-0.5 animate-pulse">CAPACITY EXCEEDED</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed">
          <p className="text-4xl mb-2">📊</p>
          <p className="font-black uppercase tracking-widest text-sm text-slate-400">Planning Registry Clear</p>
          <p className="text-xs mt-2">No matching annual requests found.</p>
        </div>
      )}
    </div>
  );
};

export default AnnualRequests;
