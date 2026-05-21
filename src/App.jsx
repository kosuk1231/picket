import { useState, useEffect, useRef } from 'react';
import { PICKETS, buildHashtagText } from './pickets';
import { fileToBase64, urlToBase64, generatePicketPhoto } from './gemini';

export default function App() {
  // User photo
  const [userPhotoFile, setUserPhotoFile] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);

  // Selected picket
  const [selectedPicket, setSelectedPicket] = useState(null);

  // Result
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI
  const [toast, setToast] = useState('');
  const [hashtagCopied, setHashtagCopied] = useState(false);

  // 지목할 사람 3명 (릴레이용)
  const [nominees, setNominees] = useState(['', '', '']);

  // 피켓 크게 보기 모달
  const [previewPicketId, setPreviewPicketId] = useState(null);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Steps
  const step1Done = !!userPhotoFile;
  const step2Done = !!selectedPicket;
  const step3Done = !!resultImage;
  const currentStep = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : 3;

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUserPhotoFile(file);
    setUserPhotoPreview(URL.createObjectURL(file));
    setResultImage(null);
    setError('');
  }

  async function handleGenerate() {
    if (!userPhotoFile || !selectedPicket) return;

    setLoading(true);
    setError('');
    setResultImage(null);

    try {
      const picketMeta = PICKETS.find(p => p.id === selectedPicket);
      const userPhoto = await fileToBase64(userPhotoFile);
      const picketImage = await urlToBase64(picketMeta.file);

      const result = await generatePicketPhoto({ userPhoto, picketImage });

      setResultImage(result);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      let msg = err.message || '합성 중 오류가 발생했습니다.';
      if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        msg = '오늘 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
      } else if (msg.includes('SAFETY') || msg.includes('blocked')) {
        msg = '사진이 안전성 검사를 통과하지 못했습니다. 다른 사진을 사용해주세요.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    const picketMeta = PICKETS.find(p => p.id === selectedPicket);
    const date = new Date().toISOString().slice(0, 10);
    link.download = `온라인이슈파이팅_인증샷_${picketMeta?.id || ''}_${date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast('이미지를 저장했습니다');
  }

  async function handleCopyHashtag() {
    const text = buildHashtagText(selectedPicket, nominees);
    try {
      await navigator.clipboard.writeText(text);
      setHashtagCopied(true);
      setToast('게시용 문구를 복사했습니다');
      setTimeout(() => setHashtagCopied(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다. 직접 선택해서 복사해주세요.');
    }
  }

  async function handleShare() {
    if (!resultImage) return;
    const text = buildHashtagText(selectedPicket, nominees);

    try {
      const blob = await (await fetch(resultImage)).blob();
      const file = new File([blob], 'picket-photo.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: text,
          title: '온라인 이슈 파이팅 인증샷',
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      setToast('해시태그를 복사했습니다. 이미지를 다운로드 후 SNS에 올려주세요.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setError('공유에 실패했습니다. 다운로드 후 직접 공유해주세요.');
      }
    }
  }

  const picketMeta = selectedPicket ? PICKETS.find(p => p.id === selectedPicket) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">서울특별시사회복지사협회 공정위원회</div>
        <h1 className="header-title">
          온라인 이슈 파이팅 <em>인증샷 만들기</em>
        </h1>
      </header>

      <main className="main">
        <div className="stepper">
          <div className={`step ${currentStep === 1 ? 'active' : ''} ${step1Done ? 'done' : ''}`}>
            <span className="step-dot">{step1Done ? '✓' : '1'}</span>
            <span className="step-label">사진</span>
          </div>
          <div className={`step-line ${step1Done ? 'done' : ''}`} />
          <div className={`step ${currentStep === 2 ? 'active' : ''} ${step2Done ? 'done' : ''}`}>
            <span className="step-dot">{step2Done ? '✓' : '2'}</span>
            <span className="step-label">피켓</span>
          </div>
          <div className={`step-line ${step2Done ? 'done' : ''}`} />
          <div className={`step ${currentStep === 3 ? 'active' : ''} ${step3Done ? 'done' : ''}`}>
            <span className="step-dot">{step3Done ? '✓' : '3'}</span>
            <span className="step-label">완성</span>
          </div>
        </div>

        {/* Step 1 */}
        <section className="section">
          <h2 className="section-title">1. 본인 사진 선택</h2>
          <p className="section-sub">
            혼자 정면으로 찍은 상반신 사진이 가장 자연스럽게 합성됩니다.<br />
            여러 명이 함께 찍힌 사진은 결과가 일정하지 않을 수 있어요.
          </p>

          <div className={`photo-area ${userPhotoPreview ? 'has-photo' : ''}`}>
            {userPhotoPreview ? (
              <img src={userPhotoPreview} alt="선택한 사진" />
            ) : (
              <div className="photo-placeholder">
                <div className="photo-placeholder-icon">📷</div>
                <div className="photo-placeholder-text">
                  카메라로 찍거나<br />
                  앨범에서 사진을 선택하세요
                </div>
              </div>
            )}
          </div>

          <div className="photo-buttons">
            <button className="photo-btn" onClick={() => cameraInputRef.current?.click()}>
              📸 카메라로 촬영
            </button>
            <button className="photo-btn primary" onClick={() => fileInputRef.current?.click()}>
              {userPhotoPreview ? '🔄 다시 선택' : '🖼 앨범에서 선택'}
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
          </div>
        </section>

        {/* Step 2 */}
        <section className="section">
          <h2 className="section-title">2. 손피켓 선택</h2>
          <p className="section-sub">총 9종의 캠페인 손피켓 중 마음에 드는 메시지를 골라주세요.</p>

          <div className="picket-grid">
            {PICKETS.map(picket => (
              <div key={picket.id} className="picket-card-wrap">
                <button
                  className={`picket-card ${selectedPicket === picket.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPicket(picket.id)}
                  aria-label={`피켓 선택: ${picket.title}`}
                >
                  <img src={picket.file} alt={picket.title} loading="lazy" />
                  <span className="picket-card-number">{picket.id}</span>
                </button>
                <button
                  className="picket-zoom-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewPicketId(picket.id);
                  }}
                  aria-label={`피켓 크게 보기: ${picket.title}`}
                >
                  🔍
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3 */}
        <section className="section">
          <h2 className="section-title">3. AI 합성</h2>
          <p className="section-sub">
            {step1Done && step2Done
              ? '아래 버튼을 누르면 약 10~20초 후 완성된 이미지를 확인할 수 있습니다.'
              : '사진 선택과 피켓 선택을 먼저 완료해주세요.'}
          </p>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={!step1Done || !step2Done || loading}
          >
            ✨ {resultImage ? '다시 합성하기' : 'AI로 인증샷 만들기'}
          </button>

          {error && <div className="error">⚠ {error}</div>}

          {resultImage && (
            <div style={{ marginTop: 20 }}>
              <img src={resultImage} alt="완성된 인증샷" className="result-image" />

              <div className="result-buttons">
                <button className="result-btn primary" onClick={handleDownload}>
                  💾 다운로드
                </button>
                <button className="result-btn" onClick={handleShare}>
                  📤 공유하기
                </button>
              </div>

              {picketMeta && (
                <>
                  <div className="nominee-box">
                    <div className="nominee-box-label">🙋 다음 릴레이로 지목할 분</div>
                    <p className="nominee-help">
                      세 분의 이름을 입력하시면 아래 게시용 문구에 자동으로 들어갑니다. (선택)
                    </p>
                    <div className="nominee-inputs">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="nominee-input-wrap">
                          <span className="nominee-at">@</span>
                          <input
                            type="text"
                            className="nominee-input"
                            placeholder={`이름 ${i + 1}`}
                            value={nominees[i]}
                            onChange={e => {
                              const next = [...nominees];
                              next[i] = e.target.value;
                              setNominees(next);
                            }}
                            maxLength={20}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hashtag-box">
                    <button
                      className={`hashtag-copy ${hashtagCopied ? 'copied' : ''}`}
                      onClick={handleCopyHashtag}
                    >
                      {hashtagCopied ? '✓ 복사됨' : '📋 복사'}
                    </button>
                    <div className="hashtag-box-label">📌 SNS 게시용 문구</div>
                    <div className="hashtag-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {buildHashtagText(selectedPicket, nominees)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        © 2026 서울특별시사회복지사협회 공정위원회<br />
        AI 합성: Google Vertex AI · Gemini 2.5 Flash Image
      </footer>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-text">AI가 합성 중입니다</div>
          <div className="loading-sub">약 10~20초 정도 소요됩니다</div>
        </div>
      )}

      {/* Picket Preview Modal */}
      {previewPicketId !== null && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewPicketId(null)}
        >
          <div
            className="picket-preview-modal"
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const p = PICKETS.find(x => x.id === previewPicketId);
              if (!p) return null;
              const isSelected = selectedPicket === p.id;
              return (
                <>
                  <button
                    className="picket-preview-close"
                    onClick={() => setPreviewPicketId(null)}
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                  <img src={p.file} alt={p.title} className="picket-preview-image" />
                  <div className="picket-preview-info">
                    <div className="picket-preview-number">손피켓 {p.id}</div>
                    <div className="picket-preview-title">{p.title}</div>
                  </div>
                  <button
                    className={`picket-preview-select ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedPicket(p.id);
                      setPreviewPicketId(null);
                    }}
                  >
                    {isSelected ? '✓ 선택됨' : '이 피켓 선택하기'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
