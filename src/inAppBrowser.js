// 인앱 브라우저 감지 및 외부 브라우저로 이동 유도

/**
 * User Agent로 인앱 브라우저 종류 감지
 */
export function detectInAppBrowser() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';

  // Facebook
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua)) {
    return { type: 'facebook', name: '페이스북' };
  }
  // Instagram
  if (/Instagram/i.test(ua)) {
    return { type: 'instagram', name: '인스타그램' };
  }
  // KakaoTalk
  if (/KAKAOTALK/i.test(ua)) {
    return { type: 'kakaotalk', name: '카카오톡' };
  }
  // Naver app
  if (/NAVER\(inapp/i.test(ua)) {
    return { type: 'naver', name: '네이버 앱' };
  }
  // Band
  if (/BAND\/[\d.]+/i.test(ua)) {
    return { type: 'band', name: '밴드' };
  }
  // LINE
  if (/Line\//i.test(ua)) {
    return { type: 'line', name: '라인' };
  }
  // Twitter / X
  if (/Twitter/i.test(ua)) {
    return { type: 'twitter', name: 'X (트위터)' };
  }

  return null;
}

/**
 * 외부 브라우저로 현재 URL 열기 시도
 * 앱별로 동작이 다르므로 best-effort 방식
 */
export function openInExternalBrowser() {
  const url = window.location.href;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Android: intent URL로 Chrome 강제 실행 시도
  if (isAndroid) {
    // 카카오톡: 자체 outbrowser 스킴
    if (/KAKAOTALK/i.test(ua)) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
      return;
    }

    // 안드로이드 intent URL (Chrome으로 열기)
    const cleanUrl = url.replace(/^https?:\/\//, '');
    window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    return;
  }

  // iOS: 자동으로 외부 브라우저 열기가 어려움 (Safari로 강제 불가)
  // 사용자가 직접 우측 상단 메뉴에서 "Safari로 열기" 누르도록 안내
  if (isIOS) {
    // 클립보드에 URL 복사해주기 (최후의 수단)
    try {
      navigator.clipboard.writeText(url);
    } catch {}
    alert(
      '아이폰에서는 다음 방법으로 열어주세요:\n\n' +
      '1. 우측 하단 또는 상단의 "..." 또는 "공유" 버튼 탭\n' +
      '2. "Safari에서 열기" 선택\n\n' +
      '(주소가 클립보드에 복사되었습니다)'
    );
    return;
  }

  // 그 외: 그냥 새 창 시도
  window.open(url, '_blank');
}
