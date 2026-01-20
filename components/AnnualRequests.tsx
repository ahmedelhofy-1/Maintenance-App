
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_ANNUAL_REQUESTS, MOCK_PARTS } from '../constants';
import { AnnualPartRequest, RequestStatus } from '../types';

const AnnualRequests: React.FC = () => {
  const [requests, setRequests] = useState<AnnualPartRequest[]>(MOCK_ANNUAL_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

        // Group items by unique request identifier (Requested By + Location + Year + Notes) 
        // Or simply create unique requests per row if they are discrete bulk orders
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Annual Spare Planning</h2>
          <p className="text-slate-500 text-sm">Bulk requisitions for yearly inventory forecasting and procurement.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={downloadTemplate}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <span>📥</span> Template
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-500/20 hover:bg-slate-800 transition-all flex items-center gap-2"
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

      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                    {req.targetYear}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{req.id}</h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                      Store: <span className="text-slate-900">{req.storeLocation}</span> • Requester: <span className="text-slate-900">{req.requestedBy}</span>
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(req.status)}`}>
                  {req.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Forecast Items</h5>
                  <div className="space-y-2">
                    {req.items.map((item, idx) => {
                      const part = MOCK_PARTS.find(p => p.id === item.partId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-xs font-black text-slate-800 uppercase">{part?.name || 'Technical Spare'}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.partId}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-blue-600">{item.quantity}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{part?.unit || 'Units'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Planning Purpose</h5>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    {req.notes || "No detailed planning notes provided for this annual requisition."}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Created: {req.requestDate}</span>
                    <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">View Full Details</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed">
          <p className="text-4xl mb-2">📊</p>
          <p className="font-black uppercase tracking-widest text-sm text-slate-400">Annual Plan Registry Empty</p>
          <p className="text-xs mt-2">Use the bulk import tool to upload your yearly forecasting data.</p>
        </div>
      )}
    </div>
  );
};

export default AnnualRequests;
