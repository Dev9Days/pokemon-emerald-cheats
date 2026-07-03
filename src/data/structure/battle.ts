import type { CheatGroup } from "../../types/cheat";

export const battleGroup: CheatGroup = {
  id: "battle",
  title: "전투",
  cheats: [
    {
      id: "무한-pp",
      title: "무한 PP",
      codeType: "Action Replay MAX",
      codes: [],
      note: "기술 사용 횟수 무제한",
    },
    {
      id: "상대방-포켓몬-잡기",
      title: "상대방 포켓몬 잡기",
      codeType: "Action Replay MAX",
      codes: [],
      note: "L+R 버튼을 동시에 누른 상태로 몬스터볼을 던지세요. 던지자 마자 떼도 괜찮습니다.",
    },
    {
      id: "항상-내-턴",
      title: "항상 내 턴",
      codeType: "Action Replay MAX",
      codes: [],
    },
    {
      id: "전투-후-경험치",
      title: "전투 후 경험치",
      codeType: "Action Replay MAX",
      codes: [],
      variants: [
        {
          id: "battle.exp.250",
          title: "경험치 250",
          codes: [],
        },
        {
          id: "battle.exp.500",
          title: "경험치 500",
          codes: [],
        },
        {
          id: "battle.exp.1000",
          title: "경험치 1000",
          codes: [],
        },
        {
          id: "battle.exp.9999",
          title: "경험치 9999",
          codes: [],
        },
      ],
      note: "레벨업을 멈추고 싶다면 치트를 비활성화 하세요\n비활성화시 잔여 경험치만큼 더 레벨업을 하고 멈춥니다",
    },
    {
      id: "상대-포켓몬-체력-1",
      title: "상대 포켓몬 체력 1",
      codeType: "Action Replay MAX",
      codes: [],
    },
  ],
};
