// Vercel Serverless Function: /api/generate
// 브라우저 → 이 함수 → Vertex AI Gemini 2.5 Flash Image

import { GoogleAuth } from 'google-auth-library';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

function getAuth() {
  const credsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credsRaw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다.');
  }
  let credentials;
  try {
    credentials = JSON.parse(credsRaw);
  } catch (e) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON JSON 파싱 실패. 키 값이 올바른 JSON 형식인지 확인하세요.');
  }
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

/**
 * 모델/리전 조합 후보를 모두 만든다
 * Gemini 2.5 Flash Image 모델은 다음 ID로 시도 가능:
 * - gemini-2.5-flash-image (정식)
 * - gemini-2.5-flash-image-preview (이전 미리보기명, 호환성 유지)
 *
 * 리전:
 * - global (가장 권장)
 * - us-central1 (대부분 모델 사용 가능)
 */
function getEndpointCandidates(projectId, envLocation, envModel) {
  const models = [];
  // 사용자 지정 모델 우선 시도
  if (envModel && envModel !== 'gemini-2.5-flash-image') {
    models.push(envModel);
  }
  // 기본 후보들
  models.push('gemini-2.5-flash-image');
  models.push('gemini-2.5-flash-image-preview');

  const locations = [];
  if (envLocation && envLocation !== 'global') {
    locations.push(envLocation);
  }
  locations.push('global');
  locations.push('us-central1');

  // 중복 제거
  const uniqModels = [...new Set(models)];
  const uniqLocations = [...new Set(locations)];

  const candidates = [];
  for (const model of uniqModels) {
    for (const location of uniqLocations) {
      const host = location === 'global'
        ? 'aiplatform.googleapis.com'
        : `${location}-aiplatform.googleapis.com`;
      candidates.push({
        url: `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`,
        label: `${model} @ ${location}`,
        model,
        location,
      });
    }
  }
  return candidates;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청만 지원합니다.' });

  try {
    const { userPhoto, picketImage } = req.body || {};
    if (!userPhoto?.base64 || !picketImage?.base64) {
      return res.status(400).json({ error: '사진과 피켓 이미지가 모두 필요합니다.' });
    }

    const projectId = process.env.GCP_PROJECT_ID;
    const envLocation = process.env.GCP_LOCATION || 'global';
    const envModel = process.env.GCP_MODEL || 'gemini-2.5-flash-image';

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

    const candidates = getEndpointCandidates(projectId, envLocation, envModel);
    const errors = [];

    for (const candidate of candidates) {
      try {
        console.log(`Trying: ${candidate.label}`);

        const vertexResponse = await fetch(candidate.url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (vertexResponse.ok) {
          const data = await vertexResponse.json();
          const candidatesResult = data?.candidates || [];

          for (const c of candidatesResult) {
            const parts = c?.content?.parts || [];
            for (const part of parts) {
              const inline = part.inlineData || part.inline_data;
              if (inline?.data) {
                const mimeType = inline.mimeType || inline.mime_type || 'image/png';
                console.log(`Success: ${candidate.label}`);
                return res.status(200).json({
                  image: `data:${mimeType};base64,${inline.data}`,
                });
              }
            }
          }

          // 응답은 왔는데 이미지가 없음
          const finishReason = candidatesResult[0]?.finishReason || 'unknown';
          return res.status(500).json({
            error: `AI가 이미지를 생성하지 못했습니다 (사유: ${finishReason}). 다른 사진으로 다시 시도해주세요.`,
            debug: { finishReason, candidate: candidate.label },
          });
        } else {
          const errorText = await vertexResponse.text();
          errors.push({
            endpoint: candidate.label,
            status: vertexResponse.status,
            body: errorText.slice(0, 500),
          });

          // 404 외 다른 에러는 후보를 바꿔도 동일할 가능성이 높음
          // 단, 503/429는 다른 리전으로 fallback할 가치가 있음
          if (vertexResponse.status !== 404 && vertexResponse.status !== 503 && vertexResponse.status !== 429) {
            break;
          }
        }
      } catch (fetchErr) {
        errors.push({
          endpoint: candidate.label,
          error: fetchErr.message,
        });
      }
    }

    // 모든 후보 실패
    const firstError = errors[0];
    let userMsg = `Vertex AI 호출 실패`;
    if (firstError?.status === 404) {
      userMsg = `Gemini 이미지 모델에 접근할 수 없습니다.\n프로젝트(${projectId})에서 Vertex AI / Gemini 2.5 Flash Image 모델 접근 권한을 확인해주세요.`;
    } else if (firstError?.status === 403) {
      userMsg = `권한이 부족합니다. 서비스 계정에 "Vertex AI 사용자" 또는 "Agent Platform 사용자" 권한이 있는지 확인하세요.`;
    } else if (firstError?.status === 401) {
      userMsg = `인증 실패. 서비스 계정 키가 올바른지 확인하세요.`;
    } else if (firstError?.status === 429) {
      userMsg = `요청이 너무 많습니다. 잠시 후 다시 시도해주세요.`;
    }

    return res.status(firstError?.status || 500).json({
      error: userMsg,
      debug: errors,
    });
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({
      error: err.message || '서버 오류가 발생했습니다.',
    });
  }
}
