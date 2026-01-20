
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_PART_REQUESTS, MOCK_PARTS, MOCK_ASSETS, MOCK_WORK_ORDERS } from '../constants';
import { PartRequest, RequestStatus, MasterData, PagePermissions, WorkOrder, Asset, PartRequestItem } from '../types';
import { syncToGoogleSheets } from '../services/syncService';
import { downloadTemplate, templates } from '../services/templateService';

interface PartsRequestsProps {
  masterData: MasterData;
  permissions: PagePermissions;
}

const PartsRequests: React.FC<PartsRequestsProps> = ({ masterData, permissions }) => {
  const [requests, setRequests] = useState<PartRequest[]>(() => {
    const saved = localStorage.getItem('mx_requests');
    return saved ? JSON.parse(saved) : MOCK_PART_REQUESTS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load active work orders for the dropdown
  const activeWorkOrders = useMemo(() => {
    const saved = localStorage.getItem('mx_workorders');
    const wos: WorkOrder[] = saved ? JSON.parse(saved) : MOCK_WORK_ORDERS;
    return wos.filter(wo => wo.status !== 'Completed');
  }, []);

  const [newRequestForm, setNewRequestForm] = useState({
    workOrderId: '',
    assetId: '',
    requestedBy: 'Maintenance Lead',
    notes: '',
    items: [{ partId: '', quantity: 1 }] as PartRequestItem[]
  });

  useEffect(() => {
    localStorage.setItem('mx_requests', JSON.stringify(requests));
  }, [requests]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestForm.assetId || newRequestForm.items.some(i => !i.partId)) {
      alert("Please complete the request details and select parts.");
      return;
    }

    const request: PartRequest = {
      id: `REQ-${Math.floor(10000 + Math.random() * 90000)}`,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      ...newRequestForm
    };

    setRequests([request, ...requests]);
    setIsModalOpen(false);
    setNewRequestForm({
      workOrderId: '',
      assetId: '',
      requestedBy: 'Maintenance Lead',
      notes: '',
      items: [{ partId: '', quantity: 1 }]
    });
  };

  const handleAddLineItem = () => {
    setNewRequestForm(prev => ({
      ...prev,
      items: [...prev.items, { partId: '', quantity: 1 }]
    }));
  };

  const handleUpdateLineItem = (index: number, field: keyof PartRequestItem, value: any) => {
    const updatedItems = [...newRequestForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewRequestForm({ ...newRequestForm, items: updatedItems });
  };

  const handleRemoveLineItem = (index: number) => {
    if (newRequestForm.items.length === 1) return;
    setNewRequestForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSync = async (dataToSync: PartRequest[] = requests) => {
    if (!masterData.googleSheetsUrl) {
      alert("Configure Google Sheets URL in Master Data tab.");
      return;
    }
    setIsSyncing(true);
    try {
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
      alert("Data synced to Sheets and saved locally!");
    } catch (err) {
      alert("Sync failed, but data is saved locally in your browser.");
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
    if (!permissions.edit) return;
    const updated = requests.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    );
    setRequests(updated);
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

        const newReqs: PartRequest[] = (data as any[]).map((row: any) => ({
          id: `REQ-${Math.floor(1000 + Math.random() * 8999)}`,
          assetId: String(row['Asset ID'] || 'N/A'),
          workOrderId: String(row['Work Order ID'] || ''),
          requestedBy: String(row['Requested By'] || 'Bulk Upload'),
          requestDate: new Date().toISOString().split('T')[0],
          status: 'Pending',
          items: [{ partId: String(row['Part ID'] || ''), quantity: parseInt(row['Quantity']) || 1 }],
          notes: String(row['Notes'] || '')
        }));

        setRequests(prev => [...newReqs, ...prev]);
        alert(`Uploaded and saved ${newReqs.length} requests locally.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) { alert("Import failed."); }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Store Requisitions</h3>
          <p className="text-slate-500 text-sm">Track parts requested for open maintenance work orders.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {permissions.add && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              + Create Requisition
            </button>
          )}
          {permissions.edit && (
            <button 
              disabled={isSyncing}
              onClick={() => handleSync()}
              className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? '⏳ Syncing...' : '☁️ Push to Sheets'}
            </button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.length > 0 ? requests.map((req) => {
          const asset = MOCK_ASSETS.find(a => a.id === req.assetId);
          return (
            <div key={req.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 group hover:border-blue-200 transition-all border-l-[12px] border-l-slate-900">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-3xl border border-slate-100">📦</div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl uppercase flex items-center gap-3">
                      {req.id} 
                      <span className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(req.status)}`}>
                        {req.status}
                      </span>
                    </h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                      Req By: {req.requestedBy} • {req.requestDate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {req.status === 'Pending' && permissions.edit && (
                    <>
                      <button onClick={() => handleStatusChange(req.id, 'Approved')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/10">Approve Request</button>
                      <button onClick={() => handleStatusChange(req.id, 'Cancelled')} className="px-6 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-colors">Discard</button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Line Items ({req.items.length})
                  </h5>
                  <div className="space-y-3">
                    {req.items.map((item, idx) => {
                      const part = masterData.parts.find(p => p.id === item.partId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-sm font-black text-slate-900">{part?.name || item.partId}</p>
                            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tighter">{item.partId}</p>
                          </div>
                          <span className="text-lg font-black text-blue-600">x{item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Maintenance Reference
                    </h5>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Work Order ID</span>
                        <span className="text-xs font-black text-slate-900 font-mono">{req.workOrderId || 'MANUAL REQ'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Target Asset</span>
                        <span className="text-xs font-black text-slate-900 uppercase">{asset?.name || req.assetId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Requestor Notes:</p>
                    <p className="text-sm text-slate-700 italic">"{req.notes || 'No notes attached.'}"</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
           <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 opacity-40">
            <span className="text-6xl block mb-4">📥</span>
            <p className="text-xl font-black text-slate-900 uppercase">No parts requisitions in queue.</p>
            <p className="text-slate-500 mt-1">Requisitions will appear here when technicians request materials.</p>
          </div>
        )}
      </div>

      {/* CREATE REQUISITION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Parts Request</h3>
                <p className="text-sm text-slate-500">Attach materials to an open maintenance work order.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Work Order Link</label>
                  <select 
                    required 
                    className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 bg-slate-50"
                    value={newRequestForm.workOrderId}
                    onChange={e => {
                      const selectedWO = activeWorkOrders.find(wo => wo.id === e.target.value);
                      setNewRequestForm({
                        ...newRequestForm, 
                        workOrderId: e.target.value,
                        assetId: selectedWO?.assetId || ''
                      });
                    }}
                  >
                    <option value="">Select Open Work Order...</option>
                    {activeWorkOrders.map(wo => (
                      <option key={wo.id} value={wo.id}>{wo.id} - {wo.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset Mapping</label>
                  <input 
                    type="text" 
                    readOnly
                    placeholder="Auto-linked from WO"
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-100 outline-none text-slate-500 font-bold"
                    value={newRequestForm.assetId ? `${MOCK_ASSETS.find(a => a.id === newRequestForm.assetId)?.name || newRequestForm.assetId}` : ''}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requisition Items</label>
                   <button 
                     type="button" 
                     onClick={handleAddLineItem}
                     className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                   >
                     + Add Item
                   </button>
                </div>
                <div className="space-y-4">
                   {newRequestForm.items.map((item, idx) => (
                     <div key={idx} className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex-1">
                           <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Select Part</label>
                           <select 
                             required
                             className="w-full p-2 border border-slate-200 rounded-xl outline-none text-sm"
                             value={item.partId}
                             onChange={e => handleUpdateLineItem(idx, 'partId', e.target.value)}
                           >
                              <option value="">Choose Part...</option>
                              {masterData.parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                           </select>
                        </div>
                        <div className="w-24">
                           <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Qty</label>
                           <input 
                             type="number" 
                             min="1" 
                             required
                             className="w-full p-2 border border-slate-200 rounded-xl outline-none text-sm"
                             value={item.quantity}
                             onChange={e => handleUpdateLineItem(idx, 'quantity', parseInt(e.target.value))}
                           />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-2 text-slate-300 hover:text-red-500 mb-1"
                        >✕</button>
                     </div>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Internal Notes</label>
                <textarea 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Specify urgency or special handling instructions..."
                  value={newRequestForm.notes}
                  onChange={e => setNewRequestForm({...newRequestForm, notes: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/20 transition-all active:scale-[0.98]"
                >
                  Confirm ERP Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsRequests;
