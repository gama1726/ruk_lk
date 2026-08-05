/**
 * @file Библиотека студента: МегаAPI через backend.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import {
  booksOnHand,
  libraryCard,
  libraryDebts,
  type LibraryBook,
  type LibraryCard,
} from '@/mocks/library'

/** Книга из `GET /api/student/library` */
export type LibraryBookDto = {
  id: string
  title: string
  author: string
  biblio: string
  takenAt: string
  dueDate: string
  displayTakenAt: string
  displayDueDate: string
  bookPoint: string
  status: 'on-hand' | 'overdue' | 'ordered' | string
}

/** Ответ `GET /api/student/library` */
export type StudentLibraryDto = {
  studentId: string
  /** active | missing | unavailable */
  status: string
  holderName: string
  onHand: LibraryBookDto[]
  debts: LibraryBookDto[]
  orders: LibraryBookDto[]
}

export function isLibraryApiEnabled(): boolean {
  return isApiConfigured()
}

export async function fetchStudentLibrary(): Promise<StudentLibraryDto> {
  return apiGet<StudentLibraryDto>('/api/student/library')
}

export function mockStudentLibrary(): StudentLibraryDto {
  return {
    studentId: libraryCard.number,
    status: libraryCard.status === 'active' ? 'active' : 'missing',
    holderName: libraryCard.holder,
    onHand: booksOnHand.map(toDto),
    debts: libraryDebts.map(toDto),
    orders: [],
  }
}

function toDto(book: LibraryBook): LibraryBookDto {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    biblio: `${book.author}. ${book.title}`,
    takenAt: book.takenAt,
    dueDate: book.dueDate,
    displayTakenAt: book.takenAt,
    displayDueDate: book.dueDate,
    bookPoint: '',
    status: book.status,
  }
}

export function libraryCardFromDto(dto: StudentLibraryDto): LibraryCard {
  return {
    number: dto.studentId || '—',
    holder: dto.holderName || '—',
    validUntil: '',
    status: dto.status === 'active' ? 'active' : 'blocked',
  }
}

export function booksFromDto(items: LibraryBookDto[]): LibraryBook[] {
  return items.map((b) => ({
    id: b.id,
    title: b.title || b.biblio || '—',
    author: b.author || '—',
    takenAt: b.takenAt,
    dueDate: b.dueDate,
    status: b.status === 'overdue' ? 'overdue' : 'on-hand',
  }))
}
