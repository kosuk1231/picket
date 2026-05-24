// 피켓 메타데이터
export const PICKETS = [
  { id: 1, file: '/pickets/picket-1.png', title: '동일한 복지업무, 동일한 경력인정' },
  { id: 2, file: '/pickets/picket-2.png', title: '지속 가능한 일자리가 지속 가능한 서울복지를' },
  { id: 3, file: '/pickets/picket-3.png', title: '청년 사회복지사가 머무를 수 있는 현장' },
  { id: 4, file: '/pickets/picket-4.png', title: '안정된 처우 보장은 균등한 서비스의 첫걸음' },
  { id: 5, file: '/pickets/picket-5.png', title: '고용이 안정되어야 복지서비스도 안정' },
  { id: 6, file: '/pickets/picket-6.png', title: '시설 위탁이 종사자의 고용불안으로 이어져서는 안 됩니다' },
  { id: 7, file: '/pickets/picket-7.png', title: '서울시가 위탁한 복지업무에는 책임도 함께' },
  { id: 8, file: '/pickets/picket-8.png', title: '경력은 온전히, 복리후생은 차별 없이' },
  { id: 9, file: '/pickets/picket-9.png', title: '조례시설이라는 이름으로 경력을 낮게 인정해서는 안 됩니다' },
  { id: 10, file: '/pickets/picket-10.png', title: '나, 사회복지사는 서울시 조례시설 등의 동일한 복지업무, 동일한 처우개선을 위해 함께합니다' },
];

// 공통 캠페인 해시태그 (5개 고정)
export const HASHTAGS = [
  '#서사협_공정위원회',
  '#동일한복지업무동일한경력인정',
  '#경력은온전히',
  '#복리후생은차별없이',
  '#지속가능한서울복지',
];

// 지목 이름 placeholder (입력 안 한 경우 기본값)
export const DEFAULT_TAGS = ['___', '___', '___'];

/**
 * 릴레이 캠페인 SNS 게시용 문구 생성
 *
 * @param {number} picketId - 선택한 피켓 ID
 * @param {string[]} nominees - 지목할 사람 이름 3개 (선택)
 * @returns {string} 완성된 게시용 문구
 */
export function buildHashtagText(picketId, nominees = []) {
  const picket = PICKETS.find(p => p.id === picketId);
  if (!picket) return '';

  // 지목 이름 3개 채우기 (입력 안 된 자리는 ___로)
  const names = [0, 1, 2].map(i => {
    const name = (nominees[i] || '').trim();
    return name || DEFAULT_TAGS[i];
  });
  const mentionLine = names.map(n => `@${n}`).join(' ');

  // 해시태그를 줄바꿈해서 한 줄에 하나씩
  const tagBlock = HASHTAGS.join('\n');

  return `서울특별시사회복지사협회 공정위원회 온라인 이슈 파이팅 릴레이에 함께합니다. (~6/2)

시설 이름은 다를 수 있지만, 시민을 만나고 지원하는 복지업무의 가치는 다르지 않습니다.
같은 복지업무를 했다면 경력도 공정하게 인정되어야 하고, 복리후생과 처우개선에서도 차별이 없어야 합니다.

저는 오늘 이 문구에 이슈 파이팅에 함께합니다.
"${picket.title}"

현장의 목소리를 함께 확산해주세요.

저는 다음으로 ${mentionLine} 님을 지목합니다.

바쁘시더라도 함께해주시면 감사하겠습니다.
🛠 인증샷 만들기 : https://fair-picket.vercel.app

${tagBlock}`;
}
