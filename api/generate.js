// Vercel Serverless Function: /api/generate
// 브라우저 → 이 함수 → Vertex AI Gemini 2.5 Flash Image
// 인증 토큰과 프로젝트 ID를 서버 측에서만 다룸

import { GoogleAuth } from 'google-auth-library';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

// Service Account JSON을 환경변수에서 읽어 인증
function getAuth() {
  const credsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsRaw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다.');
  }
  const credentials = JSON.parse(credsRaw);
  return new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
}

const PROMPT = `[작업] 두 이미지를 자연스럽게 합성해주세요.

이미지 1: 인물 사진 (사용자)
이미지 2: 캠페인 손피켓 (가로형 디자인)

[합성 지침]
- 인물이 두 손으로 손피켓을 자연스럽게 들고 있는 사진으로 합성합니다.
- 손피켓은 인물의 가슴~배 높이에 위치하며, 카메라를 향해 정면으로 보이도록 합니다.
- 손피켓 안의 텍스트, 색상, 디자인은 절대 변경하지 말고 원본 그대로 유지하세요. (이것이 가장 중요합니다)
- 손가락이 손피켓을 자연스럽게 잡고 있는 모습으로 표현해주세요.
- 손피켓의 크기는 인물의 어깨너비 정도로 맞춰주세요.
- 원본 사진의 배경, 조명, 분위기는 그대로 유지하세요.
- 인물의 표정과 자세는 원본과 어울리도록 유지하되, 손피켓을 드는 자세로 자연스럽게 조정해주세요.
- 사진의 전체적인 비율은 원본 인물 사진과 동일하게 유지해주세요.
- 사실적이고 자연스러운 사진처럼 보이도록 합성해주세요.

결과물은 위 조건을 모두 만족하는 합성된 이미지 1장입니다.`;

export default async function handler(req, res) {
  // CORS (필요시)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 지원합니다.' });
  }

  try {
    const { userPhoto, picketImage } = req.body || {};
    if (!userPhoto?.base64 || !picketImage?.base64) {
      return res.status(400).json({ error: '사진과 피켓 이미지가 모두 필요합니다.' });
    }

    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || 'global';
    const model = process.env.GCP_MODEL || 'gemini-2.5-flash-image';

    if (!projectId) {
      return res.status(500).json({ error: 'GCP_PROJECT_ID 환경변수가 설정되지 않았습니다.' });
    }

    // OAuth access token 발급
    const auth = getAuth();
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      return res.status(500).json({ error: '인증 토큰 발급에 실패했습니다.' });
    }

    // Vertex AI 엔드포인트
    const host = location === 'global'
      ? 'aiplatform.googleapis.com'
      : `${location}-aiplatform.googleapis.com`;

    const url = `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            {
              inlineData: {
                mimeType: userPhoto.mimeType || 'image/jpeg',
                data: userPhoto.base64,
              },
            },
            {
              inlineData: {
                mimeType: picketImage.mimeType || 'image/png',
                data: picketImage.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    };

    const vertexResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      let errorMsg = `Vertex AI 호출 실패 (${vertexResponse.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson?.error?.message || errorMsg;
      } catch {}
      return res.status(vertexResponse.status).json({ error: errorMsg });
    }

    const data = await vertexResponse.json();
    const candidates = data?.candidates || [];

    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        const inline = part.inlineData || part.inline_data;
        if (inline?.data) {
          const mimeType = inline.mimeType || inline.mime_type || 'image/png';
          return res.status(200).json({
            image: `data:${mimeType};base64,${inline.data}`,
          });
        }
      }
    }

    return res.status(500).json({
      error: 'AI가 이미지를 생성하지 못했습니다. 다른 사진으로 다시 시도해주세요.',
    });
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({
      error: err.message || '서버 오류가 발생했습니다.',
    });
  }
}
