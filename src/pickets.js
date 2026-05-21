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

// 모든 인증샷에 공통으로 들어가는 캠페인 해시태그 (5개 고정)
export const HASHTAGS = [
  '#서사협_공정위원회',
  '#동일한복지업무동일한경력인정',
  '#경력은온전히',
  '#복리후생은차별없이',
  '#지속가능한서울복지',
];

/**
 * SNS 게시용 텍스트 생성
 * 선택한 피켓의 메시지 + 공통 해시태그 5개
 */
export function buildHashtagText(picketId) {
  const picket = PICKETS.find(p => p.id === picketId);
  if (!picket) return '';

  const intro = `"${picket.title}"

서울특별시사회복지사협회 공정위원회와 함께
사회복지사 처우개선과 공정한 경력인정을 응원합니다.`;

  const tagLine = HASHTAGS.join(' ');

  return `${intro}\n\n${tagLine}`;
}
