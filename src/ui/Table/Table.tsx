import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import styles from './Table.module.css'

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.wrapper}>
      <table className={[styles.table, className ?? ''].filter(Boolean).join(' ')} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props}>{children}</thead>
}

export function TableBody({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props}>{children}</tbody>
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={[styles.tr, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </tr>
  )
}

export function TableHeader({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={[styles.th, className ?? ''].filter(Boolean).join(' ')} scope="col" {...props}>
      {children}
    </th>
  )
}

export function TableCell({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={[styles.td, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </td>
  )
}
