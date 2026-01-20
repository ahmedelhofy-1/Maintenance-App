
import React, { useState } from 'react';
import { MasterData } from '../types';

interface MasterDataEditorProps {
  masterData: MasterData;
  onUpdate: (data: MasterData) => void;
}

type CategoryKey = keyof MasterData;

const MasterDataEditor: React.FC<MasterDataEditorProps> = ({ masterData, onUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('departments');
  const [newItemValue, setNewItemValue] = useState('');

  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'departments', label: 'Departments', icon: '🏢' },
    { key: 'assetTypes', label: 'Asset Definitions', icon: '🔧' },
    { key: 'brands', label: 'Authorized Brands', icon: '🏷️' },
    { key: 'powerRatings', label: 'Power Standards', icon: '⚡' },
    { key: 'years', label: 'Model Years', icon: '📅' },
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim()) return;
    
    // Check if duplicate
    if (masterData[selectedCategory].includes(newItemValue.trim())) {
      alert("This entry already exists.");
      return;
    }

    const updatedList = [...masterData[selectedCategory], newItemValue.trim()].sort();
    onUpdate({
      ...masterData,
      [selectedCategory]: updatedList
    });
    setNewItemValue('');
  };

  const handleRemoveItem = (itemToRemove: string) => {
    if (confirm(`Are you sure you want to remove "${itemToRemove}"? This might affect new asset registration.`)) {
      const updatedList = masterData[selectedCategory].filter(item => item !== itemToRemove);
      onUpdate({
        ...masterData,
        [selectedCategory]: updatedList
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[70vh]">
        {/* Categories Sidebar */}
        <div className="w-full md:w-72 border-r border-slate-100 bg-slate-50/30 p-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 px-2">Configuration Lists</h3>
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

        {/* List Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-2xl font-black text-slate-900 mb-1">
              Manage {categories.find(c => c.key === selectedCategory)?.label}
            </h2>
            <p className="text-slate-500 text-sm">
              Add or remove authorized values for the facility registry.
            </p>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            <form onSubmit={handleAddItem} className="mb-8 flex gap-3">
              <input
                type="text"
                placeholder={`Add new ${categories.find(c => c.key === selectedCategory)?.label.toLowerCase()}...`}
                className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
              />
              <button
                type="submit"
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm whitespace-nowrap"
              >
                Add Entry
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {masterData[selectedCategory].map((item) => (
                <div 
                  key={item} 
                  className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all text-lg"
                    title="Remove item"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {masterData[selectedCategory].length === 0 && (
              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No items in this category yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4">
        <span className="text-2xl">💡</span>
        <div className="text-sm text-amber-800">
          <p className="font-bold mb-1">System Note</p>
          <p>Changes made here will immediately update the dropdown lists in the <strong>Asset Registration Form</strong> and <strong>Filtering</strong> menus. Be careful when removing items that are already assigned to existing assets.</p>
        </div>
      </div>
    </div>
  );
};

export default MasterDataEditor;
