# 공정위원회 손피켓 인증샷 AI 합성 앱

서울특별시사회복지사협회 공정위원회 캠페인용 손피켓 인증샷을 AI로 자동 합성하는 웹앱입니다.

## 주요 기능

- 📱 모바일·PC 모두 지원: 카메라 촬영 또는 앨범 업로드
- 🎨 9종 손피켓 선택: 처우개선·경력인정·고용안정 등 캠페인 메시지별
- ✨ AI 자동 합성: Google Vertex AI · Gemini 2.5 Flash Image (Nano Banana)
- 📋 해시태그 자동 삽입: 피켓별 맞춤 + 협회 공통 해시태그
- 📤 원클릭 공유: 다운로드 · SNS 공유 · 해시태그 복사

## 배포 방법 (Vertex AI + Vercel)

이 가이드는 **$300 무료 크레딧을 받아 캠페인을 운영하는 시나리오**를 따라갑니다.
처음부터 차근차근 따라하시면 1시간 안에 배포 완료됩니다.

### 1단계: Google Cloud 프로젝트 만들기 (10분)

1. https://console.cloud.google.com 접속
2. 상단의 프로젝트 선택 → **새 프로젝트** 클릭
3. 프로젝트 이름: `picket-campaign` 등 자유롭게
4. 프로젝트 생성 완료 후, **프로젝트 ID** 기억해두기 (예: `picket-campaign-12345`)

### 2단계: 결제 계정 등록 ($300 크레딧 자동 적립)

1. 좌측 메뉴 → **결제** (Billing)
2. **결제 계정 만들기** → 신용카드/체크카드 등록
3. 신규 가입 시 **$300 무료 크레딧이 자동으로 적립** (90일 사용 가능)
4. 프로젝트와 결제 계정 연결

> ⚠ 카드 등록은 필수이지만, $300 크레딧을 다 쓰기 전에는 실제 결제되지 않습니다.
> 캠페인 종료 후 카드를 제거하거나 결제 계정을 비활성화하면 안전합니다.

### 3단계: Vertex AI API 활성화

1. 좌측 메뉴 → **API 및 서비스** → **라이브러리**
2. "Vertex AI API" 검색 → **사용 설정** 클릭
3. 1~2분 후 활성화 완료

### 4단계: 서비스 계정 만들기 (인증용)

1. 좌측 메뉴 → **IAM 및 관리자** → **서비스 계정**
2. **+ 서비스 계정 만들기** 클릭
3. 이름: `picket-app-service`
4. 역할(권한) 부여: **Vertex AI 사용자** (Vertex AI User)
5. 완료 후, 생성된 서비스 계정 이메일 클릭
6. **키** 탭 → **키 추가** → **새 키 만들기** → **JSON** 선택
7. JSON 파일이 자동 다운로드됩니다. **잘 보관**해두세요.

### 5단계: Vercel에 배포 (10분)

1. https://vercel.com 가입 (GitHub 계정으로 로그인 추천)
2. 이 폴더(`picket-app`)를 GitHub 저장소에 올리기:
   ```bash
   cd picket-app
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create picket-app --public --source=. --push
   ```
   (`gh`는 GitHub CLI. 없으면 https://github.com 에서 직접 저장소 만들고 push)

3. Vercel 대시보드 → **Add New** → **Project** → 방금 만든 GitHub 저장소 선택 → **Deploy**

4. 첫 배포는 일단 실패합니다 (환경변수 미설정). 정상입니다.

### 6단계: 환경변수 설정 ⭐ 가장 중요

배포된 Vercel 프로젝트 → **Settings** → **Environment Variables**

다음 3개를 추가합니다:

| 이름 | 값 |
|---|---|
| `GCP_PROJECT_ID` | 1단계에서 만든 프로젝트 ID (예: `picket-campaign-12345`) |
| `GCP_LOCATION` | `global` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 4단계 JSON 파일 **전체 내용을 그대로 붙여넣기** |

> 💡 JSON 파일을 텍스트 에디터로 열어 전체 내용을 복사해서 붙여넣으세요.
> `{ "type": "service_account", "project_id": ... }` 로 시작하는 그 내용 전부입니다.

### 7단계: 재배포

- Vercel 대시보드 → **Deployments** → 최근 배포 옆 `…` → **Redeploy**
- 약 1~2분 후 완료. 발급된 URL로 접속하면 작동합니다.

---

## 로컬 개발

```bash
npm install
npm run dev
```

로컬에서는 백엔드 함수가 동작하지 않으므로 **Vercel CLI**를 쓰면 좋습니다:
```bash
npm install -g vercel
vercel dev
```
환경변수는 `.env.local` 파일에 위 3개를 똑같이 넣어두세요.

## 비용 안내

- Gemini 2.5 Flash Image: **이미지 1장당 약 $0.039 (한화 약 55원)**
- $300 무료 크레딧 = 약 7,500장 합성 가능
- 캠페인 참여자 1,000명이 평균 3번씩 합성해도 3,000장 = **무료 크레딧으로 충분**

## 파일 구조

```
picket-app/
├── api/
│   └── generate.js     # Vercel Serverless 함수 (Vertex AI 호출)
├── src/
│   ├── App.jsx         # 메인 컴포넌트
│   ├── gemini.js       # 백엔드 프록시 클라이언트
│   ├── pickets.js      # 피켓 메타데이터 + 해시태그
│   ├── index.css       # 디자인 토큰
│   └── main.jsx        # React entry
├── public/pickets/     # 손피켓 이미지 9종
├── vercel.json         # Vercel 설정
└── package.json
```

## 트러블슈팅

**"GOOGLE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다"**
→ Vercel 환경변수 설정 후 반드시 재배포 필요

**"Permission denied" 또는 "Forbidden" 에러**
→ 서비스 계정의 역할이 **Vertex AI User**로 되어 있는지 확인

**"Vertex AI API has not been used"**
→ 3단계 Vertex AI API 활성화 누락. Google Cloud Console에서 다시 확인

**합성 결과의 텍스트가 깨지거나 변형됨**
→ 사진을 상반신 정면, 밝은 조명에서 다시 시도. 어두운 사진/전신샷은 품질이 낮을 수 있음
