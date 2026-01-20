
import React, { useState } from 'react';
import { MOCK_PART_REQUESTS, MOCK_PARTS, MOCK_ASSETS, MOCK_WORK_ORDERS } from '../constants';
import { PartRequest, RequestStatus } from '../types';

const PartsRequests: React.FC = () => {
  const [requests, setRequests] = useState<PartRequest[]>(MOCK_PART_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    assetId: '',
    workOrderId: '',
    requestedBy: 'John Doe',
    notes: '',
    items: [{ partId: '', quantity: 1 }]
  });

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
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    ));
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `REQ-${Math.floor(500 + Math.random() * 500)}`;
    const freshRequest: PartRequest = {
      id,
      ...newRequest,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      items: newRequest.items.filter(i => i.partId && i.quantity > 0)
    };
    setRequests([freshRequest, ...requests]);
    setIsModalOpen(false);
    setNewRequest({
        assetId: '',
        workOrderId: '',
        requestedBy: 'John Doe',
        notes: '',
        items: [{ partId: '', quantity: 1 }]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Store Requisitions</h3>
          <p className="text-slate-500 text-sm">Manage parts allocation for maintenance operations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-500/20 hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <span>📋</span> Create New Request
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.map((req) => {
          const asset = MOCK_ASSETS.find(a => a.id === req.assetId);
          return (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl">📦</div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-slate-900 uppercase">{req.id}</h4>
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyles(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      Requested by {req.requestedBy} • {req.requestDate}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {req.status === 'Pending' && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(req.id, 'Approved')}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-all"
                      >
                        Approve
                      </button>
                      <button 
                         onClick={() => handleStatusChange(req.id, 'Cancelled')}
                        className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {req.status === 'Approved' && (
                    <button 
                       onClick={() => handleStatusChange(req.id, 'Issued')}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all"
                    >
                      Mark as Issued
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Requested Items</h5>
                  <div className="space-y-2">
                    {req.items.map((item, idx) => {
                      const part = MOCK_PARTS.find(p => p.id === item.partId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <div className="text-sm font-bold text-slate-900">{part?.name || 'Unknown Part'}</div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase">{item.partId}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-blue-600">x{item.quantity}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{part?.unit}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Reference</h5>
                   <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="text-slate-400">Asset:</span>
                        <span className="text-slate-900">{asset?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="text-slate-400">Work Order:</span>
                        <span className="text-slate-900">{req.workOrderId || 'General Request'}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-200/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Technician Notes:</span>
                        <p className="text-[11px] text-slate-600 italic leading-relaxed">"{req.notes || 'No notes provided.'}"</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">New Requisition</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset</label>
                  <select 
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none"
                    value={newRequest.assetId}
                    onChange={e => setNewRequest({...newRequest, assetId: e.target.value})}
                  >
                    <option value="">Select Asset</option>
                    {MOCK_ASSETS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Work Order ID</label>
                   <select 
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none"
                    value={newRequest.workOrderId}
                    onChange={e => setNewRequest({...newRequest, workOrderId: e.target.value})}
                  >
                    <option value="">N/A (General)</option>
                    {MOCK_WORK_ORDERS.map(w => <option key={w.id} value={w.id}>{w.id} - {w.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Request Items</label>
                {newRequest.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select 
                      required
                      className="flex-1 p-2.5 border border-slate-200 rounded-lg text-sm outline-none"
                      value={item.partId}
                      onChange={e => {
                        const updated = [...newRequest.items];
                        updated[idx].partId = e.target.value;
                        setNewRequest({...newRequest, items: updated});
                      }}
                    >
                      <option value="">Select Part from Store</option>
                      {MOCK_PARTS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} available)</option>)}
                    </select>
                    <input 
                      type="number" 
                      min="1"
                      className="w-24 p-2.5 border border-slate-200 rounded-lg text-sm outline-none"
                      value={item.quantity}
                      onChange={e => {
                        const updated = [...newRequest.items];
                        updated[idx].quantity = parseInt(e.target.value);
                        setNewRequest({...newRequest, items: updated});
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Technician Notes</label>
                <textarea 
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm h-24 resize-none outline-none"
                  placeholder="Reason for requisition..."
                  value={newRequest.notes}
                  onChange={e => setNewRequest({...newRequest, notes: e.target.value})}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 text-sm">Submit Requisition</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsRequests;
