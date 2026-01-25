
import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_ANNUAL_REQUESTS } from '../constants';
import { AnnualPartRequest, RequestStatus, MasterData, Part, PagePermissions } from '../types';
import { syncToGoogleSheets } from '../services/syncService';
import { downloadTemplate, templates } from '../services/templateService';

interface AnnualRequestsProps {
  masterData: MasterData;
  permissions: PagePermissions;
}

const AnnualRequests: React.FC<AnnualRequestsProps> = ({ masterData, permissions }) => {
  const [requests, setRequests] = useState<AnnualPartRequest[]>(() => {
    const saved = localStorage.getItem('mx_annual');
    return saved ? JSON.parse(saved) : MOCK_ANNUAL_REQUESTS;
  });

  const [inventory, setInventory] = useState<Part[]>([]);

  useEffect(() => {
    const loadInventory = () => {
      const savedInventory = localStorage.getItem('mx_inventory');
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      } else {
        setInventory(masterData.parts);
      }
    };
    
    loadInventory();
    window.addEventListener('focus', loadInventory);
    return () => window.removeEventListener('focus', loadInventory);
  }, [masterData.parts]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('mx_annual', JSON.stringify(requests));
  }, [requests]);

  const handleSync = async (dataToSync: AnnualPartRequest[] = requests) => {
    if (!masterData.googleSheetsUrl) {
      alert("Please configure your Google Sheets URL in the Master Data tab.");
      return;
    }
    setIsSyncing(true);
    try {
      const flattenedForSync = dataToSync.flatMap(req => 
        req.items.map(item => ({
          request_id: req.id,
          requested_by: req.requestedBy,
          store: req.storeLocation,
          year: req.targetYear,
          status: req.status || 'Pending',
          part_id: item.partId,
          quantity: item.quantity
        }))
      );
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'AnnualRequests', flattenedForSync);
      alert("Forecasting data synced to Sheets!");
    } catch (err) {
      alert("Sync failed. Local data remains saved.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!permissions.add) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const newRequests: AnnualPartRequest[] = (data as any[]).map((row: any) => ({
          id: `ANN-${Math.floor(1000 + Math.random() * 9000)}`,
          requestedBy: String(row['Requested By'] || 'Bulk User'),
          storeLocation: String(row['Store Location'] || 'Central'),
          requestDate: new Date().toISOString().split('T')[0],
          targetYear: String(row['Target Year'] || '2025'),
          status: 'Pending',
          items: [{ partId: String(row['Part ID'] || ''), quantity: parseInt(row['Quantity']) || 0 }],
          notes: String(row['Notes'] || 'Imported planning')
        }));

        setRequests(prev => [...newRequests, ...prev]);
        alert(`Successfully imported ${newRequests.length} entries.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) { alert("Import failed."); }
    };
    reader.readAsBinaryString(file);
  };

  const getStatusStyles = (status?: RequestStatus) => {
    const s = status || 'Pending';
    switch (s) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const flattenedItems = useMemo(() => {
    return (requests || []).flatMap(req => 
      (req.items || []).map(item => {
        const part = inventory.find(p => p.id === item.partId) || 
                     masterData.parts.find(p => p.id === item.partId);

        const partLoc = String(part?.location || '').toLowerCase();
        const targetLoc = String(req.storeLocation || '').toLowerCase();
        const stockInLoc = (partLoc && targetLoc && (partLoc.includes(targetLoc) || targetLoc.includes(partLoc))) 
          ? (part?.stock || 0) : 0;

        const totalAllStores = inventory
          .filter(p => p.id === item.partId)
          .reduce((sum, p) => sum + (p.stock || 0), 0);

        return {
          requestId: req.id,
          year: req.targetYear,
          status: req.status || 'Pending',
          store: req.storeLocation,
          partId: item.partId,
          partName: part?.name || 'Unknown Part',
          qtyRequested: item.quantity,
          stockInLoc,
          totalStock: totalAllStores || (part?.stock || 0),
          maxLevel: part?.maxStock || 0,
          unit: part?.unit || 'pcs'
        };
      })
    );
  }, [requests, inventory, masterData.parts]);

  const filteredItems = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return flattenedItems.filter(item => {
      const matchesSearch = (item.partName || '').toLowerCase().includes(term) ||
                            (item.partId || '').toLowerCase().includes(term) ||
                            (item.store || '').toLowerCase().includes(term);
      const matchesStatus = filterStatus === 'all' || item.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [flattenedItems, searchTerm, filterStatus]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by part or store..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Sanctioned</option>
            <option value="cancelled">Rejected</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          {permissions.edit && (
            <button 
              disabled={isSyncing}
              onClick={() => handleSync()}
              className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? '⏳ Syncing...' : '☁️ Push to Cloud'}
            </button>
          )}
          
          {permissions.add && (
            <div className="flex bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-all border-r border-slate-700">📄 Bulk Import</button>
              <button 
                onClick={() => downloadTemplate(templates.annualRequests, 'Annual_Planning')}
                title="Download Template"
                className="px-3 py-2.5 text-slate-500 hover:text-blue-600 hover:bg-white transition-all text-xs font-black uppercase"
              >
                TPL 📥
              </button>
            </div>
          )}

          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-l-[12px] border-l-indigo-600">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              Strategic Planning Registry
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredItems.length} Entries found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">Part Details</th>
                <th className="px-6 py-4">Planning Qty</th>
                <th className="px-6 py-4">In-Store Stock</th>
                <th className="px-6 py-4">Global Network</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? filteredItems.map((item, idx) => {
                const isOverCapacity = item.stockInLoc + item.qtyRequested > item.maxLevel && item.maxLevel > 0;
                
                return (
                  <tr key={`${item.requestId}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-black bg-slate-100 px-2 py-1 rounded border border-slate-200">{item.partId}</span>
                        <div>
                          <div className="font-black text-slate-900 uppercase text-xs">{item.partName}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">REF: {item.requestId} • {item.store}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black ${isOverCapacity ? 'text-orange-500' : 'text-blue-600'}`}>
                          {item.qtyRequested} {item.unit}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Target: {item.year}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-xs font-black text-slate-700">{item.stockInLoc} {item.unit}</div>
                       <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${isOverCapacity ? 'bg-orange-400' : 'bg-green-400'}`} 
                            style={{ width: `${Math.min(100, (item.stockInLoc / (item.maxLevel || 100)) * 100)}%` }}
                          />
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-900">{item.totalStock} {item.unit}</span>
                      <p className="text-[9px] text-slate-400 uppercase">Across all stores</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border tracking-widest ${getStatusStyles(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center opacity-40">
                    <span className="text-4xl block mb-2">🔍</span>
                    <p className="text-sm font-bold uppercase">No planning data found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💡</div>
        <p className="text-xs text-indigo-800 leading-relaxed font-medium flex-1">
          <b>Governance Workflow:</b> Forecasting entries uploaded here are automatically routed to the <b>Approval Hub</b> for Manager sanctioning. Once approved, they are designated as sanctioned budget for procurement cycles.
        </p>
        <button 
          onClick={() => window.location.hash = 'approvals'}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/10"
        >
          View Approval Hub
        </button>
      </div>
    </div>
  );
};

export default AnnualRequests;
