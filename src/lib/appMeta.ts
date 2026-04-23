import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;

export type AppReleaseNote = {
  version: string;
  releasedAt: string;
  title: string;
  changes: string[];
};

export const APP_RELEASE_NOTES: AppReleaseNote[] = [
  {
    version: "0.4.0",
    releasedAt: "2026-04-24",
    title: "달력 삭제와 일정 구분 기능 추가",
    changes: [
      "달력 날짜 팝업에서도 일정을 바로 삭제할 수 있게 했습니다.",
      "일정에 색상과 태그를 지정할 수 있고, 달력과 일정 목록에 같은 톤으로 표시됩니다.",
      "일정 상세 편집 화면에서도 태그와 색상을 수정할 수 있게 정리했습니다.",
    ],
  },
  {
    version: "0.3.1",
    releasedAt: "2026-04-24",
    title: "테마 대비와 프로필 메뉴 레이아웃 보정",
    changes: [
      "라이트 모드에서는 선택된 컨트롤 글자가 어둡게, 다크 모드에서는 밝게 보이도록 선택 상태 색을 정리했습니다.",
      "프로필 메뉴를 모바일 바텀시트와 데스크톱 중앙 시트로 재배치해 우측에 붙는 느낌을 줄였습니다.",
      "멤버 목록이 잘리지 않도록 메뉴 전체 스크롤 구조를 다시 정리했습니다.",
    ],
  },
  {
    version: "0.3.0",
    releasedAt: "2026-04-24",
    title: "일정 화면과 버전 노출 정리",
    changes: [
      "일정 탭 데스크톱 레이아웃 폭을 다시 넓히고, 보조 패널 노출 구간을 조정했습니다.",
      "헤더의 버전 배지를 누르면 현재 버전과 이전 버전의 업데이트 내역을 볼 수 있습니다.",
      "앱 버전이 package.json과 자동으로 연동되도록 정리해 표시값이 어긋나지 않게 했습니다.",
    ],
  },
  {
    version: "0.2.0",
    releasedAt: "2026-04-24",
    title: "공유, 프로필, 캘린더 경험 개선",
    changes: [
      "공유 링크 입장, 최근 방 목록, 닉네임과 개인화 메뉴를 추가했습니다.",
      "모바일과 PC 달력 레이아웃, 이번 달 일정 패널, 일정 생성 흐름을 다듬었습니다.",
      "대한민국 공휴일, 메모 마커, 다크 모드 표시를 반영했습니다.",
    ],
  },
];
