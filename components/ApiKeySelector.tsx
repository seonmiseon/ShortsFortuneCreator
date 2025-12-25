
import React, { useState, useEffect } from 'react';

interface ApiKeySelectorProps {
  onKeyValidated: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeyValidated }) => {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = () => {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored) {
      setApiKey(stored);
      setHasKey(true);
      // Set it globally for the service to use
      (window as any).GEMINI_API_KEY = stored;
      onKeyValidated();
    }
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
      (window as any).GEMINI_API_KEY = apiKey.trim();
      setHasKey(true);
      setIsEditing(false);
      onKeyValidated();
      alert('API 키가 저장되었습니다!');
    } else {
      alert('API 키를 입력해주세요.');
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
          href="https://aistudio.google.com/apikey"
          target="_blank"
          className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
        >
          결제 문서 확인 <i className="fas fa-external-link-alt"></i>
        </a>
      </div>

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={isEditing ? "text" : "password"}
            value={isEditing ? apiKey : (hasKey ? "************************" : "")}
            onChange={(e) => setApiKey(e.target.value)}
            onFocus={() => setIsEditing(true)}
            placeholder="AIza로 시작하는 API 키를 입력하세요"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-slate-300 text-xs focus:outline-none focus:border-yellow-500"
          />
        </div>
        <button
          onClick={handleSaveKey}
          className="bg-red-600 hover:bg-red-500 transition-colors px-5 py-3 rounded-xl font-bold text-xs text-white shadow-lg whitespace-nowrap"
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default ApiKeySelector;
