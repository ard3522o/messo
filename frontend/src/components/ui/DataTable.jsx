import clsx from 'clsx';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  rows = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search query.',
  emptyAction,
  keyField = '_id',
  rowClassName,
  className,
}) {
  return (
    <div className={clsx('table-wrap', className)}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.thClassName}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="h-4 skeleton" style={{ width: `${60 + ((i * 13 + col.key.length * 7) % 35)}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row, index) => (
                <tr key={row[keyField] || index} className={rowClassName?.(row)}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && !rows.length && (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      )}
    </div>
  );
}
