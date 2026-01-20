
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { MOCK_ASSETS, MOCK_WORK_ORDERS, MOCK_PARTS } from '../constants';
import { MasterData, Asset, WorkOrder, Part } from '../types';

interface DashboardProps {
  masterData: MasterData;
}

const Dashboard: React.FC<DashboardProps> = ({ masterData }) => {
  // Pull live data from LocalStorage to ensure Dashboard reflects actual app state
  const assets = useMemo(() => {
    const saved = localStorage.getItem('mx_assets');
    return saved ? JSON.parse(saved) as Asset[] : MOCK_ASSETS;
  }, []);

  const workOrders = useMemo(() => {
    const saved = localStorage.getItem('mx_workorders');
    return saved ? JSON.parse(saved) as WorkOrder[] : MOCK_WORK_ORDERS;
  }, []);

  // Use masterData parts for unique count, but potentially Inventory for current stock
  const inventoryParts = useMemo(() => {
    const saved = localStorage.getItem('mx_inventory');
    return saved ? JSON.parse(saved) as Part[] : masterData.parts;
  }, [masterData.parts]);

  const totalStockCount = useMemo(() => {
    return inventoryParts.reduce((acc, p) => acc + (p.stock || 0), 0);
  }, [inventoryParts]);

  const stats = [
    { label: 'Total Assets', value: assets.length, change: '+2', icon: '🏢' },
    { label: 'Active Work Orders', value: workOrders.filter(w => w.status !== 'Completed').length, change: '-1', icon: '📝' },
    { label: 'Total Parts (SKU)', value: masterData.parts.length, change: 'Registry', icon: '🧩' },
    { label: 'Total Parts Count', value: totalStockCount.toLocaleString(), change: 'Stock', icon: '📦' },
    { label: 'System Uptime', value: '98.4%', change: '+0.5%', icon: '⏱️' },
    { label: 'Maintenance Cost', value: '$4.2k', change: '+12%', icon: '💰' },
  ];

  const uptimeData = [
    { name: 'Mon', value: 98 },
    { name: 'Tue', value: 95 },
    { name: 'Wed', value: 99 },
    { name: 'Thu', value: 97 },
    { name: 'Fri', value: 98 },
    { name: 'Sat', value: 100 },
    { name: 'Sun', value: 99 },
  ];

  const statusData = [
    { name: 'Operational', value: assets.filter(a => a.status === 'Operational').length, color: '#10b981' },
    { name: 'Maintenance', value: assets.filter(a => a.status === 'In Maintenance').length, color: '#f59e0b' },
    { name: 'Down', value: assets.filter(a => a.status === 'Down').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" /> Facility Uptime Trends
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={uptimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} domain={[90, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500" /> Asset Health
          </h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold uppercase">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  {item.name}
                </div>
                <span className="text-slate-900">{item.value} Assets</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Priority Work Stream</h3>
          <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline px-3 py-1 rounded-lg hover:bg-blue-50 transition-all">View All Work Orders</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-50">
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4">Machine ID</th>
                <th className="px-6 py-4">Urgency</th>
                <th className="px-6 py-4">Responsible</th>
                <th className="px-6 py-4">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workOrders.slice(0, 5).map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 uppercase text-xs">{wo.title}</div>
                    <div className="text-[10px] font-mono text-slate-400">{wo.id}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">
                    {assets.find(a => a.id === wo.assetId)?.name || wo.assetId}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                      wo.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 
                      wo.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{wo.assignedTo}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-400 font-mono">{wo.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
