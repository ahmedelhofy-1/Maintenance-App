
import React, { useState, useEffect } from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS } from '../constants';
import { WorkOrder, WorkOrderStatus, MaintenanceType, Priority, MasterData, PagePermissions } from '../types';
import { syncToGoogleSheets } from '../services/syncService';

interface WorkOrdersProps {
  masterData: MasterData;
  permissions: PagePermissions;
}

const WORKFLOW_STEPS: { id: WorkOrderStatus; label: string; icon: string; description: string }[] = [
  { id: 'MR Generated', label: 'Generate MR', icon: '🚜', description: 'Log Maintenance Request with Machine ID' },
  { id: 'Manager Review', label: 'Review', icon: '👤', description: 'Supervisor approval or rework cycle' },
  { id: 'Parts Planning', label: 'Plan Parts', icon: '📦', description: 'Check availability / Trigger Requisition' },
  { id: 'Scheduled', label: 'Assign', icon: '📅', description: 'Notify Technician & Reserve Tools' },
  { id: 'Execution', label: 'Execute', icon: '🔧', description: 'Technician work & status updates' },
  { id: 'Closing', label: 'Close WO', icon: '📊', description: 'Log hours, costs & generate report' },
  { id: 'Completed', label: 'Finalized', icon: '✅', description: 'Continuous improvement data logged' },
];

const WorkOrders: React.FC<WorkOrdersProps> = ({ masterData, permissions }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('mx_workorders');
    return saved ? JSON.parse(saved) : MOCK_WORK_ORDERS;
  });

  const [isSyncing, setIsSyncing] = useState(false);

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
      alert("Work Order data synced to Google Sheets and saved locally!");
    } catch (err) {
      alert("Sync failed. Local data remains saved.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNextStep = (woId: string) => {
    if (!permissions.edit) return;
    const updated: WorkOrder[] = workOrders.map((wo): WorkOrder => {
      if (wo.id === woId) {
        const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === wo.status);
        if (currentIndex < WORKFLOW_STEPS.length - 1) {
          const nextStatus = WORKFLOW_STEPS[currentIndex + 1].id;
          return { ...wo, status: nextStatus };
        }
      }
      return wo;
    });
    setWorkOrders(updated);
  };

  const handleRework = (woId: string) => {
    if (!permissions.edit) return;
    const updated: WorkOrder[] = workOrders.map((wo): WorkOrder => {
      if (wo.id === woId) return { ...wo, status: 'MR Generated' };
      return wo;
    });
    setWorkOrders(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 bg-green-50 p-4 rounded-2xl border border-green-100 flex-1">
          <div className="text-3xl">🌾</div>
          <div>
            <h3 className="text-sm font-black text-green-800 uppercase tracking-tight">Agricultural Fleet Operations</h3>
            <p className="text-xs text-green-700">ERP-integrated maintenance workflow for farm equipment.</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
              disabled={isSyncing}
              onClick={handleSync}
              className="px-6 py-3 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 h-fit"
            >
              {isSyncing ? '⏳' : '☁️'} Sync Sheets
            </button>
            {permissions.delete && (
              <button 
                onClick={() => { if(confirm("Clear local workflow history?")) setWorkOrders([]); }}
                className="px-4 py-3 border border-slate-200 text-slate-400 rounded-xl text-sm font-bold"
              >
                🗑️
              </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workOrders.length > 0 ? (
          workOrders.map((wo) => {
            const asset = MOCK_ASSETS.find(a => a.id === wo.assetId);
            const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === wo.status);

            return (
              <div key={wo.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-l-8 border-l-blue-600">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                          <img src={asset?.imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200'} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-lg uppercase leading-tight">{wo.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${wo.maintenanceType === 'PM' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {wo.maintenanceType === 'PM' ? 'Scheduled PM' : 'Breakdown / Fault'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                          ID: {wo.id} • MACHINE: {asset?.id} • LOCATION: {asset?.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getPriorityStyles(wo.priority)}`}>
                        {wo.priority} Urgency
                      </span>
                      <div className="flex gap-2">
                        {wo.status === 'Manager Review' && permissions.edit && (
                          <button 
                            onClick={() => handleRework(wo.id)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors"
                          >
                            Rework Request
                          </button>
                        )}
                        {permissions.edit && (
                          <button 
                            onClick={() => handleNextStep(wo.id)}
                            disabled={wo.status === 'Completed'}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                          >
                            {wo.status === 'Completed' ? 'Closed' : `Process: ${WORKFLOW_STEPS[currentStepIndex + 1]?.label || 'Done'} →`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-8">
                      {WORKFLOW_STEPS.map((step, idx) => {
                        const isPast = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        return (
                          <div key={step.id} className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                              isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 
                              isPast ? 'bg-green-50 border-green-200 text-green-700' : 
                              'bg-slate-50 border-slate-100 text-slate-300 opacity-60'
                          }`}>
                              <span className="text-lg mb-1">{step.icon}</span>
                              <span className="text-[8px] font-black uppercase tracking-tighter leading-tight">{step.label}</span>
                          </div>
                        )
                      })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> Current Step
                      </h4>
                      <p className="text-xs font-bold text-slate-800 mb-2">{WORKFLOW_STEPS[currentStepIndex].description}</p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resource Allocation</h4>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Technician</span>
                              <span className="text-xs font-black text-slate-900">{wo.assignedTo}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Due Date</span>
                              <span className="text-xs font-black text-slate-900">{wo.dueDate}</span>
                          </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-2xl text-white">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Health Status</h4>
                      <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${wo.isOperational ? 'bg-green-500' : 'bg-red-500'}`} />
                           <span className="text-[9px] font-black uppercase tracking-widest">
                              {wo.isOperational ? 'Asset Operational' : 'Asset Shutdown'}
                           </span>
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
    </div>
  );
};

export default WorkOrders;
