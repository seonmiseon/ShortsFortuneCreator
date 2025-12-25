import React, { useState, useEffect, useRef } from 'react';
import toadImage from '../assets/golden-toad.png';

interface FortuneViewerProps {
    script: string;
    title: string;
    onClose: () => void;
}

const FortuneViewer: React.FC<FortuneViewerProps> = ({ script, title, onClose }) => {
    const [toadDirection, setToadDirection] = useState<'left' | 'right'>('left');
    const [showBlessing, setShowBlessing] = useState(false);
    const [blessingCount, setBlessingCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [birthYears, setBirthYears] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // 금두꺼비 방향 랜덤 설정
    useEffect(() => {
        setToadDirection(Math.random() > 0.5 ? 'left' : 'right');
    }, []);

    // 대본에서 년생 추출
    useEffect(() => {
        const yearPattern = /(\d{2,4})년생/g;
        const matches = script.match(yearPattern) || [];
        setBirthYears([...new Set(matches)]);
    }, [script]);

    // 금두꺼비 더블클릭 핸들러
    const handleToadDoubleClick = () => {
        setBlessingCount(prev => prev + 1);
        setShowBlessing(true);

        // 축복 효과
        if (typeof window !== 'undefined' && (window as any).confetti) {
            (window as any).confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.8, x: 0.5 },
                colors: ['#FFD700', '#FFA500', '#FF6347', '#FFFF00']
            });
        }

        setTimeout(() => setShowBlessing(false), 2500);
    };

    // TTS 재생 - 제목 + 금두꺼비 안내만
    const handlePlayTTS = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);

        // 제목 + 금두꺼비 안내 멘트만 읽기
        const ttsText = `${title}. 화면 하단의 금두꺼비를 두 번 누르시면 복이 찾아옵니다.`;
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
        utterance.rate = 0.9; // 천천히
        utterance.pitch = 0.85; // 중저음

        utterance.onend = () => {
            setIsPlaying(false);
            // 멘트 끝나면 돈 폭죽!
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

            // 여러 번 발사
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
                {/* 년생 텍스트 영역 - 깔끔한 하얀색, 움직이지 않음 */}
                <div className="birth-years-container">
                    {birthYears.map((year, index) => (
                        <span key={index} className="birth-year-text">
                            {year}
                        </span>
                    ))}
                </div>

                {/* 금두꺼비 - 고급스러운 이미지 */}
                <div
                    className={`toad-container ${toadDirection}`}
                    onDoubleClick={handleToadDoubleClick}
                >
                    <div className="toad-circle">
                        <img
                            src={toadImage}
                            alt="금두꺼비"
                            className="toad-image"
                            style={{ transform: toadDirection === 'right' ? 'scaleX(-1)' : 'none' }}
                        />
                    </div>
                    <span className="toad-hint">두 번 누르세요!</span>

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
