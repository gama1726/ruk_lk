import { create } from 'zustand'

type Session = {
  email: string
  name: string
}

type FieldError = {
  field: 'login' | 'password'
  message: string
}

type AuthState = {
  session: Session | null
  pendingEmail: string | null
  signIn: (email: string, password: string) => FieldError | null
  confirmCode: (code: string) => string | null
  signOut: () => void
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const useAuth = create<AuthState>((set) => ({
  session: null,
  pendingEmail: null,

  signIn(email, password) {
    const trimmed = email.trim()

    if (!trimmed) return { field: 'login', message: 'Укажите почту' }
    if (!emailPattern.test(trimmed)) return { field: 'login', message: 'Похоже, почта указана с ошибкой' }
    if (!password) return { field: 'password', message: 'Укажите пароль' }
    if (password.length < 4) return { field: 'password', message: 'Пароль слишком короткий' }

    set({ pendingEmail: trimmed })
    return null
  },

  confirmCode(code) {
    const digits = code.replace(/\s/g, '')

    if (!/^\d{6}$/.test(digits)) return 'Нужен код из 6 цифр'

    set((state) => ({
      session: {
        email: state.pendingEmail ?? 'ivanov.as@student.ruc.local',
        name: 'Иванов Артём Сергеевич',
      },
      pendingEmail: null,
    }))

    return null
  },

  signOut() {
    set({ session: null, pendingEmail: null })
  },
}))

export function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local.slice(-2)}@${domain}`
}
