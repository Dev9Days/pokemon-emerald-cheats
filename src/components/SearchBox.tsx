import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SearchBox({
  query,
  onBlur,
  onFocus,
  onSearch,
}: {
  query: string;
  onBlur?: () => void;
  onFocus?: () => void;
  onSearch: (query: string) => void;
}) {
  const [draftQuery, setDraftQuery] = useState(query);
  const isComposingRef = useRef(false);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (isComposingRef.current) return;
        onSearch(draftQuery);
      }}
    >
      <input
        value={draftQuery}
        onChange={(event) => setDraftQuery(event.target.value)}
        onBlur={onBlur}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onFocus={onFocus}
        placeholder="치트명, 비고 검색"
      />
      <button type="submit" aria-label="검색">
        <Search size={17} />
      </button>
    </form>
  );
}
