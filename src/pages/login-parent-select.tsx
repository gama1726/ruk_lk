/**
 * @file Вход для родителя — шаг 2: выбор мамы/папы.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/paths'
import { useParentAuth } from '@/parent-auth'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Button } from '@/ui'
import form from './auth-form.module.css'
import pub from './public.module.css'
import styles from './login-parent-select.module.css'

export function ParentLoginSelect() {
  const navigate = useNavigate()
  const pendingFamily = useParentAuth((s) => s.pendingFamily)
  const selectMember = useParentAuth((s) => s.selectMember)
  const sendCode = useParentAuth((s) => s.sendCode)
  const [error, setError] = useState<string>()
  const [busyIndex, setBusyIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!pendingFamily) {
      navigate(paths.loginParent, { replace: true })
    }
  }, [pendingFamily, navigate])

  if (!pendingFamily) {
    return null
  }

  const proceed = async (memberIndex: number) => {
    setError(undefined)
    setBusyIndex(memberIndex)
    const selectErr = await selectMember(memberIndex)
    if (selectErr) {
      setBusyIndex(null)
      setError(selectErr)
      return
    }
    const sendErr = await sendCode()
    setBusyIndex(null)
    if (sendErr) {
      setError(sendErr)
      return
    }
    navigate(paths.loginParentVerify)
  }

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>Кто вы?</p>
        <p className={form.hint}>
          Студент: <strong>{pendingFamily.studentFullName}</strong>
        </p>
        <div className={styles.list}>
          {pendingFamily.members.map((member) => (
            <button
              key={member.memberIndex}
              type="button"
              className={styles.memberBtn}
              disabled={busyIndex !== null}
              onClick={() => void proceed(member.memberIndex)}
            >
              <span className={styles.relation}>{member.relation}</span>
              <span className={styles.name}>{member.displayName}</span>
              {member.isCustomer ? <span className={styles.badge}>Заказчик по договору</span> : null}
              {member.emailHint ? (
                <span className={styles.hint}>Код на {member.emailHint}</span>
              ) : (
                <span className={styles.hintMuted}>Email в базе не указан</span>
              )}
              {busyIndex === member.memberIndex ? <span className={styles.loading}>Отправляем код…</span> : null}
            </button>
          ))}
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        <Button type="button" variant="ghost" fullWidth onClick={() => navigate(paths.loginParent)}>
          Назад
        </Button>
      </AuthCard>
      <p className={pub.back}>
        <Link to={paths.login}>Вход для студента</Link>
      </p>
    </>
  )
}
