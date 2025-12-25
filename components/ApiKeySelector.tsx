
import React, { useState, useEffect } from 'react';

interface ApiKeySelectorProps {
  onKeyValidated: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeyValidated }) => {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
      if (selected) onKeyValidated();
    } catch (e) {
      console.error("Error checking API key", e);
    }
  };

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions
      setHasKey(true);
      onKeyValidated();
    } catch (e) {
      console.error("Error opening key selector", e);
    }
  };

  return (
    <div className="w-full bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">🔑</span>
          <span className="font-bold text-sm text-slate-300">Gemini API Key</span>
        </div>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
        >
          결제 문서 확인 <i className="fas fa-external-link-alt"></i>
        </a>
      </div>
      
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input 
            type="password" 
            readOnly 
            value="************************"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-500 text-xs focus:outline-none"
          />
        </div>
        <button 
          onClick={handleSelectKey}
          className="bg-red-600 hover:bg-red-500 transition-colors px-5 py-3 rounded-xl font-bold text-xs text-white shadow-lg whitespace-nowrap"
        >
          {hasKey ? '변경' : '저장'}
        </button>
      </div>
    </div>
  );
};

export default ApiKeySelector;
