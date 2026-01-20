
import React, { useState } from 'react';
import { MasterData } from '../types';
import { syncToGoogleSheets } from '../services/syncService';

interface MasterDataEditorProps {
  masterData: MasterData;
  onUpdate: (data: MasterData) => void;
}

type CategoryKey = keyof MasterData | 'integration';

const MasterDataEditor: React.FC<MasterDataEditorProps> = ({ masterData, onUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('departments');
  const [newItemValue, setNewItemValue] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'departments', label: 'Departments', icon: '🏢' },
    { key: 'assetTypes', label: 'Asset Definitions', icon: '🔧' },
    { key: 'brands', label: 'Authorized Brands', icon: '🏷️' },
    { key: 'powerRatings', label: 'Power Standards', icon: '⚡' },
    { key: 'years', label: 'Model Years', icon: '📅' },
    { key: 'integration', label: 'Cloud Sync', icon: '☁️' },
  ];

  const handleTestConnection = async () => {
    if (!masterData.googleSheetsUrl) {
      alert("Please enter a URL first.");
      return;
    }
    setTestStatus('testing');
    try {
      const testData = [{ status: "Operational", timestamp: new Date().toLocaleString(), message: "Connection Test Successful" }];
      await syncToGoogleSheets(masterData.googleSheetsUrl, 'SystemTest', testData);
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (err) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 5000);
    }
  };

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

  const appsScriptCode = `function doPost(e) {
  // This function is triggered by the MaintenX App
  // DO NOT CLICK "RUN" IN THE SCRIPT EDITOR - it will error with 'postData' undefined
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[75vh]">
        {/* Sidebar Nav */}
        <div className="w-full md:w-72 border-r border-slate-100 bg-slate-50/30 p-4 shrink-0">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 px-2">Configuration</h3>
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

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                {selectedCategory === 'integration' ? 'Cloud Sync Wizard' : `Manage ${categories.find(c => c.key === selectedCategory)?.label}`}
              </h2>
              <p className="text-slate-500 text-sm">
                {selectedCategory === 'integration' 
                  ? 'Connect MaintenX to Google Sheets in 3 simple steps.' 
                  : 'Update authorized facility registry values.'}
              </p>
            </div>
            {selectedCategory === 'integration' && (
              <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                masterData.googleSheetsUrl ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${masterData.googleSheetsUrl ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                {masterData.googleSheetsUrl ? 'Endpoint Configured' : 'Offline'}
              </div>
            )}
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {selectedCategory === 'integration' ? (
              <div className="space-y-12">
                {/* Step 1: Code */}
                <div className="flex gap-6">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black">1</div>
                    <div className="flex-1 w-px bg-slate-200 my-2"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Install Script</h3>
                    <p className="text-xs text-slate-500 mb-4">Open a Google Sheet, go to <b>Extensions > Apps Script</b>, and paste this code:</p>
                    <div className="bg-slate-900 rounded-2xl overflow-hidden group">
                      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Code.gs</span>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(appsScriptCode); alert("Code copied!"); }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-black uppercase"
                        >
                          Copy Code
                        </button>
                      </div>
                      <pre className="p-4 font-mono text-[10px] text-green-400 overflow-x-auto max-h-48 scrollbar-thin">
                        {appsScriptCode}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Step 2: Deploy */}
                <div className="flex gap-6">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black">2</div>
                    <div className="flex-1 w-px bg-slate-200 my-2"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Deploy as Web App</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-black text-blue-800 uppercase mb-3">Settings</h4>
                        <ul className="text-[11px] space-y-2 text-blue-700 font-medium">
                          <li>• <b>Deploy > New Deployment</b></li>
                          <li>• Select Type: <b>Web App</b></li>
                          <li>• Execute as: <b>Me</b></li>
                          <li>• Who has access: <b>Anyone</b></li>
                        </ul>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                        <h4 className="text-[10px] font-black text-amber-800 uppercase mb-3">⚠️ Critical Warning</h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed italic">
                          "Run" in the editor is only for manual debugging. It will always fail with a 'postData' error. <b>Only use the Web App URL generated by deploying.</b>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Connect */}
                <div className="flex gap-6 pb-12">
                  <div className="shrink-0">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black">3</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Connect & Test</h3>
                    <div className="space-y-4">
                      <div className="relative">
                        <input 
                          type="url"
                          placeholder="Paste Web App URL here..."
                          className="w-full p-4 pr-32 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-mono text-xs"
                          value={masterData.googleSheetsUrl || ''}
                          onChange={(e) => onUpdate({ ...masterData, googleSheetsUrl: e.target.value })}
                        />
                        <button 
                          onClick={handleTestConnection}
                          disabled={testStatus === 'testing' || !masterData.googleSheetsUrl}
                          className={`absolute right-2 top-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            testStatus === 'success' ? 'bg-green-500 text-white' :
                            testStatus === 'error' ? 'bg-red-500 text-white' :
                            'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                          }`}
                        >
                          {testStatus === 'testing' ? 'Pinging...' : 
                           testStatus === 'success' ? 'Success! ✅' :
                           testStatus === 'error' ? 'Retry ❌' : 'Test Ping'}
                        </button>
                      </div>
                      {testStatus === 'error' && (
                        <p className="text-[10px] text-red-500 font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                          Could not reach script. Double check that "Who has access" is set to "Anyone" and you have re-deployed with the latest changes.
                        </p>
                      )}
                    </div>
                  </div>
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
                        <button onClick={() => handleRemoveItem(item)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all text-lg leading-none">&times;</button>
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
