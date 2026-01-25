
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS, MOCK_PART_REQUESTS, MOCK_ANNUAL_REQUESTS } from '../constants';
import { WorkOrder, WorkOrderStatus, MasterData, PagePermissions, ApprovalEntry, PartRequest, AnnualPartRequest, RequestStatus, Part } from '../types';

interface ApprovalsProps {
  masterData: MasterData;
  permissions: PagePermissions;
}

const REVIEW_PHASES: WorkOrderStatus[] = ['MR Generated', 'Manager Review', 'Closing'];
type ApprovalTab = 'work-orders' | 'requisitions' | 'annual-planning';

const Approvals: React.FC<ApprovalsProps> = ({ masterData, permissions }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('mx_workorders');
    return saved ? JSON.parse(saved) : MOCK_WORK_ORDERS;
  });

  const [partRequests, setPartRequests] = useState<PartRequest[]>(() => {
    const saved = localStorage.getItem('mx_requests');
    return saved ? JSON.parse(saved) : MOCK_PART_REQUESTS;
  });

  const [annualRequests, setAnnualRequests] = useState<AnnualPartRequest[]>(() => {
    const saved = localStorage.getItem('mx_annual');
    return saved ? JSON.parse(saved) : MOCK_ANNUAL_REQUESTS;
  });

  const [inventory, setInventory] = useState<Part[]>(() => {
    const saved = localStorage.getItem('mx_inventory');
    return saved ? JSON.parse(saved) : masterData.parts;
  });

  const [activeTab, setActiveTab] = useState<ApprovalTab>('work-orders');
  const [rejectionModal, setRejectionModal] = useState<{ id: string; type: 'wo' | 'req' | 'annual'; targetStatus: any } | null>(null);
  const [rejectionText, setRejectionText] = useState('');

  useEffect(() => {
    localStorage.setItem('mx_workorders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('mx_requests', JSON.stringify(partRequests));
  }, [partRequests]);

  useEffect(() => {
    localStorage.setItem('mx_annual', JSON.stringify(annualRequests));
  }, [annualRequests]);

  const woQueue = workOrders.filter(wo => REVIEW_PHASES.includes(wo.status));
  const reqQueue = partRequests.filter(req => req.status === 'Pending');
  const annualQueue = annualRequests.filter(req => req.status === 'Pending' || !req.status);

  // Helper to get stock information for a specific part and location
  const getStockMetrics = (partId: string, targetStore?: string) => {
    const allInstances = inventory.filter(p => p.id === partId);
    const globalStock = allInstances.reduce((sum, p) => sum + (p.stock || 0), 0);
    
    let localStock = 0;
    if (targetStore) {
      const normalizedTarget = targetStore.toLowerCase();
      const localInstance = allInstances.find(p => 
        p.location.toLowerCase().includes(normalizedTarget) || 
        normalizedTarget.includes(p.location.toLowerCase())
      );
      localStock = localInstance ? localInstance.stock : 0;
    } else {
      // If no target store, assume first instance or 0
      localStock = allInstances[0]?.stock || 0;
    }

    return { globalStock, localStock };
  };

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

  const handleApproveAnnual = (reqId: string) => {
    if (!permissions.edit) return;
    setAnnualRequests(prev => prev.map(req => 
      req.id === reqId ? { ...req, status: 'Approved' } : req
    ));
  };

  const handleOpenRejection = (id: string, type: 'wo' | 'req' | 'annual', target: any) => {
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
    } else if (rejectionModal.type === 'req') {
      setPartRequests(prev => prev.map(req => 
        req.id === rejectionModal.id ? { ...req, status: 'Cancelled', notes: rejectionText } : req
      ));
    } else {
      setAnnualRequests(prev => prev.map(req => 
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
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-6">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20 shrink-0">⚖️</div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Manager Review Hub</h2>
              <p className="text-slate-400 text-sm max-w-lg">Central control for maintenance workflows, material release, and strategic annual forecasting.</p>
            </div>
          </div>
          <div className="flex bg-slate-800 p-1.5 rounded-[1.5rem] border border-slate-700 w-full xl:w-auto">
            <button 
              onClick={() => setActiveTab('work-orders')}
              className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'work-orders' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Work Orders ({woQueue.length})
            </button>
            <button 
              onClick={() => setActiveTab('requisitions')}
              className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requisitions' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Material ({reqQueue.length})
            </button>
            <button 
              onClick={() => setActiveTab('annual-planning')}
              className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'annual-planning' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Planning ({annualQueue.length})
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
             <EmptyState icon="✨" title="Work Order Queue Clear" desc="All maintenance tasks have been reviewed." />
          )
        ) : activeTab === 'requisitions' ? (
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

                    <div className="space-y-4 mb-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Material Validation</h4>
                      {req.items.map((item, idx) => {
                        const part = masterData.parts.find(p => p.id === item.partId);
                        const { globalStock, localStock } = getStockMetrics(item.partId, part?.location);
                        
                        return (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group/item">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-black text-slate-900 uppercase leading-tight">{part?.name || item.partId}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.partId}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase block">Planning QTY</span>
                                <span className="text-xl font-black text-blue-600">x{item.quantity}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60">
                              <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Local Store</span>
                                <span className={`text-xs font-black ${localStock < item.quantity ? 'text-red-500' : 'text-slate-700'}`}>
                                  {localStock}
                                </span>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase">All Stores</span>
                                <span className="text-xs font-black text-blue-600">{globalStock}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
            <EmptyState icon="📦" title="Material Queue Clear" desc="No pending store release requests." />
          )
        ) : (
          annualQueue.length > 0 ? (
            annualQueue.map(req => (
              <div key={req.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full hover:shadow-xl transition-all border-l-[12px] border-l-indigo-600">
                <div className="p-8 flex-1">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1 block">Annual Forecast Cycle</span>
                        <h3 className="text-2xl font-black text-slate-900 uppercase leading-none">{req.targetYear} Planning</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">ID: {req.id} • Target Store: {req.storeLocation}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
                       <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Forecast Logic</span>
                       <p className="text-xs text-slate-700 italic">"{req.notes || 'Strategic procurement for upcoming fiscal year.'}"</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Line Item Breakdown</h4>
                      {req.items.map((item, idx) => {
                        const part = masterData.parts.find(p => p.id === item.partId);
                        const { globalStock, localStock } = getStockMetrics(item.partId, req.storeLocation);
                        
                        return (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-black text-slate-900 uppercase leading-tight">{part?.name || item.partId}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5">{item.partId}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase block">Planning QTY</span>
                                <span className="text-xl font-black text-indigo-600">x{item.quantity}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60">
                              <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Target Store</span>
                                <span className="text-xs font-black text-slate-700">{localStock}</span>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase">All Stores</span>
                                <span className="text-xs font-black text-indigo-600">{globalStock}</span>
                              </div>
                            </div>
                            <div className="mt-2 text-right">
                               <p className="text-[9px] font-black text-slate-400 uppercase">EST. COST: ${(item.quantity * (part?.cost || 0)).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button 
                      onClick={() => handleOpenRejection(req.id, 'annual', 'Cancelled')}
                      className="flex-1 py-4 bg-white border border-slate-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors shadow-sm"
                    >
                      Reject Forecast
                    </button>
                    <button 
                      onClick={() => handleApproveAnnual(req.id)}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                    >
                      Sanction Budget
                    </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon="📅" title="Planning Clear" desc="Annual forecasts for the next cycle are complete." />
          )
        )}
      </div>

      {/* Unified Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 uppercase">
                {rejectionModal.type === 'wo' ? 'Rework Cycle Triggered' : 
                 rejectionModal.type === 'req' ? 'Reject Material Request' : 'Reject Planning Entry'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">Specify your reasoning for this decision.</p>
            </div>
            <div className="p-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Comments / Instructions</label>
              <textarea
                className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm outline-none focus:border-red-500 transition-colors placeholder:text-slate-300 resize-none leading-relaxed"
                placeholder="Provide detailed feedback for the requestor..."
                value={rejectionText}
                onChange={e => setRejectionText(e.target.value)}
              />
            </div>
            <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
              <button onClick={() => setRejectionModal(null)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={submitRejection} disabled={!rejectionText.trim()} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 disabled:opacity-50">
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="lg:col-span-2 py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-40 text-center">
    <span className="text-6xl mb-4">{icon}</span>
    <p className="text-xl font-black text-slate-900 uppercase">{title}</p>
    <p className="text-slate-500">{desc}</p>
  </div>
);

export default Approvals;
