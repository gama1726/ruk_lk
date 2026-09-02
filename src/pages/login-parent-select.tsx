/**
 * @file Вход для родителя — шаг 2: выбор роли без ФИО.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/paths'
import { useParentAuth } from '@/parent-auth'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { roleIcon, roleTitle } from '@/icons/parent-role-icons'
import form from './auth-form.module.css'
import pub from './public.module.css'
import styles from './login-parent-select.module.css'

export function ParentLoginSelect() {
  const navigate = useNavigate()
  const pendingFamily = useParentAuth((s) => s.pendingFamily)
  const selectMember = useParentAuth((s) => s.selectMember)
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

  const handleSelect = async (memberIndex: number) => {
    setError(undefined)
    setBusyIndex(memberIndex)
    const err = await selectMember(memberIndex)
    setBusyIndex(null)
    if (err) {
      setError(err)
      return
    }
    navigate(paths.loginParentDelivery)
  }

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>Кто вы?</p>
        <p className={form.hint}>Выберите вашу роль. ФИО не показываем — только способ входа на следующем шаге.</p>

        <div className={styles.wrap}>
          <div className={styles.grid}>
            {pendingFamily.members.map((member) => {
              const Icon = roleIcon(member.relationKind)
              const title = roleTitle(member.relationKind, member.relation)
              const disabled = !member.loginAvailable || busyIndex !== null
              return (
                <button
                  key={member.memberIndex}
                  type="button"
                  className={styles.card}
                  disabled={disabled}
                  onClick={() => void handleSelect(member.memberIndex)}
                >
                  <Icon className={styles.icon} />
                  <span className={styles.title}>{title}</span>
                  {member.isCustomer && <span className={styles.badge}>Заказчик по договору</span>}
                  {!member.loginAvailable && (
                    <span className={styles.hint}>
                      Нет email и телефона в базе. Обратитесь в деканат.
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className={form.error}>{error}</p>}

        <p className={card.forgotRow}>
          <Link to={paths.loginParent}>Назад</Link>
        </p>
      </AuthCard>
      <p className={pub.back}>
        <Link to={paths.login}>Вход для студента</Link>
      </p>
    </>
  )
}
