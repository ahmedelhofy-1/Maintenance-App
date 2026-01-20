
import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MOCK_ASSETS } from '../constants';
import { Asset, AssetStatus, MasterData } from '../types';

interface AssetsProps {
  masterData: MasterData;
}

const Assets: React.FC<AssetsProps> = ({ masterData }) => {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Update form defaults if master data changes and not editing
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
    const matchesSearch = 
      asset.name.toLowerCase().includes(filter.toLowerCase()) || 
      asset.id.toLowerCase().includes(filter.toLowerCase()) ||
      asset.serialNo.toLowerCase().includes(filter.toLowerCase());
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
            name: row['Asset Name'] || masterData.assetTypes[0],
            department: row['Department'] || masterData.departments[0],
            brand: row['Brand'] || masterData.brands[0],
            model: row['Model'] || 'N/A',
            yearModel: String(row['Year']) || '2025',
            location: row['Location'] || 'Storage',
            status: (row['Status'] as AssetStatus) || 'Operational',
            power: row['Power Rating'] || masterData.powerRatings[0],
            serialNo: row['Serial No'] || `SN-${id}`,
            health: parseInt(row['Health (0-100)']) || 100,
            category: 'Imported',
            lastService: now,
            nextService: new Date(Date.now() + 7776000000).toISOString().split('T')[0],
            imageUrl: `https://picsum.photos/seed/${id}/400/300`
          };
        });

        setAssets(prev => [...newAssetsList, ...prev]);
        alert(`Successfully imported ${newAssetsList.length} assets.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file. Please ensure you use the provided template.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAssetId) {
      setAssets(prev => prev.map(asset => {
        if (asset.id === editingAssetId) {
          return {
            ...asset,
            ...formData,
            imageUrl: formData.imageFile || asset.imageUrl
          };
        }
        return asset;
      }));
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
      setAssets([assetToAdd, ...assets]);
    }

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
            onClick={downloadTemplate}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <span>📥</span> Template
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-500/20 hover:bg-slate-900 transition-all flex items-center gap-2"
          >
            <span>📄</span> Bulk Upload
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleBulkUpload} 
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <span>+</span> Add Asset
          </button>
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
                    <span className="text-slate-400">System Health</span>
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

      {/* Upload/Edit Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingAssetId ? `Edit Asset: ${editingAssetId}` : 'Technical Asset Definition'}
                </h2>
                <p className="text-slate-500 text-xs">
                  {editingAssetId ? 'Modify existing asset specifications.' : 'Choose from dynamic Master Data specifications.'}
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-2xl font-light leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-6">
                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset Definition</label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    >
                      {masterData.assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Department</label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                    >
                      {masterData.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                </div>

                {/* Brand & Model */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset Brand</label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                    >
                      {masterData.brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset Model</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="Enter Model ID"
                      value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Year Model</label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      value={formData.yearModel}
                      onChange={e => setFormData({...formData, yearModel: e.target.value})}
                    >
                      {masterData.years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Serial No (Unique)</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="SN-XXXX-XXXX"
                      value={formData.serialNo}
                      onChange={e => setFormData({...formData, serialNo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Power Rating</label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      value={formData.power}
                      onChange={e => setFormData({...formData, power: e.target.value})}
                    >
                      {masterData.powerRatings.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                {/* Status & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</label>
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})}
                    >
                      <option value="Operational">Operational</option>
                      <option value="Down">Down</option>
                      <option value="In Maintenance">In Maintenance</option>
                      <option value="Restricted">Restricted</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Physical Location</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="e.g. Bay 4, Shelf C"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                {/* Health Override (Only for editing) */}
                {editingAssetId && (
                   <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Health Percentage ({formData.health}%)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      value={formData.health}
                      onChange={e => setFormData({...formData, health: parseInt(e.target.value)})}
                    />
                  </div>
                )}

                {/* Photo Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Asset Photo Evidence</label>
                  <div 
                    className="border-2 border-dashed border-slate-200 rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden"
                    onClick={() => document.getElementById('asset-photo')?.click()}
                  >
                    {formData.imageFile ? (
                      <img src={formData.imageFile} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="text-xl mb-1">📸</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attach Image</span>
                      </>
                    )}
                    <input id="asset-photo" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>

                <div className="pt-2 flex gap-3 sticky bottom-0 bg-white pb-2">
                  <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm">
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
