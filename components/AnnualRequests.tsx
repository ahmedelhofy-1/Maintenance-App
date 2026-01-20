
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_ANNUAL_REQUESTS, MOCK_PARTS } from '../constants';
import { AnnualPartRequest, RequestStatus, Part, MasterData } from '../types';
import { syncToGoogleSheets } from '../services/syncService';

interface AnnualRequestsProps {
  masterData?: MasterData; // Optional for backward compatibility but recommended
}

const AnnualRequests: React.FC<AnnualRequestsProps> = ({ masterData }) => {
  const [requests, setRequests] = useState<AnnualPartRequest[]>(MOCK_ANNUAL_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSync = async (dataToSync: AnnualPartRequest[] = requests) => {
    if (!masterData?.googleSheetsUrl) {
      alert("Please configure your Google Sheets URL in the Master Data > Cloud Sync tab.");
      return;
    }
    setIsSyncing(true);
    try {
      // Flatten items for easier spreadsheet reading
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
      alert("Annual planning data successfully pushed to Google Sheet!");
    } catch (err) {
      alert("Sync failed. Ensure your script is deployed as a Web App.");
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [['Requested By', 'Store Location', 'Target Year', 'Part ID', 'Quantity', 'Notes']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ['Maintenance Head', 'Central Store A', '2025', 'PRT-001', '250', 'Annual bulk order']]);
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
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const newRequests: AnnualPartRequest[] = (data as any[]).map((row: any) => ({
          id: `ANN-B-${Math.floor(1000 + Math.random() * 9000)}`,
          requestedBy: String(row['Requested By'] || 'User'),
          storeLocation: String(row['Store Location'] || 'Store'),
          requestDate: new Date().toISOString().split('T')[0],
          targetYear: String(row['Target Year'] || '2025'),
          status: 'Pending',
          items: [{ partId: String(row['Part ID'] || ''), quantity: parseInt(row['Quantity']) || 0 }],
          notes: String(row['Notes'] || 'Manual upload')
        }));

        const updated = [...newRequests, ...requests];
        setRequests(updated);
        alert(`Imported ${newRequests.length} forecasting entries.`);
        if (masterData?.googleSheetsUrl) handleSync(updated);
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
        const part = MOCK_PARTS.find(p => p.id === item.partId);
        const partLoc = String(part?.location || '').toLowerCase();
        const targetLoc = String(req.storeLocation || '').toLowerCase();
        const stockInLoc = (partLoc && targetLoc && partLoc.includes(targetLoc)) ? (part?.stock || 0) : 0;
        return {
          requestId: req.id,
          year: req.targetYear,
          status: req.status,
          store: req.storeLocation,
          partId: item.partId,
          partName: part?.name || 'N/A',
          qtyRequested: item.quantity,
          stockInLoc,
          totalStock: part?.stock || 0,
          maxLevel: part?.maxStock || 0,
          unit: part?.unit || 'pcs'
        };
      })
    );
  }, [requests]);

  const filteredItems = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return flattenedItems.filter(item => 
      (item.partName || '').toLowerCase().includes(term) ||
      (item.partId || '').toLowerCase().includes(term)
    );
  }, [flattenedItems, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search planning..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            disabled={isSyncing}
            onClick={() => handleSync()}
            className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? '⏳' : '☁️'} Sync Sheets
          </button>
          <button onClick={downloadTemplate} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold border border-slate-200">📥 Template</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold">📄 Import</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Part ID</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Request</th>
                <th className="px-6 py-4">In Store</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Max</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={`${item.requestId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4"><span className="text-[10px] font-mono font-black bg-slate-100 px-2 py-1 rounded">{item.partId}</span></td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.partName}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.requestId} • {item.year}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-blue-600">{item.qtyRequested} {item.unit}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.stockInLoc}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.totalStock}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.maxLevel}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnnualRequests;
