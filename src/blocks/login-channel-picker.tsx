import type { LoginCodeChannel } from '@/auth'
import styles from './login-channel-picker.module.css'

type Props = {
  value: LoginCodeChannel
  onChange: (channel: LoginCodeChannel) => void
  disabled?: boolean
  emailHint?: string
  phoneHint?: string
  emailDisabled?: boolean
  maxDisabled?: boolean
  showMax?: boolean
  hideLabel?: boolean
}

function EmailIcon() {
  return (
    <svg className={styles.emailIcon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M4 14l20 14L44 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MaxLogo() {
  return (
    <img
      className={styles.maxLogo}
      src="/brands/max-logo.png?v=4"
      alt=""
      width={48}
      height={48}
      draggable={false}
    />
  )
}

export function LoginChannelPicker({
  value,
  onChange,
  disabled,
  emailHint,
  phoneHint,
  emailDisabled = false,
  maxDisabled = false,
  showMax = true,
  hideLabel = false,
}: Props) {
  return (
    <div className={styles.wrap}>
      {!hideLabel && (
        <p className={styles.label} id="login-channel-label">
          Куда отправить код
        </p>
      )}
      <div
        className={styles.grid}
        role="radiogroup"
        aria-labelledby={hideLabel ? undefined : 'login-channel-label'}
      >
        <button
          type="button"
          className={`${styles.card} ${value === 'EMAIL' ? styles.cardActive : ''}`}
          onClick={() => onChange('EMAIL')}
          disabled={disabled || emailDisabled}
          aria-pressed={value === 'EMAIL'}
        >
          <EmailIcon />
          <span className={styles.cardTitle}>Email</span>
          {emailHint && <span className={styles.cardHint}>{emailHint}</span>}
        </button>
        {showMax && (
          <button
            type="button"
            className={`${styles.card} ${value === 'MAX' ? styles.cardActive : ''}`}
            onClick={() => onChange('MAX')}
            disabled={disabled || maxDisabled}
            aria-pressed={value === 'MAX'}
          >
            <MaxLogo />
            <span className={styles.cardTitle}>MAX</span>
            {phoneHint && <span className={styles.cardHint}>{phoneHint}</span>}
          </button>
        )}
      </div>
    </div>
  )
}
