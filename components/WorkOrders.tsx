
import React from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS } from '../constants';
import { Priority, WorkOrderStatus } from '../types';

const WorkOrders: React.FC = () => {
  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'Medium': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Low': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getStatusStyles = (status: WorkOrderStatus) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50';
      case 'In Progress': return 'text-blue-600 bg-blue-50';
      case 'Pending': return 'text-amber-600 bg-amber-50';
      case 'On Hold': return 'text-slate-600 bg-slate-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Work Order</th>
                <th className="px-6 py-4">Asset Information</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Assigned Engineer</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_WORK_ORDERS.map((wo) => {
                const asset = MOCK_ASSETS.find(a => a.id === wo.assetId);
                return (
                  <tr key={wo.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{wo.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{wo.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800 font-semibold">{asset?.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span>📍</span> {asset?.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyles(wo.status)}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase ${getPriorityStyles(wo.priority)}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                          {wo.assignedTo.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-600 font-medium">{wo.assignedTo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{wo.dueDate}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {MOCK_WORK_ORDERS.length === 0 && (
          <div className="py-20 text-center text-slate-500">
            <p className="text-4xl mb-2">📋</p>
            <p className="font-medium">No active work orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrders;
