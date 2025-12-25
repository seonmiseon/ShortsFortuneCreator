import React, { useState, useRef, useEffect } from 'react';
import { AppState, AppStep } from './types';
import ApiKeySelector from './components/ApiKeySelector';
import FortuneViewer from './components/FortuneViewer';
import { analyzeViralShorts } from './services/geminiService';

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
  const [editableTitle, setEditableTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 음성 목록 로드 (TTS용)
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

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
      setEditableTitle(result.suggestedTitle);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("API 키")) {
        alert("API 키가 설정되지 않았습니다. API 키를 먼저 입력해주세요.");
      } else {
        alert(`분석 실패: ${error?.message || '알 수 없는 오류'}`);
      }
      setState(prev => ({ ...prev, isGenerating: false, statusMessage: '' }));
    }
  };

  const goToViewer = () => {
    setState(prev => ({ ...prev, step: AppStep.GENERATION }));
  };

  const handleTTS = () => {
    if (!editableScript) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(editableScript);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      (v.lang === 'ko-KR' || v.lang.startsWith('ko')) &&
      (v.name.includes('Female') || v.name.includes('여성') || v.name.includes('Yuna'))
    ) || voices.find(v => v.lang.startsWith('ko'));

    if (preferredVoice) utter.voice = preferredVoice;
    utter.lang = 'ko-KR';
    utter.rate = 0.95;
    utter.pitch = 0.9;

    utter.onend = () => {
      if (typeof window !== 'undefined' && (window as any).confetti) {
        (window as any).confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF4500', '#FFFFFF', '#FFA500']
        });
      }
    };

    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* SETUP 단계: API 키 입력 및 이미지 업로드 */}
      {state.step === AppStep.SETUP && (
        <div className="w-full max-w-[500px] animate-fadeIn space-y-8">
          <header className="text-center space-y-4 mb-10">
            <div className="text-8xl drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">🪐</div>
            <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 tracking-tighter">쇼츠 명리 마스터</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] opacity-70">Fortune Shorts Creator</p>
          </header>

          <div className="glass-panel p-10 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,1)] border border-slate-700/50 space-y-10">
            <ApiKeySelector onKeyValidated={() => { }} />

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
              {state.isGenerating ? <><i className="fas fa-dharmachakra fa-spin mr-3"></i>분석 중...</> : "기운 분석 및 대본 생성"}
            </button>
          </div>
        </div>
      )}

      {/* ANALYSIS 단계: 대본 편집 */}
      {state.step === AppStep.ANALYSIS && state.analysis && (
        <div className="w-full max-w-6xl space-y-10 animate-slideUp">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-800/50 pb-10">
            <div className="space-y-4">
              <span className="text-yellow-500 text-[10px] font-black tracking-[0.5em] uppercase">Script Ready</span>
              <h2 className="text-5xl font-black text-white leading-tight tracking-tighter">{editableTitle}</h2>
            </div>
            <button onClick={() => setState(prev => ({ ...prev, step: AppStep.SETUP }))} className="px-10 py-4 bg-slate-900/50 hover:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700">
              <i className="fas fa-times mr-2"></i> 닫기
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-4 rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-700/50">
                <img src={state.screenshotBase64!} className="rounded-[3rem] w-full h-auto opacity-70" />
              </div>
              <div className="bg-yellow-500/5 p-8 rounded-[2.5rem] border border-yellow-500/20">
                <h4 className="text-yellow-400 font-black text-[10px] uppercase mb-3 tracking-widest">사용 안내</h4>
                <p className="text-slate-400 text-xs font-bold leading-relaxed">
                  1. 대본을 수정하세요<br />
                  2. "쇼츠 미리보기" 클릭<br />
                  3. 금두꺼비 더블클릭 = 복!<br />
                  4. TTS로 멘트 재생<br />
                  5. 캡컷에서 제목 추가
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="bg-slate-900/80 p-12 rounded-[4rem] border border-yellow-500/20 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                <textarea
                  value={editableScript}
                  onChange={(e) => setEditableScript(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-slate-100 font-bold text-lg min-h-[400px] outline-none leading-relaxed custom-scrollbar resize-none"
                  placeholder="대본을 입력하세요..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleTTS}
                  className="flex-1 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] rounded-[2rem] font-black text-xl text-white shadow-2xl active:scale-[0.98] transition-all"
                >
                  <i className="fas fa-volume-up mr-3"></i>
                  미리 듣기 (TTS)
                </button>
                <button
                  onClick={goToViewer}
                  className="flex-1 py-6 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-900 hover:shadow-[0_0_80px_rgba(234,179,8,0.4)] rounded-[2rem] font-black text-xl text-slate-950 shadow-2xl active:scale-[0.98] transition-all"
                >
                  🎬 쇼츠 미리보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GENERATION 단계: 포춘 뷰어 */}
      {state.step === AppStep.GENERATION && (
        <FortuneViewer
          script={editableScript}
          title={editableTitle}
          onClose={() => setState(prev => ({ ...prev, step: AppStep.ANALYSIS }))}
        />
      )}
    </div>
  );
};

export default App;
