
import React, { useState } from 'react';
import { MOCK_ASSETS } from '../constants';
import { AssetStatus } from '../types';

const Assets: React.FC = () => {
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredAssets = MOCK_ASSETS.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(filter.toLowerCase()) || 
                         asset.id.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: AssetStatus) => {
    switch(status) {
      case 'Operational': return 'bg-green-100 text-green-700';
      case 'Down': return 'bg-red-100 text-red-700';
      case 'In Maintenance': return 'bg-amber-100 text-amber-700';
      case 'Restricted': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search assets by name or ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Operational', 'Down', 'In Maintenance'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map(asset => (
          <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48">
              <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
              <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{asset.name}</h3>
                <span className="text-xs font-mono text-slate-400">{asset.id}</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">📍 {asset.location}</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-500">Asset Health</span>
                    <span className={`${asset.health > 80 ? 'text-green-600' : asset.health > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {asset.health}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        asset.health > 80 ? 'bg-green-500' : asset.health > 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${asset.health}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 mb-1 uppercase tracking-wider">Last Service</p>
                    <p className="text-slate-700">{asset.lastService}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 mb-1 uppercase tracking-wider">Next Service</p>
                    <p className="text-slate-700">{asset.nextService}</p>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-6 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2 rounded-xl transition-colors text-sm">
                View Maintenance Logs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assets;
