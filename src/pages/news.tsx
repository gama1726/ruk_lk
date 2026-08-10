/**
 * @file Новости университета (new.ruc.su/blog) — горизонтальная «живая лента».
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react'
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
 * Capture включается только после порога — обычный клик по ссылке работает.
 */
function useDragScroll(ref: RefObject<HTMLDivElement | null>) {
  const drag = useRef({
    active: false,
    dragging: false,
    startX: 0,
    scrollLeft: 0,
    suppressClick: false,
  })
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
      dragging: false,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      suppressClick: false,
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current.active) return
    const el = ref.current
    if (!el) return
    const dx = e.clientX - drag.current.startX
    if (!drag.current.dragging && Math.abs(dx) > 6) {
      drag.current.dragging = true
      drag.current.suppressClick = true
      el.setPointerCapture(e.pointerId)
      el.classList.add(styles.trackDragging)
    }
    if (drag.current.dragging) {
      el.scrollLeft = drag.current.scrollLeft - dx
    }
  }

  const endDrag = (e: PointerEvent) => {
    if (!drag.current.active) return
    const el = ref.current
    const wasDragging = drag.current.dragging
    drag.current.active = false
    drag.current.dragging = false
    el?.classList.remove(styles.trackDragging)
    if (wasDragging) {
      try {
        el?.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }
  }

  const onCardClick = (e: MouseEvent) => {
    if (drag.current.suppressClick) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.suppressClick = false
    }
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onCardClick,
    progress,
    thumbRatio,
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

  const thumbWidthPct = Math.max(14, thumbPct(dragScroll.thumbRatio))
  const thumbLeftPct = dragScroll.progress * (100 - thumbWidthPct)

  return (
    <>
      <ScreenHeader title="Новости" />

      {loading && <p className={styles.status}>Загрузка…</p>}
      {error && <p className={styles.status}>{error}</p>}
      {!loading && !error && unavailable && (
        <p className={styles.status}>Новости временно недоступны.</p>
      )}

      {!loading && !error && !unavailable && items.length === 0 ? (
        <NoData title="Нет новостей" description="За этот месяц пока нет публикаций." />
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
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.cardLink}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onClick={(e) => {
                      dragScroll.onCardClick(e)
                      if (!e.defaultPrevented) setRead(n.id, true)
                    }}
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
                  </a>
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
