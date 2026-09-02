import { useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  universityContactsSourceUrl,
  universityDepartments,
  universityFeedbackLinks,
  universityMainContacts,
  universityPaymentDetails,
  type UniversityBranch,
} from '@/mocks/university-contacts'
import {
  fetchParentProfile,
  isParentProfileApiEnabled,
  parentUniversityContacts,
  type ParentProfileDto,
} from '@/parent-profile'
import { useParentAuth } from '@/parent-auth'
import { Card, Loader, ScreenHeader } from '@/ui'
import styles from './parent-contacts.module.css'

function BranchContactsCard({
  branch,
  isChildBranch,
}: {
  branch: UniversityBranch
  isChildBranch: boolean
}) {
  const isMain = branch.id === 'main'

  return (
    <Card
      title={isMain ? 'Адрес' : 'Контакты филиала'}
      padding="lg"
    >
      <div className={styles.stack}>
        {isChildBranch && !isMain ? (
          <p className={styles.muted}>Филиал, где обучается ваш ребёнок</p>
        ) : null}

        {!isMain ? (
          <p className={styles.branchName}>
            <a href={branch.contactsUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              {branch.name}
            </a>
          </p>
        ) : null}

        <ul className={styles.list}>
          {branch.addresses.map((address) => (
            <li key={address}>{address}</li>
          ))}
        </ul>

        {branch.hours ? (
          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Режим работы</p>
            <p className={styles.fieldValue}>{branch.hours}</p>
          </div>
        ) : null}

        {branch.phones.map((phone) => (
          <div key={phone.href} className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Телефон</p>
            <a href={phone.href} className={styles.link}>
              {phone.display}
            </a>
          </div>
        ))}

        {branch.emails.map((email) => (
          <div key={email.href} className={styles.fieldRow}>
            <p className={styles.fieldLabel}>E-mail</p>
            <a href={email.href} className={styles.link}>
              {email.display}
            </a>
          </div>
        ))}

        {isMain ? (
          <div className={styles.fieldRow}>
            <p className={styles.fieldLabel}>Проезд</p>
            <ul className={styles.list}>
              {universityMainContacts.directions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={styles.muted}>{universityMainContacts.directionsNote}</p>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function ParentContacts() {
  const session = useParentAuth((s) => s.session)
  const [profile, setProfile] = useState<ParentProfileDto | null>(null)
  const [loading, setLoading] = useState(isParentProfileApiEnabled())

  useEffect(() => {
    if (!session) return

    if (!isParentProfileApiEnabled()) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const data = await fetchParentProfile()
        if (!cancelled) setProfile(data)
      } catch (e) {
        if (!cancelled) {
          console.error(e instanceof ApiError ? e.message : 'Не удалось загрузить профиль')
          setProfile(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session])

  const branchContacts = parentUniversityContacts(profile?.student)
  const branch = branchContacts.branch
  const isChildBranch = Boolean(profile?.student?.branch?.trim())

  if (!session) return null
  if (loading) return <Loader />

  return (
    <div className={styles.page}>
      <ScreenHeader
        title="Контакты"
        subtitle={
          isChildBranch && branch.id !== 'main'
            ? branch.name
            : 'Российский университет кооперации'
        }
      />

      <div className={`${styles.grid} ${styles.gridTwo}`}>
        <BranchContactsCard branch={branch} isChildBranch={isChildBranch} />

        <Card title="Реквизиты для оплаты" padding="lg">
          <div className={styles.detailsGrid}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Банк получателя</span>
              <span className={styles.detailValue}>{universityPaymentDetails.bank}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>БИК / к/с / р/с</span>
              <span className={styles.detailValue}>
                {universityPaymentDetails.bik}, {universityPaymentDetails.corrAccount},{' '}
                {universityPaymentDetails.account}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Наименование</span>
              <span className={styles.detailValue}>{universityPaymentDetails.name}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>ИНН / КПП</span>
              <span className={styles.detailValue}>
                {universityPaymentDetails.inn} / {universityPaymentDetails.kpp}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>ОГРН</span>
              <span className={styles.detailValue}>{universityPaymentDetails.ogrn}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Юридический адрес</span>
              <span className={styles.detailValue}>{universityPaymentDetails.legalAddress}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Связаться с нами" padding="lg">
        <div className={styles.departments}>
          {universityDepartments.map((dept) => (
            <div key={dept.title} className={styles.department}>
              <h3 className={styles.departmentTitle}>{dept.title}</h3>
              <ul className={styles.phoneList}>
                {dept.phones.map((phone) => (
                  <li key={phone}>{phone}</li>
                ))}
              </ul>
              <p className={styles.muted}>График работы: {dept.schedule}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Обратная связь" padding="lg">
        <div className={styles.footerLinks}>
          {universityFeedbackLinks.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              {item.label}
            </a>
          ))}
        </div>
      </Card>

      <p className={styles.source}>
        Источник:{' '}
        <a href={branch.contactsUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {branch.contactsUrl.replace(/^https:\/\//, '')}
        </a>
        {branch.id === 'main' ? (
          <>
            {' '}
            ·{' '}
            <a href={universityContactsSourceUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              new.ruc.su/contacts
            </a>
          </>
        ) : null}
      </p>
    </div>
  )
}
