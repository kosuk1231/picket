// 백엔드 프록시(/api/generate)를 통해 Vertex AI Gemini 2.5 Flash Image 호출
// 인증 토큰과 프로젝트 ID는 서버 측에 보관 (브라우저에 노출 안 됨)

const API_ENDPOINT = '/api/generate';

/**
 * 이미지를 base64로 변환
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * URL에서 이미지를 가져와 base64로 변환
 */
export async function urlToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 백엔드 프록시를 통해 손피켓 인증샷 합성 요청
 */
export async function generatePicketPhoto({ userPhoto, picketImage }) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userPhoto, picketImage }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `합성 요청 실패 (${response.status})`);
  }

  if (!data.image) {
    throw new Error('이미지를 받지 못했습니다. 다른 사진으로 다시 시도해주세요.');
  }

  return data.image;
}
