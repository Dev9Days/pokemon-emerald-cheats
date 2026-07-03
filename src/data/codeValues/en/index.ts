import type { CheatCodeValues } from "../../cheatDataBuilder";
import { mergeCheatCodeValues } from "../../cheatDataBuilder";
import { codeValuesEnRequired } from "./required";
import { codeValuesEnItems } from "./items";
import { codeValuesEnBattle } from "./battle";
import { codeValuesEnPokemon } from "./pokemon";
import { codeValuesEnTeleport } from "./teleport";
import { codeValuesEnRemote } from "./remote";
import { codeValuesEnSystem } from "./system";

export const cheatCodeValuesEn: CheatCodeValues = mergeCheatCodeValues([
  codeValuesEnRequired,
  codeValuesEnItems,
  codeValuesEnBattle,
  codeValuesEnPokemon,
  codeValuesEnTeleport,
  codeValuesEnRemote,
  codeValuesEnSystem,
]);
