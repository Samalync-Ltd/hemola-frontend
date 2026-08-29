import React from 'react';
import styles from './DataTable.module.css';
export function DataTable({ data, columns, keyExtractor, emptyMessage = 'لا توجد بيانات' }) {
    return (<div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (<th key={col.key} className={styles.th}>{col.header}</th>))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (<tr>
              <td colSpan={columns.length} className={styles.emptyState}>
                {emptyMessage}
              </td>
            </tr>) : (data.map(item => (<tr key={keyExtractor(item)} className={styles.tr}>
                {columns.map(col => (<td key={col.key} className={styles.td} data-label={col.header}>
                    {col.render(item)}
                  </td>))}
              </tr>)))}
        </tbody>
      </table>
    </div>);
}
