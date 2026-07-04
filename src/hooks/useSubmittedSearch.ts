import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SubmittedSearchState = {
  hasFilterQuery: boolean;
  isSearchActive: boolean;
  normalizedFilterQuery: string;
  query: string;
  resetSearch: () => void;
  submitSearch: (query: string) => void;
};

export function useSubmittedSearch(cleanupDelayMs: number): SubmittedSearchState {
  const [query, setQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [isSearchSessionActive, setIsSearchSessionActive] = useState(false);
  const cleanupTimerRef = useRef<number | null>(null);

  const normalizedFilterQuery = useMemo(() => filterQuery.trim().toLowerCase(), [filterQuery]);
  const hasFilterQuery = normalizedFilterQuery.length > 0;
  const hasSearchText = query.trim().length > 0 || hasFilterQuery;
  const isSearchActive = isSearchSessionActive && hasSearchText;

  const clearCleanupTimer = useCallback(() => {
    if (cleanupTimerRef.current === null) return;
    window.clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearCleanupTimer();
  }, [clearCleanupTimer]);

  const resetSearch = useCallback(() => {
    clearCleanupTimer();
    setIsSearchSessionActive(false);
    setQuery("");
    cleanupTimerRef.current = window.setTimeout(() => {
      cleanupTimerRef.current = null;
      setFilterQuery("");
    }, cleanupDelayMs);
  }, [cleanupDelayMs, clearCleanupTimer]);

  const submitSearch = useCallback((nextQuery: string) => {
    const nextFilterQuery = nextQuery.trim();

    clearCleanupTimer();
    setQuery(nextQuery);
    setFilterQuery(nextFilterQuery);
    setIsSearchSessionActive(nextFilterQuery.length > 0);
  }, [clearCleanupTimer]);

  return {
    hasFilterQuery,
    isSearchActive,
    normalizedFilterQuery,
    query,
    resetSearch,
    submitSearch,
  };
}
