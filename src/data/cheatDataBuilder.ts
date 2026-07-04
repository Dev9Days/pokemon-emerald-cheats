import type { CheatEntry, CheatGroup, CheatVariant } from "../types/cheat";
import { itemCatalog, moveCatalog, natureCatalog, pokemonSpeciesCatalog, teleportLocationCatalog } from "./catalogs";
import { getEntryBadges, mergeCheatBadges } from "./cheatMetadata";

type AddressCatalogKind = "item" | "move" | "pokemonSpecies" | "teleport";

export type CatalogCodeValue =
  | {
      kind: AddressCatalogKind;
      address: string;
      extraCodes?: string[];
    }
  | {
      kind: "nature";
      baseCode: string;
    }
  | {
      kind: "starterPokemon";
      slotCode: string;
    };

export type CheatCodeValues = {
  entries: Record<string, string[]>;
  variants: Record<string, string[]>;
  catalogs?: Record<string, CatalogCodeValue>;
};

const cloneCodes = (codes: string[]) => [...codes];

export function mergeCheatCodeValues(parts: CheatCodeValues[]): CheatCodeValues {
  return parts.reduce<CheatCodeValues>(
    (merged, part) => ({
      entries: { ...merged.entries, ...part.entries },
      variants: { ...merged.variants, ...part.variants },
      catalogs:
        merged.catalogs || part.catalogs ? { ...(merged.catalogs ?? {}), ...(part.catalogs ?? {}) } : undefined,
    }),
    { entries: {}, variants: {} },
  );
}

const itemValueById = new Map<string, string>(itemCatalog.map((item) => [item.id, item.value]));
const moveValueById = new Map<string, string>(moveCatalog.map((move) => [move.id, move.value]));
const natureCodeById = new Map<string, string>(natureCatalog.map((nature) => [nature.id, nature.code]));
const pokemonById = new Map<string, (typeof pokemonSpeciesCatalog)[number]>(
  pokemonSpeciesCatalog.map((pokemon) => [pokemon.id, pokemon]),
);
const pokemonBySlug = new Map<string, (typeof pokemonSpeciesCatalog)[number]>(
  pokemonSpeciesCatalog.map((pokemon) => [pokemon.slug, pokemon]),
);
const teleportValueById = new Map<string, string>(
  teleportLocationCatalog.map((location) => [location.id, location.value]),
);

export function getVariantCodes(variant: Pick<CheatVariant, "id">, values: CheatCodeValues): string[] {
  return cloneCodes(values.variants[variant.id] ?? []);
}

function applyVariantCodes(variant: CheatVariant, values: CheatCodeValues): CheatVariant {
  return {
    ...variant,
    codes: getVariantCodes(variant, values),
  };
}

function getIdSuffix(variantId: string) {
  return variantId.split(".").at(-1) ?? variantId;
}

function getCatalogValue(spec: CatalogCodeValue, variantId: string) {
  const suffix = getIdSuffix(variantId);

  if (spec.kind === "item") {
    return itemValueById.get(suffix);
  }

  if (spec.kind === "move") {
    return moveValueById.get(suffix);
  }

  if (spec.kind === "pokemonSpecies") {
    return pokemonById.get(suffix)?.value;
  }

  if (spec.kind === "teleport") {
    return teleportValueById.get(suffix);
  }

  return undefined;
}

export function getCatalogVariantCodes(variantId: string, spec: CatalogCodeValue): string[] {
  if (spec.kind === "nature") {
    const natureCode = natureCodeById.get(getIdSuffix(variantId));
    return natureCode ? [spec.baseCode, natureCode] : [];
  }

  if (spec.kind === "starterPokemon") {
    const pokemon = pokemonBySlug.get(getIdSuffix(variantId));
    return pokemon ? [spec.slotCode, pokemon.starterCode] : [];
  }

  const value = getCatalogValue(spec, variantId);
  return value ? [`${spec.address} ${value}`, ...(spec.extraCodes ?? [])] : [];
}

function applyCatalogVariantCodes(variant: CheatVariant, spec: CatalogCodeValue): CheatVariant {
  return {
    ...variant,
    codes: getCatalogVariantCodes(variant.id, spec),
  };
}

export function getEntryCodes(entry: Pick<CheatEntry, "id">, values: CheatCodeValues): string[] {
  return cloneCodes(values.entries[entry.id] ?? []);
}

function applyEntryCodes(entry: CheatEntry, values: CheatCodeValues, rootGroupId: string): CheatEntry {
  const catalogSpec = values.catalogs?.[entry.id];

  return {
    ...entry,
    codes: getEntryCodes(entry, values),
    badges: mergeCheatBadges(entry.badges, getEntryBadges(entry, rootGroupId)),
    variants: entry.variants?.map((variant) =>
      catalogSpec ? applyCatalogVariantCodes(variant, catalogSpec) : applyVariantCodes(variant, values),
    ),
  };
}

function applyGroupCodes(group: CheatGroup, values: CheatCodeValues, rootGroupId = group.id): CheatGroup {
  return {
    ...group,
    cheats: group.cheats?.map((entry) => applyEntryCodes(entry, values, rootGroupId)),
    children: group.children?.map((child) => applyGroupCodes(child, values, rootGroupId)),
  };
}

export function applyCheatCodeValues(structure: CheatGroup[], values: CheatCodeValues): CheatGroup[] {
  return structure.map((group) => applyGroupCodes(group, values));
}
