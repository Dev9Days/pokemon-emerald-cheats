import { Search } from "lucide-react";
import { useRef } from "react";

export function SearchBox({
  query,
  onBlur,
  onCompositionEnd,
  onCompositionStart,
  onFocus,
  onQueryChange,
}: {
  query: string;
  onBlur?: () => void;
  onCompositionEnd?: (query: string) => void;
  onCompositionStart?: () => void;
  onFocus?: () => void;
  onQueryChange: (query: string, isComposing: boolean) => void;
}) {
  const isComposingRef = useRef(false);

  return (
    <label className="search-box">
      <Search size={18} />
      <input
        value={query}
        onChange={(event) =>
          onQueryChange(event.target.value, isComposingRef.current || (event.nativeEvent as InputEvent).isComposing)
        }
        onBlur={onBlur}
        onCompositionEnd={(event) => {
          isComposingRef.current = false;
          onCompositionEnd?.(event.currentTarget.value);
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
          onCompositionStart?.();
        }}
        onFocus={onFocus}
        placeholder="치트명, 코드, 비고 검색"
      />
    </label>
  );
}
