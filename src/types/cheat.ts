export type CheatBuildId = "en" | "kr-20240611" | "kr-20240611-modern" | "kr-20260613";

export type CheatCodeType = "Action Replay MAX" | "Codebreaker" | "Raw";

export type CheatBadgeKind = "key-input" | "master-code";

export type CheatBadge = {
  kind: CheatBadgeKind;
  label: string;
  description?: string;
};

export type CheatVariant = {
  id: string;
  title: string;
  subtitle?: string;
  codes: string[];
  badges?: CheatBadge[];
  note?: string;
};

export type CheatEntry = {
  id: string;
  title: string;
  codeType: CheatCodeType;
  codes: string[];
  badges?: CheatBadge[];
  variants?: CheatVariant[];
  note?: string;
};

export type CheatGroup = {
  id: string;
  title: string;
  children?: CheatGroup[];
  cheats?: CheatEntry[];
};

export type CheatBuild = {
  id: CheatBuildId;
  label: string;
  md5: string;
};
