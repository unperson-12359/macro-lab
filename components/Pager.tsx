import Link from 'next/link';

interface Props {
  /** e.g. /charts — page 1 lives at basePath, page n at `${basePath}/page/n` */
  basePath: string;
  page: number;
  totalPages: number;
}

function href(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}/page/${page}`;
}

export default function Pager({ basePath, page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between border-t border-line pt-5 font-mono text-sm">
      {page > 1 ? (
        <Link
          rel="prev"
          href={href(basePath, page - 1)}
          className="group text-muted hover:text-paper"
        >
          <span className="inline-block transition-transform duration-150 group-hover:-translate-x-1">←</span>{' '}
          prev
        </Link>
      ) : (
        <span />
      )}
      <div className="flex gap-4">
        {pages.map((p) =>
          p === page ? (
            <span key={p} aria-current="page" className="text-[#f7931a] numbers">
              {p}
            </span>
          ) : (
            <Link key={p} href={href(basePath, p)} className="text-muted numbers hover:text-paper">
              {p}
            </Link>
          )
        )}
      </div>
      {page < totalPages ? (
        <Link
          rel="next"
          href={href(basePath, page + 1)}
          className="group text-muted hover:text-paper"
        >
          next{' '}
          <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
