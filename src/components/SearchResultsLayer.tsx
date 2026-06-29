import { useLayoutEffect, useRef } from "react";
import type { CheatGroup } from "../types/cheat";
import { CheatGroupView } from "./CheatGroupView";

type SearchResultsLayerProps = {
  groups: CheatGroup[];
  hasQuery: boolean;
  isSearching: boolean;
  resetKey: string;
};

export function SearchResultsLayer({ groups, hasQuery, isSearching, resetKey }: SearchResultsLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const canShowResults = isSearching && hasQuery;

  useLayoutEffect(() => {
    if (!isSearching) return;
    const layer = layerRef.current;
    const scroller = scrollerRef.current;

    if (layer) layer.scrollTop = 0;
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(window.scrollX, 0);

    const frameId = window.requestAnimationFrame(() => {
      if (layer) layer.scrollTop = 0;
      if (scroller) scroller.scrollTop = 0;
      window.scrollTo(window.scrollX, 0);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isSearching, resetKey]);

  return (
    <div
      ref={layerRef}
      className={`search-results-layer${isSearching ? " is-active" : ""}`}
      aria-hidden={!isSearching}
    >
      <div className="search-results-scroller" ref={scrollerRef}>
        <div className="search-results-inner">
          {canShowResults && groups.length > 0 ? (
            <div className="group-list group-list--search-results">
              {groups.map((group) => (
                <CheatGroupView key={group.id} group={group} />
              ))}
            </div>
          ) : null}
          {canShowResults && groups.length === 0 ? <p className="empty-state">표시할 치트가 없습니다.</p> : null}
        </div>
      </div>
    </div>
  );
}
