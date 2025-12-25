import React, { useState, useEffect, useRef } from 'react';

interface FortuneViewerProps {
    script: string;
    title: string;
    onClose: () => void;
}

const FortuneViewer: React.FC<FortuneViewerProps> = ({ script, title, onClose }) => {
    const [pigDirection, setPigDirection] = useState<'left' | 'right'>('left');
    const [showBlessing, setShowBlessing] = useState(false);
    const [blessingCount, setBlessingCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [birthYears, setBirthYears] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // 복돼지 방향 랜덤 설정
    useEffect(() => {
        setPigDirection(Math.random() > 0.5 ? 'left' : 'right');
    }, []);

    // 대본에서 년생 추출 및 나이순 정렬 (오래된 년도 먼저)
    useEffect(() => {
        const yearPattern = /(\d{2,4})년생/g;
        const matches = script.match(yearPattern) || [];
        const uniqueYears = [...new Set(matches)];

        // 나이순 정렬: 오래된 년도(작은 숫자)가 먼저 오도록
        const sortedYears = uniqueYears.sort((a, b) => {
            const yearA = parseInt(a.replace('년생', ''));
            const yearB = parseInt(b.replace('년생', ''));

            // 2자리 년도를 4자리로 변환 (00-30: 2000년대, 31-99: 1900년대)
            const fullYearA = yearA < 100 ? (yearA <= 30 ? 2000 + yearA : 1900 + yearA) : yearA;
            const fullYearB = yearB < 100 ? (yearB <= 30 ? 2000 + yearB : 1900 + yearB) : yearB;

            return fullYearA - fullYearB; // 오름차순 (오래된 년도가 먼저)
        });

        setBirthYears(sortedYears);
    }, [script]);

    // 복돼지 더블클릭 핸들러
    const handlePigDoubleClick = () => {
        setBlessingCount(prev => prev + 1);
        setShowBlessing(true);

        // 축복 효과
        if (typeof window !== 'undefined' && (window as any).confetti) {
            (window as any).confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.85, x: 0.5 },
                colors: ['#FFD700', '#FFA500', '#FF69B4', '#FFFF00']
            });
        }

        setTimeout(() => setShowBlessing(false), 2500);
    };

    // TTS 재생 - 제목 + 복돼지 안내만
    const handlePlayTTS = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);

        // 제목 + 복돼지 안내 멘트만 읽기
        const ttsText = `${title}. 화면 하단의 복돼지를 두 번 누르시면 복이 찾아옵니다.`;
        const utterance = new SpeechSynthesisUtterance(ttsText);

        // 한국어 여성 목소리 찾기
        const voices = window.speechSynthesis.getVoices();
        const koreanFemaleVoice = voices.find(v =>
            (v.lang === 'ko-KR' || v.lang.startsWith('ko')) &&
            (v.name.includes('Female') || v.name.includes('여성') || v.name.includes('Yuna') || v.name.includes('Heami'))
        ) || voices.find(v => v.lang.startsWith('ko'));

        if (koreanFemaleVoice) {
            utterance.voice = koreanFemaleVoice;
        }

        utterance.lang = 'ko-KR';
        utterance.rate = 0.9;
        utterance.pitch = 0.85;

        utterance.onend = () => {
            setIsPlaying(false);
            triggerMoneyConfetti();
        };

        utterance.onerror = () => {
            setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    // 돈 폭죽 효과
    const triggerMoneyConfetti = () => {
        if (typeof window !== 'undefined' && (window as any).confetti) {
            const confetti = (window as any).confetti;

            const duration = 3000;
            const animationEnd = Date.now() + duration;

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    clearInterval(interval);
                    return;
                }

                confetti({
                    particleCount: 4,
                    angle: randomInRange(55, 125),
                    spread: randomInRange(50, 70),
                    origin: { x: randomInRange(0.1, 0.9), y: 0 },
                    colors: ['#FFD700', '#FFA500', '#FFFF00', '#DAA520'],
                    shapes: ['circle'],
                    gravity: 1.2,
                    scalar: 1.2
                });
            }, 50);
        }
    };

    return (
        <div className="fortune-viewer-container" ref={containerRef}>
            {/* 움직이는 우주 배경 */}
            <div className="cosmic-background">
                <div className="stars"></div>
                <div className="stars2"></div>
                <div className="stars3"></div>
                <div className="nebula"></div>
            </div>

            {/* 상단 컨트롤 */}
            <div className="viewer-controls">
                <button onClick={onClose} className="close-btn">
                    <i className="fas fa-times"></i> 닫기
                </button>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="fortune-content">
                {/* SEO 제목 표시 */}
                <div className="fortune-title">
                    <h1>{title}</h1>
                </div>

                {/* 년생 텍스트 영역 - 깔끔한 하얀색, 휴먼명조 스타일, 정적 */}
                <div className="birth-years-container">
                    {birthYears.map((year, index) => (
                        <span key={index} className="birth-year-text">
                            {year}
                        </span>
                    ))}
                </div>

                {/* 복돼지 - 하단에 작게 */}
                <div
                    className="pig-container"
                    onDoubleClick={handlePigDoubleClick}
                >
                    <div className="pig-wrapper">
                        <span
                            className="pig-emoji"
                            style={{ transform: pigDirection === 'right' ? 'scaleX(-1)' : 'none' }}
                        >
                            🐷
                        </span>
                    </div>
                    <span className="pig-hint">두 번 누르세요!</span>

                    {/* 축복 메시지 */}
                    {showBlessing && (
                        <div className="blessing-popup">
                            <span className="blessing-main">🎉 복 받았습니다! 🎉</span>
                            <span className="blessing-sub">재물운이 열립니다</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 컨트롤 */}
            <div className="bottom-controls">
                <button
                    onClick={handlePlayTTS}
                    className={`tts-button ${isPlaying ? 'playing' : ''}`}
                >
                    <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>
                    {isPlaying ? '멈추기' : '음성 재생 (TTS)'}
                </button>

                <button
                    onClick={triggerMoneyConfetti}
                    className="confetti-button"
                >
                    💰 돈 폭죽!
                </button>
            </div>
        </div>
    );
};

export default FortuneViewer;
