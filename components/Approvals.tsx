
import React, { useState, useEffect } from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS, MOCK_PART_REQUESTS } from '../constants';
import { WorkOrder, WorkOrderStatus, MasterData, PagePermissions, ApprovalEntry, PartRequest, RequestStatus } from '../types';

interface ApprovalsProps {
  masterData: MasterData;
  permissions: PagePermissions;
}

const REVIEW_PHASES: WorkOrderStatus[] = ['MR Generated', 'Manager Review', 'Closing'];

const Approvals: React.FC<ApprovalsProps> = ({ masterData, permissions }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('mx_workorders');
    return saved ? JSON.parse(saved) : MOCK_WORK_ORDERS;
  });

  const [partRequests, setPartRequests] = useState<PartRequest[]>(() => {
    const saved = localStorage.getItem('mx_requests');
    return saved ? JSON.parse(saved) : MOCK_PART_REQUESTS;
  });

  const [activeTab, setActiveTab] = useState<'work-orders' | 'requisitions'>('work-orders');
  const [rejectionModal, setRejectionModal] = useState<{ id: string; type: 'wo' | 'req'; targetStatus: any } | null>(null);
  const [rejectionText, setRejectionText] = useState('');

  useEffect(() => {
    localStorage.setItem('mx_workorders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('mx_requests', JSON.stringify(partRequests));
  }, [partRequests]);

  const woQueue = workOrders.filter(wo => REVIEW_PHASES.includes(wo.status));
  const reqQueue = partRequests.filter(req => req.status === 'Pending');

  const handleApproveWO = (woId: string) => {
    if (!permissions.edit) return;
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId) {
        let nextStatus: WorkOrderStatus = wo.status;
        if (wo.status === 'MR Generated') nextStatus = 'Manager Review';
        else if (wo.status === 'Manager Review') nextStatus = 'Parts Planning';
        else if (wo.status === 'Closing') nextStatus = 'Completed';

        return { 
          ...wo, 
          status: nextStatus,
          rejectionNotes: undefined,
          approvalHistory: logApprovalAction(wo, 'Approved')
        };
      }
      return wo;
    }));
  };

  const handleApproveReq = (reqId: string) => {
    if (!permissions.edit) return;
    setPartRequests(prev => prev.map(req => 
      req.id === reqId ? { ...req, status: 'Approved' } : req
    ));
  };

  const handleOpenRejection = (id: string, type: 'wo' | 'req', target: any) => {
    setRejectionModal({ id, type, targetStatus: target });
    setRejectionText('');
  };

  const submitRejection = () => {
    if (!rejectionModal || !rejectionText.trim()) return;

    if (rejectionModal.type === 'wo') {
      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === rejectionModal.id) {
          return { 
            ...wo, 
            status: rejectionModal.targetStatus,
            rejectionNotes: rejectionText,
            approvalHistory: logApprovalAction(wo, 'Rejected', rejectionText)
          };
        }
        return wo;
      }));
    } else {
      setPartRequests(prev => prev.map(req => 
        req.id === rejectionModal.id ? { ...req, status: 'Cancelled', notes: rejectionText } : req
      ));
    }
    
    setRejectionModal(null);
  };

  const logApprovalAction = (wo: WorkOrder, action: 'Approved' | 'Rejected', notes?: string): ApprovalEntry[] => {
    const history = wo.approvalHistory || [];
    return [{
      status: wo.status,
      action,
      by: 'Maintenance Manager',
      date: new Date().toLocaleString(),
      notes
    }, ...history];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">⚖️</div>
          <div className="flex-1">
            <h2 className="text-2xl font-black uppercase tracking-tight">Manager Review Hub</h2>
            <p className="text-slate-400 text-sm">Validating maintenance requests, resource allocations, and quality standards.</p>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
            <button 
              onClick={() => setActiveTab('work-orders')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'work-orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Work Orders ({woQueue.length})
            </button>
            <button 
              onClick={() => setActiveTab('requisitions')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requisitions' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Requisitions ({reqQueue.length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'work-orders' ? (
          woQueue.length > 0 ? (
            woQueue.map(wo => {
              const asset = MOCK_ASSETS.find(a => a.id === wo.assetId);
              return (
                <div key={wo.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full hover:shadow-xl transition-all border-l-[12px] border-l-blue-600">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1 block">Cycle Phase: {wo.status}</span>
                        <h3 className="text-2xl font-black text-slate-900 uppercase leading-none">{wo.title}</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Ticket ID: {wo.id}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          wo.priority === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {wo.priority} Priority
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Asset Context</span>
                        <p className="font-bold text-slate-900 text-sm">{asset?.name || 'N/A'}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{asset?.id}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Requested By</span>
                        <p className="font-bold text-slate-900 text-sm">{wo.assignedTo || 'Unassigned'}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{wo.dueDate}</p>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Evidence Gallery</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {wo.photosAttached && wo.photosAttached.length > 0 ? (
                          wo.photosAttached.map((img, i) => (
                            <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm cursor-zoom-in">
                              <img src={img} className="w-full h-full object-cover" />
                            </div>
                          ))
                        ) : (
                          <div className="w-full h-24 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-[10px] text-slate-400 font-black uppercase">No evidence attached</div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Issue Description</h4>
                      <p className="text-sm text-slate-700 italic leading-relaxed">"{wo.description || 'No description provided.'}"</p>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button 
                      onClick={() => handleOpenRejection(wo.id, 'wo', wo.status === 'Closing' ? 'Execution' : 'MR Generated')}
                      className="flex-1 py-4 bg-white border border-slate-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors shadow-sm"
                    >
                      Return for Rework
                    </button>
                    <button 
                      onClick={() => handleApproveWO(wo.id)}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/20"
                    >
                      Approve & Proceed
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lg:col-span-2 py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-40 text-center">
              <span className="text-6xl mb-4">✨</span>
              <p className="text-xl font-black text-slate-900 uppercase">Work Order Queue Clear</p>
              <p className="text-slate-500">All maintenance tasks have been reviewed.</p>
            </div>
          )
        ) : (
          reqQueue.length > 0 ? (
            reqQueue.map(req => {
              const asset = MOCK_ASSETS.find(a => a.id === req.assetId);
              return (
                <div key={req.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full hover:shadow-xl transition-all border-l-[12px] border-l-amber-500">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1 block">Store Requisition</span>
                        <h3 className="text-2xl font-black text-slate-900 uppercase leading-none">{req.id}</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Mapped to: {req.workOrderId || 'Manual Request'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Target Machine</span>
                        <p className="font-bold text-slate-900 text-sm">{asset?.name || req.assetId}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Requested By</span>
                        <p className="font-bold text-slate-900 text-sm">{req.requestedBy}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Requested Materials</h4>
                      {req.items.map((item, idx) => {
                        const part = masterData.parts.find(p => p.id === item.partId);
                        return (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                              <p className="text-sm font-black text-slate-900">{part?.name || item.partId}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{item.partId}</p>
                            </div>
                            <span className="text-xl font-black text-blue-600">x{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>

                    {req.notes && (
                      <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Requestor Justification</h4>
                        <p className="text-sm text-slate-700 italic leading-relaxed">"{req.notes}"</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button 
                      onClick={() => handleOpenRejection(req.id, 'req', 'Cancelled')}
                      className="flex-1 py-4 bg-white border border-slate-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors shadow-sm"
                    >
                      Reject Request
                    </button>
                    <button 
                      onClick={() => handleApproveReq(req.id)}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/20"
                    >
                      Approve Release
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="lg:col-span-2 py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-40 text-center">
              <span className="text-6xl mb-4">📦</span>
              <p className="text-xl font-black text-slate-900 uppercase">Requisition Queue Clear</p>
              <p className="text-slate-500">No pending store release requests.</p>
            </div>
          )
        )}
      </div>

      {/* Unified Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 uppercase">
                {rejectionModal.type === 'wo' ? 'Rework Cycle Triggered' : 'Reject Material Request'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">Specify your reasoning for this decision.</p>
            </div>
            <div className="p-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Comments / Instructions</label>
              <textarea
                className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm outline-none focus:border-red-500 transition-colors placeholder:text-slate-300 resize-none leading-relaxed"
                placeholder={rejectionModal.type === 'wo' ? "E.g., Missing diagnostic photos for Phase 2..." : "E.g., Part already issued from Sub-store A..."}
                value={rejectionText}
                onChange={e => setRejectionText(e.target.value)}
              />
            </div>
            <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
              <button onClick={() => setRejectionModal(null)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={submitRejection} disabled={!rejectionText.trim()} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 disabled:opacity-50">
                Confirm {rejectionModal.type === 'wo' ? 'Rework' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
