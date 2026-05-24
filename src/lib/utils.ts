import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const MODALITY_LABELS: Record<string, string> = {
  ONLINE:     'Online',
  PRESENCIAL: 'Presencial',
  DOMICILIO:  'Domicílio',
  HIBRIDA:    'Híbrida',
}

export const MODALITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  ONLINE:     { text: 'text-gray-800',   bg: 'bg-gray-100',   border: 'border-l-gray-700' },
  PRESENCIAL: { text: 'text-red-700',    bg: 'bg-red-50',     border: 'border-l-red-600' },
  DOMICILIO:  { text: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-l-blue-600' },
  HIBRIDA:    { text: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-l-purple-600' },
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING:     'Pendente',
  CONFIRMED:   'Confirmada',
  RESCHEDULED: 'Remarcada',
  CANCELLED:   'Cancelada',
  COMPLETED:   'Concluída',
}

export const STATUS_COLORS: Record<string, string> = {
  PENDING:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED:   'bg-green-50  text-green-700  border-green-200',
  RESCHEDULED: 'bg-orange-50 text-orange-700 border-orange-200',
  CANCELLED:   'bg-gray-100  text-gray-500   border-gray-200 line-through',
  COMPLETED:   'bg-blue-50   text-blue-700   border-blue-200',
}

export const CLASS_STATUS_LABELS: Record<string, string> = {
  ACTIVE:    'Ativa',
  PAUSED:    'Pausada',
  CANCELLED: 'Cancelada',
  FINISHED:  'Encerrada',
}

export const LEVELS = ['Kids','Teen','A1','A2','B1','B2','C1','C2','Conversação','Business','Reforço','Outro']
export const AGE_GROUPS = ['4 - 7','08 - 10','11 - 16','17+']

export const TIMES = Array.from({ length: 31 }, (_, i) => {
  const h = Math.floor(i / 2) + 7
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

/** Returns true if time A overlaps with time B */
export function timesOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  return aStart < bEnd && aEnd > bStart
}

/** Format a time range like "07:00 - 08:00" */
export function timeRange(start: string, end: string) {
  return `${start} - ${end}`
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN:       'Administrador',
  COORDINATOR: 'Coordenação',
  SECRETARY:   'Secretaria',
  TEACHER:     'Professor',
}
