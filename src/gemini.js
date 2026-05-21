// 백엔드 프록시(/api/generate)를 통해 Vertex AI Gemini 2.5 Flash Image 호출
// 인증 토큰과 프로젝트 ID는 서버 측에 보관 (브라우저에 노출 안 됨)

const API_ENDPOINT = '/api/generate';
const MAX_DIMENSION = 1280; // 긴 쪽 기준 최대 크기
const JPEG_QUALITY = 0.85;

/**
 * Image 객체를 Canvas로 리사이즈한 뒤 base64 추출
 */
function imageToBase64(img, mimeType = 'image/jpeg') {
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  // 긴 쪽이 MAX_DIMENSION을 넘으면 비율 유지하며 축소
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      height = Math.round((height / width) * MAX_DIMENSION);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width / height) * MAX_DIMENSION);
      height = MAX_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1];
  return { base64, mimeType };
}

/**
 * 파일을 읽어서 리사이즈된 base64로 변환
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        try {
          const result = imageToBase64(img, 'image/jpeg');
          URL.revokeObjectURL(img.src);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * URL에서 이미지를 가져와 base64로 변환 (피켓 이미지용 — PNG 유지)
 */
export async function urlToBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // 피켓은 PNG로 유지 (텍스트 선명도 보존)
        const result = imageToBase64(img, 'image/png');
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('피켓 이미지를 불러올 수 없습니다.'));
    img.src = url;
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

  // 응답이 JSON이 아닐 수도 있음 (Vercel의 4xx HTML/text 에러 페이지 등)
  const contentType = response.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    // 일반 텍스트 응답 — 크기 초과, 타임아웃, 게이트웨이 에러 등
    if (response.status === 413 || text.toLowerCase().includes('too large') || text.toLowerCase().includes('request entity')) {
      throw new Error('사진 크기가 너무 큽니다. 더 작은 사진으로 시도해주세요.');
    }
    if (response.status === 504 || text.toLowerCase().includes('timeout')) {
      throw new Error('서버 응답 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    throw new Error(`서버 오류 (${response.status}): ${text.slice(0, 100)}`);
  }

  if (!response.ok) {
    const errMsg = data.error || `합성 요청 실패 (${response.status})`;
    if (data.debug) {
      console.error('API debug info:', data.debug);
    }
    throw new Error(errMsg);
  }

  if (!data.image) {
    throw new Error('이미지를 받지 못했습니다. 다른 사진으로 다시 시도해주세요.');
  }

  return data.image;
}
