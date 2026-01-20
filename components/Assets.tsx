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
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke={trendColor} 
            strokeWidth={2} 
            dot={false} 
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Assets: React.FC<AssetsProps> = ({ masterData }) => {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
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

  const handleSync = async (dataToSync: Asset[] = assets) => {
    if (!masterData.googleSheetsUrl) {
      alert("Please configure your Google Sheets URL in the Master Data > Cloud Sync tab first.");
      return;
    }
    setIsSyncing(true);
    try {
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'Assets', dataToSync);
      alert("Asset registry successfully pushed to Google Sheet!");
    } catch (err) {
      alert("Sync failed. Ensure your script is deployed as a Web App.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!editingAssetId) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || masterData.assetTypes[0] || '',
        department: prev.department || masterData.departments[0] || '',
        brand: prev.brand || masterData.brands[0] || '',
        power: prev.power || masterData.powerRatings[0] || '',
        yearModel: prev.yearModel || masterData.years[0] || '2025',
      }));
    }
  }, [masterData, editingAssetId]);

  const filteredAssets = assets.filter(asset => {
    const searchTerm = filter.toLowerCase();
    const matchesSearch = 
      String(asset.name || '').toLowerCase().includes(searchTerm) || 
      String(asset.id || '').toLowerCase().includes(searchTerm) ||
      String(asset.serialNo || '').toLowerCase().includes(searchTerm);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageFile: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAssetId(asset.id);
    setFormData({
      name: asset.name,
      category: asset.category,
      department: asset.department,
      brand: asset.brand,
      model: asset.model,
      yearModel: asset.yearModel,
      location: asset.location,
      status: asset.status,
      power: asset.power,
      serialNo: asset.serialNo,
      health: asset.health,
      imageFile: asset.imageUrl || null
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssetId(null);
    setFormData({
      name: masterData.assetTypes[0],
      category: 'Production',
      department: masterData.departments[0],
      brand: masterData.brands[0],
      model: '',
      yearModel: masterData.years[0],
      location: '',
      status: 'Operational',
      power: masterData.powerRatings[0],
      serialNo: '',
      health: 100,
      imageFile: null
    });
  };

  const downloadTemplate = () => {
    const headers = [
      ['Asset Name', 'Department', 'Brand', 'Model', 'Year', 'Location', 'Status', 'Power Rating', 'Serial No', 'Health (0-100)']
    ];
    const example = [
      ['Centrifugal Pump', 'Production', 'Siemens', 'A-100', '2023', 'Zone B', 'Operational', '480V 3-Phase', 'SN-999-XYZ', '100']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets Template");
    XLSX.writeFile(wb, "MaintenX_Asset_Template.xlsx");
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const newAssetsList: Asset[] = data.map((row: any) => {
          const id = `AST-BULK-${Math.floor(1000 + Math.random() * 9000)}`;
          const now = new Date().toISOString().split('T')[0];
          
          return {
            id,
            name: String(row['Asset Name'] || masterData.assetTypes[0]),
            department: String(row['Department'] || masterData.departments[0]),
            brand: String(row['Brand'] || masterData.brands[0]),
            model: String(row['Model'] || 'N/A'),
            yearModel: String(row['Year'] || '2025'),
            location: String(row['Location'] || 'Storage'),
            status: (row['Status'] as AssetStatus) || 'Operational',
            power: String(row['Power Rating'] || masterData.powerRatings[0]),
            serialNo: String(row['Serial No'] || `SN-${id}`),
            health: parseInt(row['Health (0-100)']) || 100,
            category: 'Imported',
            lastService: now,
            nextService: new Date(Date.now() + 7776000000).toISOString().split('T')[0],
            imageUrl: `https://picsum.photos/seed/${id}/400/300`
          };
        });

        const updated = [...newAssetsList, ...assets];
        setAssets(updated);
        alert(`Successfully imported ${newAssetsList.length} assets.`);
        if (masterData.googleSheetsUrl) handleSync(updated);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedAssets = [];
    
    if (editingAssetId) {
      updatedAssets = assets.map(asset => {
        if (asset.id === editingAssetId) {
          return {
            ...asset,
            ...formData,
            imageUrl: formData.imageFile || asset.imageUrl
          };
        }
        return asset;
      });
    } else {
      const id = `AST-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString().split('T')[0];
      
      const assetToAdd: Asset = {
        ...formData,
        id,
        lastService: now,
        nextService: new Date(Date.now() + 7776000000).toISOString().split('T')[0],
        imageUrl: formData.imageFile || `https://picsum.photos/seed/${id}/400/300`
      };
      updatedAssets = [assetToAdd, ...assets];
    }

    setAssets(updatedAssets);
    if (masterData.googleSheetsUrl) handleSync(updatedAssets);
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search by name, ID or Serial No..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            disabled={isSyncing}
            onClick={() => handleSync()}
            className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? '⏳ Syncing...' : '☁️ Sync Sheets'}
          </button>
          <button onClick={downloadTemplate} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold border border-slate-200">📥 Template</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-500/20 transition-all">📄 Bulk Upload</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">+ Add Asset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map(asset => (
          <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="relative h-48">
              <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4">
                 <button 
                  onClick={() => handleEdit(asset)}
                  className="bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
                >
                  <span>✏️</span> Edit Details
                </button>
              </div>
              <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{asset.name}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">{asset.id}</span>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                {asset.brand} • {asset.model}
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                 <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                  <span className="opacity-70">📍</span> {asset.location}
                </p>
                <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                  <span className="opacity-70">🏢</span> {asset.department}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="text-slate-400">Health & History Trend</span>
                    <span className={`${asset.health > 80 ? 'text-green-600' : asset.health > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {asset.health}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        asset.health > 80 ? 'bg-green-500' : asset.health > 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${asset.health}%` }}
                    />
                  </div>
                  <HealthTrend assetId={asset.id} currentHealth={asset.health} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400">
                  <div className="bg-slate-50 p-2 rounded">SN: <span className="text-slate-900">{asset.serialNo}</span></div>
                  <div className="bg-slate-50 p-2 rounded">POWER: <span className="text-slate-900">{asset.power}</span></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingAssetId ? `Edit Asset: ${editingAssetId}` : 'Technical Asset Definition'}
                </h2>
                <p className="text-slate-500 text-xs">Register your industrial facility equipment.</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset Definition</label>
                    <select required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}>
                      {masterData.assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Department</label>
                    <select required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                      {masterData.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset Brand</label>
                    <select required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                      {masterData.brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset Model</label>
                    <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Year Model</label>
                    <select required className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={formData.yearModel} onChange={e => setFormData({...formData, yearModel: e.target.value})}>
                      {masterData.years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex gap-3 sticky bottom-0 bg-white pb-2">
                  <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 text-sm">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all text-sm">
                    {editingAssetId ? 'Update Asset' : 'Register Asset'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;