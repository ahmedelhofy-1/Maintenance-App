import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_PART_REQUESTS, MOCK_PARTS, MOCK_ASSETS, MOCK_WORK_ORDERS } from '../constants';
import { PartRequest, RequestStatus, MasterData } from '../types';
import { syncToGoogleSheets } from '../services/syncService';

interface PartsRequestsProps {
  masterData: MasterData;
}

const PartsRequests: React.FC<PartsRequestsProps> = ({ masterData }) => {
  const [requests, setRequests] = useState<PartRequest[]>(MOCK_PART_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newRequest, setNewRequest] = useState({
    assetId: '',
    workOrderId: '',
    requestedBy: 'John Doe',
    notes: '',
    items: [{ partId: '', quantity: 1 }]
  });

  const handleSync = async (dataToSync: PartRequest[] = requests) => {
    if (!masterData.googleSheetsUrl) {
      alert("Configure Google Sheets URL in Master Data tab.");
      return;
    }
    setIsSyncing(true);
    try {
      // Flatten parts for the spreadsheet
      const flattened = dataToSync.flatMap(req => 
        req.items.map(item => ({
          request_id: req.id,
          date: req.requestDate,
          requested_by: req.requestedBy,
          asset_id: req.assetId,
          status: req.status,
          part_id: item.partId,
          quantity: item.quantity,
          notes: req.notes || ''
        }))
      );
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'PartsRequests', flattened);
      alert("Requisition data pushed to Sheets!");
    } catch (err) {
      alert("Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusStyles = (status: RequestStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Issued': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
    const updated = requests.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    );
    setRequests(updated);
    if (masterData.googleSheetsUrl) handleSync(updated);
  };

  const downloadTemplate = () => {
    const headers = [['Asset ID', 'Work Order ID', 'Requested By', 'Part ID', 'Quantity', 'Notes']];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ['AST-001', 'WO-101', 'John Doe', 'PRT-001', '2', 'Needed for repair']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Requests Template");
    XLSX.writeFile(wb, "MaintenX_Parts_Request_Template.xlsx");
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

        const newReqs: PartRequest[] = (data as any[]).map((row: any) => ({
          id: `REQ-B-${Math.floor(Math.random() * 9999)}`,
          assetId: String(row['Asset ID'] || ''),
          workOrderId: String(row['Work Order ID'] || ''),
          requestedBy: String(row['Requested By'] || 'Import'),
          requestDate: new Date().toISOString().split('T')[0],
          status: 'Pending',
          items: [{ partId: String(row['Part ID'] || ''), quantity: parseInt(row['Quantity']) || 1 }],
          notes: String(row['Notes'] || '')
        }));

        const updated = [...newReqs, ...requests];
        setRequests(updated);
        if (masterData.googleSheetsUrl) handleSync(updated);
      } catch (err) { alert("Import failed."); }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Store Requisitions</h3>
          <p className="text-slate-500 text-sm">Manage parts allocation for maintenance operations.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            disabled={isSyncing}
            onClick={() => handleSync()}
            className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? '⏳ Syncing...' : '☁️ Sync Sheets'}
          </button>
          <button onClick={downloadTemplate} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold border border-slate-200">📥 Template</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold">📄 Bulk Upload</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold">+ New Request</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => {
          const asset = MOCK_ASSETS.find(a => a.id === req.assetId);
          return (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase">{req.id} <span className={`ml-2 px-3 py-0.5 rounded-full text-[10px] border ${getStatusStyles(req.status)}`}>{req.status}</span></h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{req.requestedBy} • {req.requestDate}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {req.status === 'Pending' && (
                    <>
                      <button onClick={() => handleStatusChange(req.id, 'Approved')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase">Approve</button>
                      <button onClick={() => handleStatusChange(req.id, 'Cancelled')} className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Items</span>
                  {req.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm font-bold">
                      <span>{MOCK_PARTS.find(p => p.id === item.partId)?.name || item.partId}</span>
                      <span className="text-blue-600">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target</span>
                  <p className="text-xs font-bold text-slate-900">Asset: {asset?.name || 'N/A'}</p>
                  <p className="text-xs text-slate-500 italic">"{req.notes || 'No notes'}"</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PartsRequests;