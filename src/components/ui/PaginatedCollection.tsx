'use client';

import { Children, type CSSProperties, type ReactNode, useMemo, useRef, useState } from 'react';
import PaginationControls from './PaginationControls';

type PaginatedCollectionProps = {
  children: ReactNode;
  itemLabel?: string;
  className?: string;
  style?: CSSProperties;
  resetKey?: string;
  defaultPageSize?: number;
};

export default function PaginatedCollection({ resetKey = '', ...props }: PaginatedCollectionProps) {
  return <PaginatedCollectionState key={resetKey} {...props} />;
}

function PaginatedCollectionState({
  children,
  itemLabel = 'items',
  className,
  style,
  defaultPageSize = 24,
}: Omit<PaginatedCollectionProps, 'resetKey'>) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const collectionRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function returnToCollection() {
    requestAnimationFrame(() => {
      collectionRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      collectionRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      <div
        ref={collectionRef}
        tabIndex={-1}
        aria-label={itemLabel}
        className={className}
        style={{ scrollMarginTop: 100, ...style }}
      >
        {visibleItems}
      </div>
      <PaginationControls
        page={currentPage}
        pageSize={pageSize}
        totalItems={items.length}
        itemLabel={itemLabel}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          returnToCollection();
        }}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
          returnToCollection();
        }}
      />
    </>
  );
}
