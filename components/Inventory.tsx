
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Part, MasterData, PagePermissions } from '../types';
import { syncToGoogleSheets, fetchFromGoogleSheets } from '../services/syncService';
import { downloadTemplate, templates } from '../services/templateService';

interface InventoryProps {
  masterData: MasterData;
  permissions: PagePermissions;
}

const Inventory: React.FC<InventoryProps> = ({ masterData, permissions }) => {
  // Inventory state is now essentially a view of Master Parts but with stock levels that can be synced
  const [parts, setParts] = useState<Part[]>(() => {
    const saved = localStorage.getItem('mx_inventory');
    // Default to MasterData.parts if no inventory saved yet
    return saved ? JSON.parse(saved) : masterData.parts;
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('mx_inventory', JSON.stringify(parts));
  }, [parts]);

  // Reconcile new parts from masterData
  useEffect(() => {
    const inventoryIds = new Set(parts.map(p => p.id));
    const newItems = masterData.parts.filter(p => !inventoryIds.has(p.id));
    if (newItems.length > 0) {
      setParts(prev => [...prev, ...newItems]);
    }
  }, [masterData.parts]);

  const filteredParts = parts.filter(p => 
    String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(p.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStockSum = useMemo(() => {
    return filteredParts.reduce((acc, p) => acc + (p.stock || 0), 0);
  }, [filteredParts]);

  const handleSyncPush = async () => {
    if (!masterData.googleSheetsUrl) {
      alert("Please configure your Google Sheets URL in the Master Data tab.");
      return;
    }
    setIsSyncing(true);
    try {
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'Inventory', parts);
      alert("Inventory pushed to Google Sheets and saved locally!");
    } catch (err) {
      alert("Sync failed. Data is still saved locally.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    if (!masterData.googleSheetsUrl) {
      alert("Please configure your Google Sheets URL in the Master Data tab.");
      return;
    }
    if (!confirm("Pulling from Sheets will overwrite your local inventory levels. Continue?")) return;

    setIsFetching(true);
    try {
      const cloudData = await fetchFromGoogleSheets(masterData.googleSheetsUrl, 'Inventory');
      
      if (Array.isArray(cloudData) && cloudData.length > 0) {
        const mappedParts: Part[] = cloudData.map((item: any) => ({
          id: item.id || item['Part ID'] || `PRT-C-${Math.floor(Math.random()*999)}`,
          name: item.name || item['Part Name'] || 'Unknown Part',
          category: item.category || item['Category'] || 'General',
          stock: parseInt(item.stock || item['Stock Level'] || '0'),
          minStock: parseInt(item.minStock || item['Min Stock Level'] || '0'),
          maxStock: parseInt(item.maxStock || item['Max Stock Level'] || '0'),
          unit: item.unit || item['Unit'] || 'pcs',
          cost: parseFloat(item.cost || item['Unit Cost'] || '0'),
          location: item.location || item['Storage Location'] || 'Storehouse'
        }));
        
        setParts(mappedParts);
        alert(`Successfully imported and saved ${mappedParts.length} items.`);
      } else {
        alert("No data found in the cloud.");
      }
    } catch (err) {
      alert("Pull failed.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleClearInventory = () => {
    if (confirm("This will clear your local inventory tracking. Revert to Master Registry?")) {
      setParts(masterData.parts);
    }
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
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const newParts: Part[] = (data as any[]).map((row: any) => ({
          id: String(row['Part ID'] || row['id'] || `PRT-B-${Math.floor(Math.random() * 9999)}`),
          name: String(row['Part Name'] || row['name'] || 'New Part'),
          category: String(row['Category'] || row['category'] || 'General'),
          stock: parseInt(row['Stock Level'] || row['stock']) || 0,
          minStock: parseInt(row['Min Level Stock'] || row['minStock']) || 0,
          maxStock: parseInt(row['Max Level Stock'] || row['maxStock']) || 0,
          unit: String(row['Unit'] || row['unit'] || 'pcs'),
          cost: parseFloat(row['Unit Cost'] || row['cost']) || 0,
          location: String(row['Storage Location'] || row['location'] || 'Storehouse')
        }));

        setParts(prev => {
          const map = new Map<string, Part>();
          prev.forEach(p => map.set(p.id, p));
          newParts.forEach(p => map.set(p.id, p));
          return Array.from(map.values());
        });
        
        alert(`${newParts.length} inventory updates processed and saved.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) { alert("Failed to parse file."); }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search parts registry..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {permissions.edit && (
            <>
              <button 
                disabled={isSyncing}
                onClick={handleSyncPush}
                className="px-4 py-2.5 bg-[#0F9D58] text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? '⏳ Pushing...' : '☁️ Push to Sheets'}
              </button>
              <button 
                disabled={isFetching}
                onClick={handleSyncPull}
                className="px-4 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isFetching ? '⏳ Pulling...' : '📥 Pull from Sheets'}
              </button>
            </>
          )}
          
          {permissions.add && (
            <div className="flex bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 border-r border-slate-700">📄 Update Stock (XLSX)</button>
              <button 
                onClick={() => downloadTemplate(templates.inventory, 'Inventory_Stock_Update')}
                title="Download Template"
                className="px-3 py-2.5 text-slate-500 hover:text-blue-600 hover:bg-white transition-all text-[10px] font-black uppercase"
              >
                TPL 📥
              </button>
            </div>
          )}

          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} />
          {permissions.delete && (
            <button onClick={handleClearInventory} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">🗑️ Reset</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Part ID</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Max Level</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length > 0 ? (
                <>
                  {filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-slate-600 font-black bg-slate-100 px-2 py-1 rounded">{part.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{part.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{part.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${part.stock <= part.minStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                          <span className="font-black text-slate-900">{part.stock} <span className="text-slate-400 font-bold">{part.unit}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{part.maxStock} {part.unit}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">📍 {part.location}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-400 hover:text-blue-600 cursor-pointer transition-colors">{permissions.edit ? '✏️' : ''}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={2} className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-widest">
                      Inventory Summary:
                    </td>
                    <td colSpan={1} className="px-6 py-4">
                       <span className="text-sm font-black text-blue-600">{totalStockSum.toLocaleString()} total units</span>
                    </td>
                    <td colSpan={3} className="px-6 py-4 text-xs font-bold text-slate-500">
                       ({filteredParts.length} unique SKUs)
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <span className="text-4xl mb-2">📦</span>
                      <p className="text-sm font-bold text-slate-500">Inventory is currently empty.</p>
                      <p className="text-xs text-slate-400">Configure your Master Registry or pull from sheets.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
