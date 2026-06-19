import { type ReactNode, useState } from 'react'
import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  items: TabItem[]
  defaultTab?: string
}

export function Tabs({ items, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.id ?? '')

  const activeItem = items.find((item) => item.id === active)

  return (
    <div className={styles.tabs}>
      <div className={styles.list} role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            className={[styles.tab, active === item.id ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activeItem ? (
        <div
          className={styles.panel}
          role="tabpanel"
          id={`panel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  )
}
