import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { MOCK_ASSETS, fetchAssetHealthHistory } from '../constants';
import { Asset, AssetStatus, MasterData } from '../types';
import { syncToGoogleSheets } from '../services/syncService';

interface AssetsProps {
  masterData: MasterData;
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

const Assets: React.FC<AssetsProps> = ({ masterData }) => {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [filter, setFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: masterData.assetTypes[0] || '',
    category: 'Production',
    department: masterData.departments[0] || '',
    brand: masterData.brands[0] || '',
    model: '',
    yearModel: masterData.years[0] || '2025',
    location: '',
    status: 'Operational' as AssetStatus,
    power: masterData.powerRatings[0] || '',
    serialNo: '',
    health: 100,
    imageFile: null as string | null
  });

  const handleSync = async () => {
    if (!masterData.googleSheetsUrl) {
      alert("Configure Google Sheets URL in Master Data.");
      return;
    }
    setIsSyncing(true);
    try {
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'Assets', assets);
      alert("Asset registry synced to cloud!");
    } catch (err) {
      alert("Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          category: 'Imported',
          lastService: new Date().toISOString().split('T')[0],
          nextService: new Date().toISOString().split('T')[0],
          imageUrl: `https://picsum.photos/seed/${Math.random()}/400/300`
        }));
        setAssets([...newAssets, ...assets]);
      } catch (err) { alert("Import failed."); }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `AST-${Math.floor(100 + Math.random() * 900)}`;
    setAssets([{ ...formData, id, lastService: '', nextService: '', imageUrl: formData.imageFile || `https://picsum.photos/seed/${id}/400/300` }, ...assets]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" placeholder="Search assets..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            disabled={isSyncing}
            onClick={handleSync}
            className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? '⏳ Syncing...' : '☁️ Sync Sheets'}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold">📄 Bulk Import</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold">+ Add Asset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map(asset => (
          <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group">
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
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-3">{asset.brand} • {asset.model}</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="text-slate-400">Condition</span>
                    <span className={asset.health > 80 ? 'text-green-600' : 'text-amber-600'}>{asset.health}%</span>
                  </div>
                  <HealthTrend assetId={asset.id} currentHealth={asset.health} />
                </div>
                <div className="bg-slate-50 p-3 rounded grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-slate-500">
                  <div>SN: <span className="text-slate-900">{asset.serialNo}</span></div>
                  <div>LOC: <span className="text-slate-900">{asset.location}</span></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6">
            <h2 className="text-xl font-black mb-6">New Asset Definition</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Name" className="p-2.5 border rounded-lg text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required placeholder="Serial No" className="p-2.5 border rounded-lg text-sm" value={formData.serialNo} onChange={e => setFormData({...formData, serialNo: e.target.value})} />
              </div>
              <input required placeholder="Location" className="w-full p-2.5 border rounded-lg text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-4">Register Asset</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;