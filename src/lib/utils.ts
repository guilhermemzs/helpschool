import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const WEEKDAYS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

// Horários de 06:00 até 00:00 em blocos de 30 min
export const TIMES: string[] = []
for (let h = 6; h <= 23; h++) {
  TIMES.push(`${String(h).padStart(2,'0')}:00`)
  TIMES.push(`${String(h).padStart(2,'0')}:30`)
}
TIMES.push('00:00')

export const MODALITY_LABELS: Record<string,string> = {
  ONLINE: 'Online', PRESENCIAL: 'Presencial', DOMICILIO: 'Domicílio', HIBRIDA: 'Híbrida',
}

export const MODALITY_COLORS: Record<string,string> = {
  ONLINE:     'bg-gray-100 text-gray-700',
  PRESENCIAL: 'bg-red-50 text-red-700',
  DOMICILIO:  'bg-blue-50 text-blue-700',
  HIBRIDA:    'bg-purple-50 text-purple-700',
}

export const STATUS_LABELS: Record<string,string> = {
  PENDING: 'Pendente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Concluída',
}

export const STATUS_COLORS: Record<string,string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-400 border-gray-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
}

export const CLASS_STATUS_LABELS: Record<string,string> = {
  ACTIVE: 'Ativa', PAUSED: 'Pausada', CANCELLED: 'Cancelada', FINISHED: 'Encerrada',
}

export const LEVELS = ['Kids','Teen','A1','A2','B1','B2','C1','C2','Conversação','Business','Proeficiência','Outro']
export const AGE_GROUPS = ['4 - 7','8 - 10','11 - 16','17+']

export function timesOverlap(aS: string, aE: string, bS: string, bE: string) {
  return aS < bE && aE > bS
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0,0,0,0)
  return d
}

export function getWeekdayFromDate(date: Date): string {
  const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  return days[date.getDay()]
}

export const ROLE_LABELS: Record<string,string> = {
  ADMIN: 'Administrador', COORDINATOR: 'Coordenação', SECRETARY: 'Secretaria',
}
