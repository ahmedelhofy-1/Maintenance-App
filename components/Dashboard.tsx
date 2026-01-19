
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { MOCK_ASSETS, MOCK_WORK_ORDERS } from '../constants';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Assets', value: MOCK_ASSETS.length, change: '+2', icon: '🏢' },
    { label: 'Active Work Orders', value: MOCK_WORK_ORDERS.length, change: '-1', icon: '📝' },
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
    { name: 'Operational', value: MOCK_ASSETS.filter(a => a.status === 'Operational').length, color: '#10b981' },
    { name: 'Maintenance', value: MOCK_ASSETS.filter(a => a.status === 'In Maintenance').length, color: '#f59e0b' },
    { name: 'Down', value: MOCK_ASSETS.filter(a => a.status === 'Down').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Facility Uptime Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={uptimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[90, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Asset Health Distribution</h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  {item.name}
                </div>
                <span className="font-semibold text-slate-900">{item.value} Assets</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Critical Work Orders</h3>
          <button className="text-blue-600 text-sm font-semibold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Issue</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Assigned</th>
                <th className="px-6 py-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_WORK_ORDERS.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{wo.title}</div>
                    <div className="text-xs text-slate-500">{wo.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {MOCK_ASSETS.find(a => a.id === wo.assetId)?.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      wo.priority === 'Critical' ? 'bg-red-100 text-red-600' : 
                      wo.priority === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{wo.assignedTo}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{wo.dueDate}</td>
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
