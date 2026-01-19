
import React, { useState, useRef } from 'react';
import { troubleshootAsset, analyzeMaintenanceImage } from '../services/geminiService';
import { MOCK_ASSETS } from '../constants';

const AIDiagnostic: React.FC = () => {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [issue, setIssue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset = MOCK_ASSETS.find(a => a.id === selectedAssetId);

  const handleTroubleshoot = async () => {
    if (!issue) return;
    setIsAnalyzing(true);
    const assetType = selectedAsset ? selectedAsset.category : 'General Equipment';
    
    try {
      let analysis = '';
      if (capturedImage) {
        const imgData = capturedImage.split(',')[1];
        analysis = await analyzeMaintenanceImage(imgData, selectedAsset?.name || 'Asset');
      }
      
      const textTroubleshoot = await troubleshootAsset(issue, assetType);
      
      let finalResult = `**AI Recommendation for ${selectedAsset?.name || 'Asset'}:**\n\n${textTroubleshoot}`;
      if (analysis) {
        finalResult += `\n\n---\n\n**Visual Inspection Analysis:**\n${analysis}`;
      }
      
      setResult(finalResult);
    } catch (err) {
      setResult("An error occurred during diagnosis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">🤖</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">AI Troubleshooter</h2>
            <p className="text-slate-500">Get instant diagnostic advice based on equipment manuals and best practices.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Target Asset</label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                <option value="">Select an asset (optional)</option>
                {MOCK_ASSETS.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Describe the Issue</label>
              <textarea
                placeholder="E.g., Strange grinding noise coming from the main motor assembly when starting up..."
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-48 resize-none"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Attachment (Photo of defect)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden group relative"
            >
              {capturedImage ? (
                <>
                  <img src={capturedImage} alt="Defect" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold">
                    Change Photo
                  </div>
                </>
              ) : (
                <>
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📸</span>
                  <span className="text-sm text-slate-500 font-medium">Click to upload photo</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
        </div>

        <button
          onClick={handleTroubleshoot}
          disabled={!issue || isAnalyzing}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
            !issue || isAnalyzing 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Machine Condition...
            </span>
          ) : 'Run AI Diagnostic'}
        </button>
      </div>

      {result && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-slate-900">Analysis Results</h3>
            <button 
              onClick={() => setResult(null)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">
            {result}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-md">
              Create Work Order from Advice
            </button>
            <button className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
              Export Engineering Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDiagnostic;
