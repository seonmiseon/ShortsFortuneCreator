
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
    당신은 '대한민국 최고의 명리학 권위자'이자 '숏폼 전문 SEO 기획가'입니다. 
    이 쇼츠 스크린샷을 분석하여 다음 요소들을 반드시 '한국어'로 작성해줘:

    1. suggestedTitle: SEO 클릭률을 극대화하는 15자 이내의 강렬한 제목.
    2. hook: 시청자를 즉시 멈추게 하는 강력한 첫 문장.
    3. visualStyle: 신비로운 우주 배경에 12지신 조각상이 움직이는 시각 전략.
    4. pacing: 정보를 빠르게 전달하는 숏폼 리듬.
    5. textOverlayStrategy: 캡컷에서 작업하기 좋은 자막 배치 전략.
    6. engagementFactor: 구독과 좋아요를 유도하는 심리 기법.
    7. suggestedFortuneScript: 
       - [제목]: 분석된 내용을 바탕으로 한 강렬한 운세 제목 (제목부터 바로 시작).
       - [본문]: 2026년 대박나는 출생년도를 반드시 최소 25~30개 이상 상세히 나열.
       - [미션]: "화면 하단의 황금 영물을 2번 누르시면 복이 찾아옵니다."
       - [클로징]: "당신의 앞길에 만복이 깃들고 막혔던 재물운이 폭포수처럼 터지길 간절히 축원합니다. 복 많이 받으십시오. 친구에게 공유 좋아요 누르셨지요? 구독은 저에게 큰힘이 됩니다."
  `;

  // Upgraded to gemini-3-pro-preview for complex reasoning tasks as per guidelines.
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
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

  // Extracting text output directly from the .text property of GenerateContentResponse.
  return JSON.parse(response.text || '{}');
};

export const generateFortuneVideo = async (script: string, aspectRatio: '9:16' = '9:16') => {
  // Get API key from window object set by ApiKeySelector
  const apiKey = (window as any).GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. API 키를 먼저 입력해주세요.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const scriptClean = script.replace(/\s/g, '');
  const isPig = scriptClean.includes('돼지') || scriptClean.includes('돈돼지') || scriptClean.includes('복돼지');
  const focalObject = isPig
    ? "a massive, glowing Golden Fortune Pig statue at the bottom center"
    : "a majestic, ruby-eyed Golden Fortune Toad statue at the bottom center";

  const videoPrompt = `
    High-quality 9:16 vertical cinematic video. 
    SCENE: A mysterious deep space universe background with glowing blue and purple nebulas.
    MOTION: Diverse golden statues of the 12 Chinese zodiac animals (Dragon, Tiger, Snake, etc.) are falling gracefully like golden rain from the top to the bottom of the screen.
    SUBJECT: At the bottom, ${focalObject} is sitting on a pile of gold coins, glowing intensely.
    VISUAL STYLE: Photorealistic 3D animation, golden glowing light, luxury atmosphere, sparkles and particles.
    NO TEXT: Ensure no text is visible in the video.
  `;

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Polling the video generation operation until it's finished.
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video URI not found. Check quota or safety filters.");

    // Appending API key when fetching from the download link as required by the Veo API.
    const videoFetch = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoFetch.ok) throw new Error("Failed to fetch video file from Google server.");

    const blob = await videoFetch.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};