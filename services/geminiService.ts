import { GoogleGenAI, Type } from "@google/genai";
import { ViralAnalysis } from "../types";

export const analyzeViralShorts = async (base64Image: string): Promise<ViralAnalysis> => {
  // Get API key from window object set by ApiKeySelector
  const apiKey = (window as any).GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 입력해주세요.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    당신은 '대한민국 최고의 명리학 권위자' 50년차 명리학 교수이자 '숏폼 전문 SEO 유튜버 기획가'입니다. 
    이 쇼츠 스크린샷을 분석하여 다음 요소들을 반드시 '한국어'로 작성해줘:

    1. suggestedTitle: SEO 클릭률을 극대화하는 15자 이내의 강렬한 제목. (캡컷에서 사용자가 따로 입력)
    2. hook: 시청자를 즉시 멈추게 하는 강력한 첫 문장.
    3. visualStyle: 신비로운 우주 배경에 대한 시각 전략 설명.
    4. pacing: 정보를 빠르게 전달하는 숏폼 리듬.
    5. textOverlayStrategy: 캡컷에서 작업하기 좋은 자막 배치 전략.
    6. engagementFactor: 구독과 좋아요를 유도하는 심리 기법.
    7. suggestedFortuneScript: 
       - [본문]: 2026년 대박나는 출생년도를 반드시 최소 25~30개 이상 상세히 나열해야 함.
         형식 예시: "78년생, 62년생, 54년생" 이렇게 쉼표로 구분하여 여러 줄에 걸쳐 작성.
         반드시 "XX년생" 형식으로 통일.
       - [미션]: "화면 하단의 황금 두꺼비를 두 번 누르시면 복이 찾아옵니다."
       - [클로징]: "당신의 앞길에 만복이 깃들고 막혔던 재물운이 폭포수처럼 터지길 간절히 축원합니다. 복 많이 받으십시오. 친구에게 공유, 좋아요 누르셨지요? 구독은 저에게 큰 힘이 됩니다."
  `;

  // Using gemini-2.0-flash for faster response
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedTitle: { type: Type.STRING },
          hook: { type: Type.STRING },
          visualStyle: { type: Type.STRING },
          pacing: { type: Type.STRING },
          textOverlayStrategy: { type: Type.STRING },
          engagementFactor: { type: Type.STRING },
          suggestedFortuneScript: { type: Type.STRING }
        },
        required: ["suggestedTitle", "hook", "visualStyle", "pacing", "textOverlayStrategy", "engagementFactor", "suggestedFortuneScript"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};