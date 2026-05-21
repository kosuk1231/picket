// 피켓 메타데이터: 각 피켓의 핵심 메시지와 매칭 해시태그
export const PICKETS = [
  {
    id: 1,
    file: '/pickets/picket-1.png',
    title: '동일한 복지업무, 동일한 경력인정',
    subtitle: '공정한 경력인정이 전문성 강화로',
    tags: ['#동일업무동일경력', '#공정한경력인정', '#전문성강화'],
  },
  {
    id: 2,
    file: '/pickets/picket-2.png',
    title: '지속 가능한 일자리가 지속 가능한 서울복지를',
    subtitle: '안정된 일자리가 서울복지의 미래',
    tags: ['#지속가능한일자리', '#서울복지의미래', '#안정된일자리'],
  },
  {
    id: 3,
    file: '/pickets/picket-3.png',
    title: '청년 사회복지사가 머무를 수 있는 현장',
    subtitle: '청년이 머무는 현장이 더 나은 복지의 시작',
    tags: ['#청년사회복지사', '#청년이머무는현장', '#더나은복지'],
  },
  {
    id: 4,
    file: '/pickets/picket-4.png',
    title: '안정된 처우 보장은 균등한 서비스의 첫걸음',
    subtitle: '안정된 처우가 균등한 복지 서비스를 실현',
    tags: ['#안정된처우보장', '#균등한복지서비스', '#처우개선'],
  },
  {
    id: 5,
    file: '/pickets/picket-5.png',
    title: '고용이 안정되어야 복지서비스도 안정',
    subtitle: '사회복지사의 안정이 모두의 복지',
    tags: ['#고용안정', '#사회복지사안정', '#모두의복지'],
  },
  {
    id: 6,
    file: '/pickets/picket-6.png',
    title: '시설 위탁이 종사자의 고용불안으로 이어져서는 안 됩니다',
    subtitle: '안정된 고용, 지속 가능한 복지, 함께 지키는 가치',
    tags: ['#시설위탁', '#고용불안해소', '#안정된고용'],
  },
  {
    id: 7,
    file: '/pickets/picket-7.png',
    title: '서울시가 위탁한 복지업무에는 책임도 함께',
    subtitle: '책임 있는 위탁이 시민의 권리 보호로',
    tags: ['#책임있는위탁', '#서울시책임', '#시민권리보호'],
  },
  {
    id: 8,
    file: '/pickets/picket-8.png',
    title: '경력은 온전히, 복리후생은 차별 없이',
    subtitle: '차별 없는 처우가 전문성과 지속가능성을',
    tags: ['#차별없는처우', '#복리후생차별없이', '#온전한경력인정'],
  },
  {
    id: 9,
    file: '/pickets/picket-9.png',
    title: '조례시설이라는 이름으로 경력을 낮게 인정해서는 안 됩니다',
    subtitle: '동일한 업무, 동일한 경력, 동일한 가치',
    tags: ['#조례시설차별철폐', '#공정한경력인정', '#동일가치동일인정'],
  },
];

// 공통 해시태그 (모든 인증샷에 들어가는 협회 캠페인 태그)
export const COMMON_TAGS = [
  '#서울특별시사회복지사협회',
  '#공정위원회',
  '#사회복지사처우개선',
  '#손피켓인증',
];

/**
 * 선택된 피켓에 맞춰 최종 해시태그 텍스트 생성
 */
export function buildHashtagText(picketId, customMessage = '') {
  const picket = PICKETS.find(p => p.id === picketId);
  if (!picket) return '';

  const intro = customMessage ||
    `"${picket.title}"\n\n서울특별시사회복지사협회 공정위원회와 함께\n사회복지사 처우개선과 공정한 경력인정을 응원합니다.`;

  const tagLine = [...picket.tags, ...COMMON_TAGS].join(' ');

  return `${intro}\n\n${tagLine}`;
}
