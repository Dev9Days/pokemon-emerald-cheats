import { MessageCircle } from "lucide-react";
import type { RefObject } from "react";
import { SearchBox } from "./SearchBox";

type BrowserToolbarProps = {
  activeSectionTitle: string;
  isInputFocused: boolean;
  isSearching: boolean;
  onClearSearch: () => void;
  onSearchCompositionEnd: (query: string) => void;
  onSearchCompositionStart: () => void;
  onOpenComments: () => void;
  onOpenNavigation: () => void;
  onSearchBlur: () => void;
  onSearchFocus: () => void;
  onQueryChange: (query: string, isComposing: boolean) => void;
  query: string;
  toolbarRef: RefObject<HTMLDivElement | null>;
};

export function BrowserToolbar({
  activeSectionTitle,
  isInputFocused,
  isSearching,
  onClearSearch,
  onSearchCompositionEnd,
  onSearchCompositionStart,
  onOpenComments,
  onOpenNavigation,
  onSearchBlur,
  onSearchFocus,
  onQueryChange,
  query,
  toolbarRef,
}: BrowserToolbarProps) {
  return (
    <div
      ref={toolbarRef}
      className={`toolbar${isInputFocused ? " is-input-focused" : ""}${isSearching ? " is-searching" : ""}`}
    >
      <div className="desktop-search">
        <SearchBox query={query} onQueryChange={onQueryChange} />
      </div>
      <div className="mobile-controls">
        <div className="mobile-search-row">
          <SearchBox
            query={query}
            onBlur={onSearchBlur}
            onCompositionEnd={onSearchCompositionEnd}
            onCompositionStart={onSearchCompositionStart}
            onFocus={onSearchFocus}
            onQueryChange={onQueryChange}
          />
          <button className="mobile-comment-button" type="button" onClick={onOpenComments} aria-label="댓글 열기">
            <MessageCircle size={17} />
          </button>
        </div>
        {isSearching ? (
          <button className="mobile-overlay-trigger mobile-overlay-trigger--clear" type="button" onClick={onClearSearch}>
            <span className="mobile-overlay-trigger__current">
              <span>검색 결과</span>
            </span>
            <span className="mobile-overlay-trigger__hint">검색 초기화</span>
          </button>
        ) : (
          <button className="mobile-overlay-trigger" type="button" onClick={onOpenNavigation}>
            <span className="mobile-overlay-trigger__current">
              <span>{activeSectionTitle}</span>
            </span>
            <span className="mobile-overlay-trigger__hint">목록 열기</span>
          </button>
        )}
      </div>
    </div>
  );
}
