
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS } from '../constants';
import { WorkOrder, WorkOrderStatus, MaintenanceType, Priority, MasterData, PagePermissions, ApprovalEntry, Asset } from '../types';
import { syncToGoogleSheets } from '../services/syncService';

interface WorkOrdersProps {
  masterData: MasterData;
  permissions: PagePermissions;
  setActiveTab?: (tab: string) => void;
}

const WORKFLOW_STEPS: { id: WorkOrderStatus; label: string; icon: string; description: string; isGate: boolean }[] = [
  { id: 'MR Generated', label: 'Generate MR', icon: '🚜', description: 'Log Maintenance Request with Machine ID', isGate: false },
  { id: 'Manager Review', label: 'Manager Review', icon: '👤', description: 'Technical lead must approve scope and priority', isGate: true },
  { id: 'Parts Planning', label: 'Plan Parts', icon: '📦', description: 'Verify inventory or trigger purchase requisitions', isGate: false },
  { id: 'Scheduled', label: 'Assign & Schedule', icon: '📅', description: 'Allocate labor hours and tools', isGate: false },
  { id: 'Execution', label: 'On-Field Execution', icon: '🔧', description: 'Hands-on repair and live logging', isGate: false },
  { id: 'Closing', label: 'Quality Audit', icon: '📊', description: 'Final check before returning asset to production', isGate: true },
  { id: 'Completed', label: 'Finalized', icon: '✅', description: 'Archived for continuous improvement metrics', isGate: false },
];

const WorkOrders: React.FC<WorkOrdersProps> = ({ masterData, permissions, setActiveTab }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('mx_workorders');
    return saved ? JSON.parse(saved) : MOCK_WORK_ORDERS;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [rejectionModal, setRejectionModal] = useState<{ id: string; targetStatus: WorkOrderStatus } | null>(null);
  const [rejectionText, setRejectionText] = useState('');
  
  // New State for Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrderPhotos, setNewOrderPhotos] = useState<string[]>([]);
  const [newOrderData, setNewOrderData] = useState({
    title: '',
    assetId: '',
    priority: 'Medium' as Priority,
    description: '',
    maintenanceType: 'CM' as MaintenanceType
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('mx_workorders', JSON.stringify(workOrders));
  }, [workOrders]);
  
  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const handleSync = async () => {
    if (!masterData.googleSheetsUrl) {
      alert("Please configure your Google Sheets URL in Master Data.");
      return;
    }
    setIsSyncing(true);
    try {
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'WorkOrders', workOrders);
      alert("Work Order data synced successfully.");
    } catch (err) {
      alert("Sync failed. Local data preserved.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderData.title || !newOrderData.assetId) return;

    const wo: WorkOrder = {
      id: `MR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'MR Generated',
      assignedTo: 'Unassigned',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      partsAvailable: false,
      photosAttached: newOrderPhotos,
      ...newOrderData
    };

    const updatedOrders = [wo, ...workOrders];
    setWorkOrders(updatedOrders);
    localStorage.setItem('mx_workorders', JSON.stringify(updatedOrders));
    
    setIsCreateModalOpen(false);
    setNewOrderPhotos([]);
    setNewOrderData({
      title: '',
      assetId: '',
      priority: 'Medium',
      description: '',
      maintenanceType: 'CM'
    });

    // Navigate to Approval Hub as requested
    if (setActiveTab) {
      setActiveTab('approvals');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewOrderPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApprove = (woId: string) => {
    if (!permissions.edit) return;
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId) {
        const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === wo.status);
        if (currentIndex < WORKFLOW_STEPS.length - 1) {
          return { 
            ...wo, 
            status: WORKFLOW_STEPS[currentIndex + 1].id,
            rejectionNotes: undefined,
            approvalHistory: logApprovalAction(wo, 'Approved')
          };
        }
      }
      return wo;
    }));
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

  const handleOpenRejection = (woId: string, target: WorkOrderStatus) => {
    setRejectionModal({ id: woId, targetStatus: target });
    setRejectionText('');
  };

  const submitRejection = () => {
    if (!rejectionModal || !rejectionText.trim()) return;
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
    setRejectionModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-1">
          <div className="text-3xl">⚙️</div>
          <div>
            <h3 className="text-sm font-black text-blue-800 uppercase tracking-tight">Active Work Stream</h3>
            <p className="text-xs text-blue-700">Lifecycle management for field operations and repairs.</p>
          </div>
        </div>
        <div className="flex gap-2">
            {permissions.add && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all h-fit"
              >
                + Create Request (MR)
              </button>
            )}
            <button 
              disabled={isSyncing}
              onClick={handleSync}
              className="px-4 py-3 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 h-fit"
            >
              {isSyncing ? '⏳' : '☁️'} Sync Cloud
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workOrders.length > 0 ? (
          workOrders.map((wo) => {
            const asset = MOCK_ASSETS.find(a => a.id === wo.assetId);
            const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === wo.status);
            const currentStep = WORKFLOW_STEPS[currentStepIndex];

            return (
              <div key={wo.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-l-[12px] border-l-slate-900">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 p-1">
                          <img src={asset?.imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200'} className="w-full h-full object-cover rounded-xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-lg uppercase leading-tight">{wo.title}</h3>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                          Ref: {wo.id} • {asset?.name} ({asset?.id})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        {permissions.edit && wo.status !== 'Completed' && (
                          <button 
                            onClick={() => handleApprove(wo.id)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                          >
                            Update Progress →
                          </button>
                        )}
                      </div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getPriorityStyles(wo.priority)}`}>
                        {wo.priority} Priority
                      </span>
                    </div>
                  </div>

                  {/* Workflow Progress */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-8">
                      {WORKFLOW_STEPS.map((step, idx) => {
                        const isPast = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        return (
                          <div key={step.id} className={`relative p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                              isCurrent ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105 z-10' : 
                              isPast ? 'bg-green-50 border-green-200 text-green-700' : 
                              'bg-slate-50 border-slate-100 text-slate-300 opacity-60'
                          }`}>
                              <span className="text-lg mb-1">{step.icon}</span>
                              <span className="text-[8px] font-black uppercase tracking-tighter leading-tight">{step.label}</span>
                          </div>
                        )
                      })}
                  </div>

                  {/* Cycle Status, Details & ATTACHMENTS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> Evidence / Photos
                      </h4>
                      <div className="flex-1">
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                           {wo.photosAttached && wo.photosAttached.length > 0 ? (
                             wo.photosAttached.map((img, i) => (
                               <div key={i} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                 <img src={img} className="w-full h-full object-cover" onClick={() => window.open(img, '_blank')} />
                               </div>
                             ))
                           ) : (
                             <div className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                               No Photos Attached
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resource & Tech Data</h4>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Technician</span>
                              <span className="text-xs font-black text-slate-900">{wo.assignedTo}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Parts Status</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${wo.partsAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {wo.partsAvailable ? 'Ready' : 'Planning'}
                              </span>
                          </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-2xl text-white">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Audit Trail</h4>
                      <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar">
                        {wo.approvalHistory && wo.approvalHistory.length > 0 ? (
                          wo.approvalHistory.map((h, i) => (
                            <div key={i} className="text-[9px] border-l border-slate-700 pl-2 py-1">
                                <span className={`font-black ${h.action === 'Approved' ? 'text-green-400' : 'text-red-400'}`}>
                                  {h.action}
                                </span> • {h.status}
                                <div className="text-slate-500">{h.date}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[9px] text-slate-500 italic">No cycles recorded.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 opacity-40">
            <span className="text-5xl block mb-4">📋</span>
            <p className="font-bold text-slate-800 uppercase">No active work orders</p>
          </div>
        )}
      </div>

      {/* CREATE WORK ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase">New Maintenance Request</h3>
                  <p className="text-sm text-slate-500">Log issue, select asset, and attach evidence photos.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
             </div>
             
             <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Request Title</label>
                        <input 
                          type="text" required placeholder="E.g., Engine Noisy" 
                          className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                          value={newOrderData.title}
                          onChange={e => setNewOrderData({...newOrderData, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset ID / Machine</label>
                        <select 
                          required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                          value={newOrderData.assetId}
                          onChange={e => setNewOrderData({...newOrderData, assetId: e.target.value})}
                        >
                          <option value="">Select Asset...</option>
                          {MOCK_ASSETS.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
                        </select>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Priority</label>
                          <select 
                             className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                             value={newOrderData.priority}
                             onChange={e => setNewOrderData({...newOrderData, priority: e.target.value as Priority})}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Type</label>
                          <select 
                             className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                             value={newOrderData.maintenanceType}
                             onChange={e => setNewOrderData({...newOrderData, maintenanceType: e.target.value as MaintenanceType})}
                          >
                            <option value="CM">Breakdown (CM)</option>
                            <option value="PM">Scheduled (PM)</option>
                          </select>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Attach Evidence Photos</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                         <span className="text-3xl mb-1">📸</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Click to add photo</span>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      
                      <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto">
                        {newOrderPhotos.map((img, i) => (
                          <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                             <img src={img} className="w-full h-full object-cover" />
                             <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setNewOrderPhotos(prev => prev.filter((_, idx) => idx !== i)) }}
                                className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                             >×</button>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Issue Description / Symptoms</label>
                  <textarea 
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none h-24 resize-none"
                    placeholder="Describe specific symptoms, sensor readings, or operational anomalies..."
                    value={newOrderData.description}
                    onChange={e => setNewOrderData({...newOrderData, description: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                   <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20">
                      Submit ERP Maintenance Request
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default WorkOrders;
