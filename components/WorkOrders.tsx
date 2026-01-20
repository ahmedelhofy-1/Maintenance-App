
import React, { useState } from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS } from '../constants';
import { WorkOrder, WorkOrderStatus, MaintenanceType, Priority } from '../types';

const WORKFLOW_STEPS: { id: WorkOrderStatus; label: string; icon: string }[] = [
  { id: 'Logged', label: 'Logged', icon: '📝' },
  { id: 'Prioritized', label: 'Prioritize', icon: '⚖️' },
  { id: 'Maintenance Work', label: 'Maintenance', icon: '🔧' },
  { id: 'Testing', label: 'Verification', icon: '🧪' },
  { id: 'Record Update', label: 'Reporting', icon: '📋' },
  { id: 'Completed', label: 'Operational', icon: '✅' },
];

const WorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const handleNextStep = (woId: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId) {
        const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === wo.status);
        if (currentIndex < WORKFLOW_STEPS.length - 1) {
          const nextStatus = WORKFLOW_STEPS[currentIndex + 1].id;
          return { ...wo, status: nextStatus };
        }
      }
      return wo;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Legend / Info Bar */}
      <div className="flex flex-wrap gap-4 px-4 py-2 bg-slate-100/50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight">
          <span className="text-red-500">⚡</span> Emergency Breakdown: Immediate Action
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-tight">
          <span className="text-amber-500">⚠️</span> Parts Not Available: Trigger Procurement
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workOrders.map((wo) => {
          const asset = MOCK_ASSETS.find(a => a.id === wo.assetId);
          const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.id === wo.status);

          return (
            <div key={wo.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${wo.maintenanceType === 'PM' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {wo.maintenanceType}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-lg uppercase">{wo.title}</h3>
                        {wo.isEmergency && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">EMERGENCY</span>}
                        {!wo.partsAvailable && <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">WAITING PARTS</span>}
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{wo.id} • {asset?.name} • {asset?.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getPriorityStyles(wo.priority)}`}>
                      {wo.priority} Urgency
                    </span>
                    <button 
                      onClick={() => handleNextStep(wo.id)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      Process Next Step →
                    </button>
                  </div>
                </div>

                {/* Workflow Visualization */}
                <div className="relative mb-8">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                  <div className="relative flex justify-between z-10">
                    {WORKFLOW_STEPS.map((step, idx) => {
                      const isActive = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      
                      return (
                        <div key={step.id} className="flex flex-col items-center gap-2 group">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                            isCurrent ? 'bg-blue-600 border-blue-200 text-white scale-110 shadow-lg shadow-blue-500/30' : 
                            isActive ? 'bg-green-500 border-green-100 text-white' : 
                            'bg-white border-slate-100 text-slate-300'
                          }`}>
                            <span className="text-sm">{isActive ? '✓' : step.icon}</span>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider text-center ${
                            isCurrent ? 'text-blue-600' : isActive ? 'text-green-600' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Logic specific to the flowchart */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                   <div className="bg-slate-50 p-4 rounded-2xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phase Action</h4>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                      {wo.status === 'Logged' && "Awaiting Machine ID and Urgency Review."}
                      {wo.status === 'Prioritized' && (wo.maintenanceType === 'PM' ? "Assign Technicians & Allocate Resources." : "Dispatch Team & Arrange Parts.")}
                      {wo.status === 'Maintenance Work' && "Repair, Inspect, Record Details."}
                      {wo.status === 'Testing' && "Perform Safety Checks & Test Run."}
                      {wo.status === 'Record Update' && "Update Maintenance Records & Analyze Failures."}
                      {wo.status === 'Completed' && "Equipment Back in Operation."}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Details</h4>
                    <div className="space-y-1">
                       <p className="text-[11px] font-bold text-slate-600 uppercase">Assigned: <span className="text-slate-900">{wo.assignedTo}</span></p>
                       <p className="text-[11px] font-bold text-slate-600 uppercase">Due: <span className="text-slate-900">{wo.dueDate}</span></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Status</h4>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${wo.isOperational ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                        {wo.isOperational ? 'EQUIPMENT OPERATIONAL' : 'EQUIPMENT DOWN'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {workOrders.length === 0 && (
        <div className="py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
          <p className="text-4xl mb-2">📋</p>
          <p className="font-black uppercase tracking-widest text-sm">No Active Agricultural Workflows</p>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
