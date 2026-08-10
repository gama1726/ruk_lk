/**
 * @file Новости университета (new.ruc.su/blog) — горизонтальная «живая лента».
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { ApiError } from '@/apiClient'
import { fetchStudentNews, isNewsApiEnabled, type StudentNewsItemDto } from '@/news'
import { useReadState } from '@/notice-read'
import { ScreenHeader, NoData } from '@/ui'
import styles from './news.module.css'

function formatNewsDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const dd = String(d).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${dd}.${mm}.${y}`
}

/**
 * Горизонтальный скролл с перетаскиванием мышью.
 */
function useDragScroll(ref: RefObject<HTMLDivElement | null>) {
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })
  const [progress, setProgress] = useState(0)
  const [thumbRatio, setThumbRatio] = useState(1)

  const updateProgress = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max <= 0 ? 0 : el.scrollLeft / max)
    setThumbRatio(el.scrollWidth <= 0 ? 1 : Math.min(1, el.clientWidth / el.scrollWidth))
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    updateProgress()
    const onScroll = () => updateProgress()
    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(updateProgress)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [ref, updateProgress])

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    }
    el.setPointerCapture(e.pointerId)
    el.classList.add(styles.trackDragging)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current.active) return
    const el = ref.current
    if (!el) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 4) drag.current.moved = true
    el.scrollLeft = drag.current.scrollLeft - dx
  }

  const endDrag = (e: PointerEvent) => {
    if (!drag.current.active) return
    const el = ref.current
    drag.current.active = false
    el?.classList.remove(styles.trackDragging)
    try {
      el?.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }

  const wasDragged = () => drag.current.moved

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    progress,
    thumbRatio,
    wasDragged,
  }
}

/**
 * Лента новостей с сайта университета.
 */
export function News() {
  const apiEnabled = isNewsApiEnabled()
  const [items, setItems] = useState<StudentNewsItemDto[]>([])
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const isRead = useReadState((s) => s.isRead)
  const setRead = useReadState((s) => s.setRead)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragScroll = useDragScroll(trackRef)

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false)
      setUnavailable(true)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchStudentNews()
      .then((dto) => {
        if (cancelled) return
        if (dto.status === 'unavailable') {
          setUnavailable(true)
          setItems([])
          return
        }
        setUnavailable(false)
        setItems([...dto.items].sort((a, b) => (b.date || '').localeCompare(a.date || '')))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить новости')
        setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  const openNews = (n: StudentNewsItemDto) => {
    if (dragScroll.wasDragged()) return
    setRead(n.id, true)
    window.open(n.url, '_blank', 'noopener,noreferrer')
  }

  const thumbWidthPct = Math.max(14, thumbPct(dragScroll.thumbRatio))
  const thumbLeftPct = dragScroll.progress * (100 - thumbWidthPct)

  return (
    <>
      <ScreenHeader title="Новости" subtitle="Объявления с сайта университета" />

      {loading && <p className={styles.status}>Загрузка…</p>}
      {error && <p className={styles.status}>{error}</p>}
      {!loading && !error && unavailable && (
        <p className={styles.status}>Новости временно недоступны.</p>
      )}

      {!loading && !error && !unavailable && items.length === 0 ? (
        <NoData title="Нет новостей" description="Лента пока пуста." />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <section className={styles.panel} aria-label="Живая лента">
          <h2 className={styles.panelTitle}>Живая лента</h2>

          <div
            ref={trackRef}
            className={styles.track}
            onPointerDown={dragScroll.onPointerDown}
            onPointerMove={dragScroll.onPointerMove}
            onPointerUp={dragScroll.onPointerUp}
            onPointerCancel={dragScroll.onPointerCancel}
          >
            {items.map((n) => {
              const read = isRead(n.id)
              return (
                <article
                  key={n.id}
                  className={[styles.card, !read ? styles.cardUnread : ''].filter(Boolean).join(' ')}
                >
                  <button
                    type="button"
                    className={styles.cardBtn}
                    onClick={() => openNews(n)}
                    aria-label={n.title}
                  >
                    <div className={styles.coverWrap}>
                      {n.imageUrl ? (
                        <img
                          src={n.imageUrl}
                          alt=""
                          className={styles.cover}
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <div className={styles.coverPlaceholder} aria-hidden />
                      )}
                    </div>
                    <h3 className={styles.cardTitle}>{n.title}</h3>
                    {n.date ? <p className={styles.cardDate}>{formatNewsDate(n.date)}</p> : null}
                  </button>
                </article>
              )
            })}
          </div>

          {dragScroll.thumbRatio < 0.98 ? (
            <div className={styles.scrollBar} aria-hidden>
              <div
                className={styles.scrollThumb}
                style={{ width: `${thumbWidthPct}%`, left: `${thumbLeftPct}%` }}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  )
}

function thumbPct(ratio: number): number {
  return Math.min(100, Math.max(14, ratio * 100))
}
