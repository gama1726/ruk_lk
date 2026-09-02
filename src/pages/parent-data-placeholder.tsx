import { ParentDataSection } from '@/layout/parent-locked-section'

type Props = {
  title: string
}

export function ParentDataPlaceholder({ title }: Props) {
  return (
    <ParentDataSection title={title}>
      <div style={{ padding: '1.5rem 0' }}>
        <h1>{title}</h1>
        <p style={{ color: 'var(--color-text-muted, #666)' }}>
          Раздел будет подключён к данным 1С для родительского кабинета.
        </p>
      </div>
    </ParentDataSection>
  )
}
