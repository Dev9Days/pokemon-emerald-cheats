import type { CheatGroup } from "../../types/cheat";
import {
  createItemStructureVariants,
} from "../structureVariantGenerators";

export const itemsGroup: CheatGroup = {
  id: "items",
  title: "아이템 · 상점 · PC",
  cheats: [
    {
      id: "items.shop.free",
      title: "상점 아이템 가격 0원",
      codeType: "Codebreaker",
      codes: [],
      note: "최대 1개만 선택되는 경우 \"수량 99개 선택\" 치트를 사용해보세요."
    },
    {
      id: "items.shop.count-99",
      title: "수량 99개 선택",
      codeType: "Action Replay MAX",
      codes: [],
      note: "개수 선택 화면에서 L 버튼을 누른 상태로 구매하세요."
    }
  ],
  children: [
    {
      id: "items.shop.change",
      title: "상점 1번 아이템 바꾸기",
      cheats: [
        {
          id: "items.shop.change.generated",
          title: "상점 1번 아이템 바꾸기",
          codeType: "Codebreaker",
          codes: [],
          variants: createItemStructureVariants("item"),
          note: "상점 첫 번째 상품을 선택한 아이템으로 바꿉니다.\n티켓류는 \"미스터리 기프트 NPC · 티켓 이벤트\" 치트를 함께 사용하세요."
        }
      ]
    },
    {
      id: "items.pc.add",
      title: "PC 도구함 아이템 추가(999개)",
      cheats: [
        {
          id: "items.pc.add.generated",
          title: "PC 도구함 아이템 추가(999개)",
          codeType: "Codebreaker",
          codes: [],
          variants: createItemStructureVariants("pc-item"),
          note: `치트는 추가 즉시 비활성화 하세요.\n활성화 시 [도구를 꺼낸다/도구를 버린다]를 선택할 때 마다 동일 아이템이 계속 추가됩니다.`
        }
      ]
    }
  ]
};
