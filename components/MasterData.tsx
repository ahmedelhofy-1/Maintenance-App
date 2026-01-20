
import React, { useState } from 'react';
import { MasterData } from '../types';

interface MasterDataEditorProps {
  masterData: MasterData;
  onUpdate: (data: MasterData) => void;
}

type CategoryKey = keyof MasterData | 'integration';

const MasterDataEditor: React.FC<MasterDataEditorProps> = ({ masterData, onUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('departments');
  const [newItemValue, setNewItemValue] = useState('');

  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'departments', label: 'Departments', icon: '🏢' },
    { key: 'assetTypes', label: 'Asset Definitions', icon: '🔧' },
    { key: 'brands', label: 'Authorized Brands', icon: '🏷️' },
    { key: 'powerRatings', label: 'Power Standards', icon: '⚡' },
    { key: 'years', label: 'Model Years', icon: '📅' },
    { key: 'integration', label: 'Cloud Sync', icon: '☁️' },
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim() || selectedCategory === 'integration') return;
    
    const categoryData = (masterData as any)[selectedCategory];
    if (Array.isArray(categoryData) && categoryData.includes(newItemValue.trim())) {
      alert("This entry already exists.");
      return;
    }

    const updatedList = [...(categoryData as string[]), newItemValue.trim()].sort();
    onUpdate({
      ...masterData,
      [selectedCategory]: updatedList
    });
    setNewItemValue('');
  };

  const handleRemoveItem = (itemToRemove: string) => {
    if (confirm(`Are you sure you want to remove "${itemToRemove}"?`)) {
      const categoryData = (masterData as any)[selectedCategory];
      if (Array.isArray(categoryData)) {
        const updatedList = categoryData.filter(item => item !== itemToRemove);
        onUpdate({
          ...masterData,
          [selectedCategory]: updatedList
        });
      }
    }
  };

  const handleSyncUrlUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...masterData,
      googleSheetsUrl: e.target.value
    });
  };

  const appsScriptCode = `function doPost(e) {
  var json = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(json.type) || ss.insertSheet(json.type);
  var data = json.payload;
  if (data.length > 0) {
    sheet.clear();
    var headers = Object.keys(data[0]);
    sheet.appendRow(headers);
    data.forEach(function(row) {
      sheet.appendRow(headers.map(function(h) { return row[h]; }));
    });
  }
  return ContentService.createTextOutput("OK");
}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[70vh]">
        <div className="w-full md:w-72 border-r border-slate-100 bg-slate-50/30 p-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 px-2">System Registry</h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  selectedCategory === cat.key 
                    ? 'bg-white shadow-md shadow-slate-200/50 text-blue-600 font-bold border border-slate-100' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              {selectedCategory === 'integration' ? 'Google Sheets Integration' : `Manage ${categories.find(c => c.key === selectedCategory)?.label}`}
            </h2>
            <p className="text-slate-500 text-sm">
              {selectedCategory === 'integration' 
                ? 'Sync your local facility data with a live Google Sheet.' 
                : 'Modify authorized values for the facility registry.'}
            </p>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {selectedCategory === 'integration' ? (
              <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                  <h4 className="text-sm font-black text-blue-900 uppercase mb-4">Step 1: Endpoint Configuration</h4>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Apps Script Web App URL</label>
                  <input 
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full p-4 border border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none font-mono text-xs"
                    value={masterData.googleSheetsUrl || ''}
                    onChange={handleSyncUrlUpdate}
                  />
                  <p className="text-[10px] text-blue-600 mt-2 font-medium italic">Paste the "Web App URL" from your Google Apps Script deployment.</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl text-white">
                  <h4 className="text-sm font-black text-slate-400 uppercase mb-4">Step 2: Sheet Script (Copy/Paste)</h4>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">Open your Google Sheet, go to <b>Extensions > Apps Script</b>, and paste this code:</p>
                  <pre className="bg-black/50 p-4 rounded-xl font-mono text-[10px] overflow-x-auto text-green-400">
                    {appsScriptCode}
                  </pre>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleAddItem} className="mb-8 flex gap-3">
                  <input
                    type="text"
                    placeholder={`Add new entry...`}
                    className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all"
                    value={newItemValue}
                    onChange={(e) => setNewItemValue(e.target.value)}
                  />
                  <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm">Add</button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.isArray((masterData as any)[selectedCategory]) && 
                    ((masterData as any)[selectedCategory] as string[]).map((item) => (
                      <div key={item} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all">
                        <span className="text-sm font-medium text-slate-700">{item}</span>
                        <button onClick={() => handleRemoveItem(item)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all text-lg">&times;</button>
                      </div>
                    ))
                  }
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataEditor;
