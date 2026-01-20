import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { MOCK_ASSETS, fetchAssetHealthHistory } from '../constants';
import { Asset, AssetStatus, MasterData, PagePermissions } from '../types';

interface AssetsProps {
  masterData: MasterData;
  permissions: PagePermissions;
}

const HealthTrend: React.FC<{ assetId: string, currentHealth: number }> = ({ assetId, currentHealth }) => {
  const [history, setHistory] = useState<{ date: string, score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchAssetHealthHistory(assetId).then(data => {
      if (mounted) {
        setHistory(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [assetId]);

  if (loading) return <div className="h-12 w-full bg-slate-50 animate-pulse rounded-lg" />;
  const trendColor = currentHealth > 80 ? '#22c55e' : currentHealth > 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="h-12 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <YAxis domain={[0, 100]} hide />
          <Line type="monotone" dataKey="score" stroke={trendColor} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Assets: React.FC<AssetsProps> = ({ masterData, permissions }) => {
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('mx_assets');
    return saved ? JSON.parse(saved) : MOCK_ASSETS;
  });

  const [filter, setFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('mx_assets', JSON.stringify(assets));
  }, [assets]);

  const [formData, setFormData] = useState({
    name: '',
    category: masterData.assetTypes[0] || 'General', // Maps to "Asset Definition"
    department: masterData.departments[0] || '',
    brand: masterData.brands[0] || '',
    model: '',
    yearModel: masterData.years[0] || '2025',
    location: '',
    status: 'Operational' as AssetStatus,
    power: masterData.powerRatings[0] || '',
    serialNo: '',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400'
  });

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(filter.toLowerCase()) || 
    asset.id.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusColor = (status: AssetStatus) => {
    switch(status) {
      case 'Operational': return 'bg-green-100 text-green-700';
      case 'Down': return 'bg-red-100 text-red-700';
      case 'In Maintenance': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serialNo) {
      alert("Asset Name and Serial Number are required.");
      return;
    }

    const newAsset: Asset = {
      ...formData,
      id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
      lastService: new Date().toISOString().split('T')[0],
      nextService: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      health: 100,
    };

    setAssets([newAsset, ...assets]);
    setIsModalOpen(false);
    setFormData({
      name: '',
      category: masterData.assetTypes[0] || 'General',
      department: masterData.departments[0] || '',
      brand: masterData.brands[0] || '',
      model: '',
      yearModel: masterData.years[0] || '2025',
      location: '',
      status: 'Operational',
      power: masterData.powerRatings[0] || '',
      serialNo: '',
      imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400'
    });
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!permissions.add) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const newAssets: Asset[] = data.map((row: any) => ({
          id: `AST-${Math.floor(Math.random()*10000)}`,
          name: row['Asset Name'] || 'New Asset',
          department: row['Department'] || 'General',
          brand: row['Brand'] || '',
          model: row['Model'] || '',
          yearModel: String(row['Year'] || '2025'),
          location: row['Location'] || 'Storage',
          status: 'Operational',
          power: row['Power Rating'] || '',
          serialNo: row['Serial No'] || '',
          health: 100,
          category: row['Asset Definition'] || 'General',
          lastService: new Date().toISOString().split('T')[0],
          nextService: new Date().toISOString().split('T')[0],
          imageUrl: `https://picsum.photos/seed/${Math.random()}/400/300`
        }));
        setAssets(prev => [...newAssets, ...prev]);
      } catch (err) { alert("Import failed."); }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = (id: string) => {
    if (!permissions.delete) return;
    if (confirm("Permanently remove this asset?")) {
        setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" placeholder="Search assets..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {permissions.add && (
              <>
                <div className="flex bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-all border-r border-slate-700">📄 Bulk Import</button>
                    <button onClick={() => alert("Template download coming soon")} className="px-3 py-2.5 text-slate-500 hover:text-blue-600 hover:bg-white transition-all text-xs font-black uppercase">📥</button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20">+ Add Asset</button>
              </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map(asset => (
          <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group relative">
            {permissions.delete && (
                <button onClick={() => handleDelete(asset.id)} className="absolute top-4 left-4 z-10 p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500">🗑️</button>
            )}
            <div className="relative h-48">
              <img src={asset.imageUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
              <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-900 text-lg">{asset.name}</h3>
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded uppercase">{asset.id}</span>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-3">{asset.brand} • {asset.model} • {asset.category}</p>
              <div>
                <HealthTrend assetId={asset.id} currentHealth={asset.health} />
                <div className="mt-4 bg-slate-50 p-3 rounded grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-slate-500">
                  <div>SN: <span className="text-slate-900">{asset.serialNo}</span></div>
                  <div>LOC: <span className="text-slate-900">{asset.location}</span></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Register New Asset</h3>
                <p className="text-sm text-slate-500">Enter technical specifications and facility location.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕ Close</button>
            </div>
            
            <form onSubmit={handleAddAsset} className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Identification & Org */}
                <div className="space-y-5">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Identification</h4>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Primary Generator 1"
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset Definition</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Definition...</option>
                      {masterData.assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Department</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="">Select Department...</option>
                      {masterData.departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Location / Zone</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sector B, Hall 4"
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Current Status</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})}
                    >
                      <option value="Operational">Operational</option>
                      <option value="Down">Down (Fault)</option>
                      <option value="In Maintenance">In Maintenance</option>
                      <option value="Restricted">Restricted</option>
                    </select>
                  </div>
                </div>

                {/* Right Column: Technical Specs */}
                <div className="space-y-5">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 mb-4">Technical Specs</h4>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset Brand</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                    >
                      <option value="">Select Brand...</option>
                      {masterData.brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Asset Model</label>
                    <input
                      type="text"
                      placeholder="e.g. MX-500 Turbo"
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Year Model</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.yearModel}
                      onChange={e => setFormData({...formData, yearModel: e.target.value})}
                    >
                      {masterData.years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Power Rating</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.power}
                      onChange={e => setFormData({...formData, power: e.target.value})}
                    >
                      <option value="">Select Power...</option>
                      {masterData.powerRatings.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Serial Number (S/N)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SN-998822"
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                      value={formData.serialNo}
                      onChange={e => setFormData({...formData, serialNo: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Preview Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-slate-50/50"
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-[0.98]"
                >
                  Create Asset Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
