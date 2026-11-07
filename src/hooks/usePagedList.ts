"use client";

import { useMemo, useState } from "react";

/** Paginate an already-filtered list. Resets to page 1 when filtered length shrinks past current page. */
export function usePagedList<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  function goToPage(next: number) {
    setPage(Math.max(1, Math.min(next, pageCount)));
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function resetPage() {
    setPage(1);
  }

  return {
    page: safePage,
    pageCount,
    pageSize,
    rows,
    setPage: goToPage,
    setPageSize: changePageSize,
    resetPage,
  };
}
