
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

  // Pull current live inventory from localStorage to cross-reference
  const [inventory, setInventory] = useState<Part[]>([]);

  useEffect(() => {
    const loadInventory = () => {
      const savedInventory = localStorage.getItem('mx_inventory');
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      } else {
        // Fallback to Master Parts if no inventory exists yet
        setInventory(masterData.parts);
      }
    };
    
    loadInventory();
    // Re-load inventory whenever the tab becomes active to ensure fresh data
    window.addEventListener('focus', loadInventory);
    return () => window.removeEventListener('focus', loadInventory);
  }, [masterData.parts]);

  const [searchTerm, setSearchTerm] = useState('');
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
          status: req.status,
          part_id: item.partId,
          quantity: item.quantity
        }))
      );
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'AnnualRequests', flattenedForSync);
      alert("Forecasting data synced to Sheets and saved locally!");
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
        alert(`Successfully imported and saved ${newRequests.length} forecasting entries.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) { alert("Import failed."); }
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

  const flattenedItems = useMemo(() => {
    return (requests || []).flatMap(req => 
      (req.items || []).map(item => {
        // Find matching part in the LIVE inventory list
        const part = inventory.find(p => p.id === item.partId) || 
                     masterData.parts.find(p => p.id === item.partId);

        const partLoc = String(part?.location || '').toLowerCase();
        const targetLoc = String(req.storeLocation || '').toLowerCase();
        
        // Calculate stock specific to the requested store location
        const stockInLoc = (partLoc && targetLoc && (partLoc.includes(targetLoc) || targetLoc.includes(partLoc))) 
          ? (part?.stock || 0) 
          : 0;

        // Calculate aggregate stock for this part ID across all locations in the inventory table
        const totalAllStores = inventory
          .filter(p => p.id === item.partId)
          .reduce((sum, p) => sum + (p.stock || 0), 0);

        return {
          requestId: req.id,
          year: req.targetYear,
          status: req.status,
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
    return flattenedItems.filter(item => 
      (item.partName || '').toLowerCase().includes(term) ||
      (item.partId || '').toLowerCase().includes(term) ||
      (item.store || '').toLowerCase().includes(term)
    );
  }, [flattenedItems, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search planning by part, ID, or location..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {permissions.edit && (
            <button 
              disabled={isSyncing}
              onClick={() => handleSync()}
              className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? '⏳ Syncing...' : '☁️ Push to Sheets'}
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
          {permissions.delete && (
            <button onClick={() => { if(confirm("Reset local planning data?")) setRequests([]); }} className="px-4 py-2.5 border border-slate-200 text-slate-400 rounded-xl text-sm font-bold">🗑️ Reset</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Part ID</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Planning Qty</th>
                <th className="px-6 py-4">In Store ({filteredItems[0]?.store || 'Local'})</th>
                <th className="px-6 py-4">Total (Global)</th>
                <th className="px-6 py-4">Max Capacity</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? filteredItems.map((item, idx) => {
                const isOverCapacity = item.stockInLoc + item.qtyRequested > item.maxLevel && item.maxLevel > 0;
                
                return (
                  <tr key={`${item.requestId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><span className="text-[10px] font-mono font-black bg-slate-100 px-2 py-1 rounded">{item.partId}</span></td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.partName}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.requestId} • {item.year}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-black ${isOverCapacity ? 'text-orange-500' : 'text-blue-600'}`}>
                        {item.qtyRequested} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {item.stockInLoc} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {item.totalStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {item.maxLevel > 0 ? `${item.maxLevel} ${item.unit}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic text-sm">No planning data available matching current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <span className="text-xl">💡</span>
        <p className="text-xs text-blue-700 leading-relaxed">
          <b>Planning Tip:</b> Stock levels are synced in real-time from your <b>Inventory</b> tab. If you update stock counts or locations in the inventory module, return here to see the recalculated impact on your annual forecast.
        </p>
      </div>
    </div>
  );
};

export default AnnualRequests;
