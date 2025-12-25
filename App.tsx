
import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppStep } from './types';
import ApiKeySelector from './components/ApiKeySelector';
import { analyzeViralShorts, generateFortuneVideo } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: AppStep.SETUP,
    screenshotBase64: null,
    analysis: null,
    videoUrl: null,
    isGenerating: false,
    statusMessage: ''
  });

  const [editableScript, setEditableScript] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, screenshotBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!state.screenshotBase64) return;
    setState(prev => ({ ...prev, isGenerating: true, statusMessage: '명리학적으로 대본을 분석하고 있습니다...' }));
    try {
      const result = await analyzeViralShorts(state.screenshotBase64);
      setState(prev => ({
        ...prev,
        step: AppStep.ANALYSIS,
        analysis: result,
        isGenerating: false,
        statusMessage: ''
      }));
      setEditableScript(result.suggestedFortuneScript);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("Requested entity was not found.")) {
        alert("API 키가 올바르지 않거나 프로젝트가 존재하지 않습니다. 키를 다시 선택해주세요.");
        window.aistudio.openSelectKey();
      }
      setState(prev => ({ ...prev, isGenerating: false, statusMessage: '분석에 실패했습니다.' }));
    }
  };

  const startVideoGeneration = async () => {
    if (!editableScript) return;
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      step: AppStep.GENERATION,
      videoUrl: null,
      statusMessage: '12지신이 쏟아지는 우주 영상을 빚어내고 있습니다...' 
    }));
    try {
      const videoUrl = await generateFortuneVideo(editableScript);
      setState(prev => ({ 
        ...prev, 
        videoUrl, 
        isGenerating: false, 
        statusMessage: '영상 제작 완료!' 
      }));
    } catch (error: any) {
      console.error(error);
      alert("영상 생성 모델(Veo)에 접근할 수 없습니다. 반드시 '유료 계정'의 API 키를 사용해야 합니다. ai.google.dev에서 결제 수단이 등록된 프로젝트인지 확인해주세요.");
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        statusMessage: '생성 실패. 유료 계정 키인지 확인하세요.' 
      }));
    }
  };

  const handleTTS = () => {
    if (!editableScript) return;
    window.speechSynthesis.cancel();
    
    const utter = new SpeechSynthesisUtterance(editableScript);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.lang === 'ko-KR' || v.lang.startsWith('ko')) && 
      (v.name.includes('Google') || v.name.includes('Yuna') || v.name.includes('여성'))
    ) || voices.find(v => v.lang.startsWith('ko'));

    if (preferredVoice) utter.voice = preferredVoice;
    utter.lang = 'ko-KR';
    utter.rate = 1.05;
    utter.pitch = 1.1;
    
    utter.onend = () => {
      window.confetti({ 
        particleCount: 200, 
        spread: 100, 
        origin: { y: 0.6 }, 
        colors: ['#FFD700', '#FF4500', '#FFFFFF', '#FFA500'] 
      });
    };
    
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
      {state.step === AppStep.SETUP && (
        <div className="w-full max-w-[500px] animate-fadeIn space-y-8">
          <header className="text-center space-y-4 mb-10">
            <div className="text-8xl drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">🪐</div>
            <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 tracking-tighter">쇼츠 명리 마스터</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] opacity-70">Zodiac Fortune Video Backgrounds</p>
          </header>
          
          <div className="glass-panel p-10 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,1)] border border-slate-700/50 space-y-10">
            <ApiKeySelector onKeyValidated={() => {}} />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative border-4 border-dashed rounded-[3rem] aspect-[9/16] w-full max-w-[240px] mx-auto overflow-hidden cursor-pointer border-slate-700 hover:border-yellow-500 transition-all duration-700 bg-slate-900/50 shadow-inner"
            >
              {state.screenshotBase64 ? (
                <img src={state.screenshotBase64} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-6">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-yellow-500/20 transition-all">
                    <i className="fas fa-image text-3xl group-hover:text-yellow-500"></i>
                  </div>
                  <div className="text-center">
                    <span className="block text-[11px] font-black uppercase tracking-widest mb-1">Upload Reference</span>
                    <span className="text-[10px] opacity-50">9:16 비율 숏츠 캡처</span>
                  </div>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            
            <button 
              disabled={!state.screenshotBase64 || state.isGenerating}
              onClick={startAnalysis}
              className="w-full py-7 rounded-[2rem] font-black text-2xl bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-900 text-slate-950 active:scale-95 transition-all shadow-[0_20px_60px_rgba(234,179,8,0.3)] disabled:opacity-30 border border-white/20"
            >
              {state.isGenerating ? <i className="fas fa-dharmachakra fa-spin mr-3"></i> : "기운 분석 및 대본 생성"}
            </button>
          </div>
        </div>
      )}

      {state.step === AppStep.ANALYSIS && state.analysis && (
        <div className="w-full max-w-6xl space-y-10 animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-800/50 pb-10">
            <div className="space-y-4">
              <span className="text-yellow-500 text-[10px] font-black tracking-[0.5em] uppercase">Viral Script Complete</span>
              <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">{state.analysis.suggestedTitle}</h2>
            </div>
            <button onClick={() => setState(prev => ({ ...prev, step: AppStep.SETUP }))} className="px-10 py-4 bg-slate-900/50 hover:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700">
              <i className="fas fa-times mr-2"></i> 닫기
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-4 rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-700/50">
                <img src={state.screenshotBase64!} className="rounded-[3rem] w-full h-auto opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="bg-yellow-500/5 p-8 rounded-[2.5rem] border border-yellow-500/20">
                <h4 className="text-yellow-400 font-black text-[10px] uppercase mb-3 tracking-widest">명리학 비주얼 가이드</h4>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">{state.analysis.visualStyle}</p>
              </div>
            </div>
            
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-900/80 p-12 rounded-[4rem] border border-yellow-500/20 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                <textarea 
                  value={editableScript}
                  onChange={(e) => setEditableScript(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-slate-100 font-bold text-2xl min-h-[500px] outline-none leading-relaxed custom-scrollbar"
                />
              </div>
              
              <button 
                onClick={startVideoGeneration}
                className="w-full py-8 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-900 hover:shadow-[0_0_80px_rgba(234,179,8,0.4)] rounded-[2.5rem] font-black text-3xl text-slate-950 shadow-2xl active:scale-[0.98] transition-all"
              >
                12지신 쏟아지는 배경 영상 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {state.step === AppStep.GENERATION && (
        <div className="w-full max-w-2xl flex flex-col items-center gap-10 animate-fadeIn">
          {state.isGenerating ? (
            <div className="text-center py-28 glass-panel rounded-[5rem] w-full shadow-[0_100px_200px_rgba(0,0,0,1)] border border-slate-700/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent animate-pulse"></div>
              <div className="relative z-10 space-y-12">
                <div className="w-36 h-36 border-[16px] border-slate-800 border-t-yellow-500 rounded-full animate-spin mx-auto shadow-[0_0_100px_rgba(234,179,8,0.2)]"></div>
                <div>
                  <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">{state.statusMessage}</h2>
                  <p className="text-slate-500 font-bold text-[10px] tracking-[0.5em] uppercase">Crafting High-End Mystical Background...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-[6rem] w-full shadow-[0_100px_200px_rgba(0,0,0,1)] space-y-14 relative border border-slate-700/50">
              <header className="text-center">
                <h2 className="text-5xl font-black text-yellow-500 tracking-tighter mb-4">운세 배경 탄생</h2>
                <p className="text-slate-500 text-[10px] font-black tracking-[0.6em] uppercase">Premium Asset Ready</p>
              </header>

              <div className="aspect-[9/16] w-full max-w-[360px] mx-auto rounded-[4rem] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)] ring-[20px] ring-slate-900 border border-white/5 relative bg-slate-950">
                {state.videoUrl ? (
                  <video src={state.videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-red-500 gap-6 p-10 text-center">
                    <i className="fas fa-exclamation-triangle text-6xl"></i>
                    <p className="font-black uppercase text-xs leading-loose">API 권한 문제로 영상 생성에 실패했습니다.<br/>유료 계정 키인지 다시 확인해주세요.</p>
                    <button onClick={startVideoGeneration} className="mt-4 px-8 py-3 bg-slate-800 text-white rounded-full text-[10px] font-black uppercase hover:bg-slate-700 transition-all">다시 시도</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-10">
                <button 
                  onClick={handleTTS} 
                  className="py-12 bg-slate-900/90 hover:bg-slate-800 rounded-[4rem] flex flex-col items-center justify-center gap-5 transition-all active:scale-95 shadow-2xl border border-slate-800"
                >
                  <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]">🎙️</span>
                  <div className="text-center">
                    <span className="font-black text-white text-[11px] uppercase tracking-widest block mb-1">TTS Voice</span>
                    <span className="text-slate-500 text-[10px] font-bold">음성 & 폭죽</span>
                  </div>
                </button>
                <a 
                  href={state.videoUrl || '#'} 
                  download="premium-zodiac-background.mp4" 
                  className="py-12 bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-800 hover:scale-105 rounded-[4rem] flex flex-col items-center justify-center gap-5 transition-all active:scale-95 shadow-2xl border border-white/20"
                >
                  <span className="text-5xl text-white">📥</span>
                  <div className="text-center">
                    <span className="font-black text-slate-950 text-[11px] uppercase tracking-widest block mb-1">Download</span>
                    <span className="text-slate-950/70 text-[10px] font-bold">배경 저장</span>
                  </div>
                </a>
              </div>
              
              <footer className="text-center">
                <p className="text-[12px] text-slate-500 font-bold leading-loose max-w-[400px] mx-auto">
                  💡 명리학적으로 가장 기운이 좋은 '황금 십이지신' 배경입니다. <br/>
                  <b>캡컷(CapCut)</b>에서 위 영상을 불러온 뒤, 생성된 대본을 자막으로 입혀 바이럴 쇼츠를 완성하세요!
                </p>
              </footer>
            </div>
          )}
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(234, 179, 8, 0.8); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
