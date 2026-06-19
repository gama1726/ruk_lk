import { ScreenHeader, NoData } from '@/ui'

type Props = {
  title: string
  note?: string
}

export function ComingSoon({ title, note }: Props) {
  return (
    <>
      <ScreenHeader title={title} subtitle={note} />
      <NoData title="Пока нет данных" />
    </>
  )
}
