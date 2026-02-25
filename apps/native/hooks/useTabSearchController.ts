import { useMemo, useState } from "react";

import { useSearchResults } from "./useSearch";

type SearchableRoute = {
  name: string;
  label: string;
  icon: string;
};

const MIN_QUERY_LENGTH = 2;
const AUTO_EXPAND_RESULTS_COUNT = 3;
const DROPDOWN_MAX_HEIGHT = 224;
const RESULT_ROW_HEIGHT = 56;
const EMPTY_STATE_HEIGHT = 42;

export function useTabSearchController(routes: ReadonlyArray<SearchableRoute>) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const results = useSearchResults(query, routes);
  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;

  const estimatedResultsHeight = useMemo(() => {
    if (!hasQuery) return 0;
    if (results.length === 0) return EMPTY_STATE_HEIGHT;
    return results.length * RESULT_ROW_HEIGHT;
  }, [hasQuery, results.length]);

  const shouldAutoExpand =
    results.length >= AUTO_EXPAND_RESULTS_COUNT ||
    estimatedResultsHeight > DROPDOWN_MAX_HEIGHT;

  const isFullScreenOpen = hasQuery && isFocused && shouldAutoExpand;
  const showDropdown = hasQuery && isFocused && !isFullScreenOpen;

  const closeSearch = () => {
    setIsFocused(false);
    setQuery("");
  };

  return {
    query,
    setQuery,
    results,
    hasQuery,
    isFocused,
    setIsFocused,
    isFullScreenOpen,
    showDropdown,
    closeSearch,
  };
}
