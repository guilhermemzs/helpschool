import { cn } from '@/lib/utils'
import { MODALITY_LABELS, MODALITY_COLORS, STATUS_LABELS, STATUS_COLORS, CLASS_STATUS_LABELS } from '@/lib/utils'
import { X } from 'lucide-react'

// ── Badges ──────────────────────────────────────────────────────────────────
export function ModalityBadge({ modality }: { modality: string }) {
  const c = MODALITY_COLORS[modality] || MODALITY_COLORS.ONLINE
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border border-transparent', c.text, c.bg)}>
      {MODALITY_LABELS[modality] || modality}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border', STATUS_COLORS[status] || STATUS_COLORS.PENDING)}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function ClassStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE:    'bg-green-50 text-green-700',
    PAUSED:    'bg-yellow-50 text-yellow-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    FINISHED:  'bg-blue-50 text-blue-700',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', colors[status] || 'bg-gray-100 text-gray-500')}>
      {CLASS_STATUS_LABELS[status] || status}
    </span>
  )
}

// ── Stat Card ───────────────────────────────────────────────────────────────
export function StatCard({
  label, value, sub, accent, onClick,
}: {
  label: string; value: string | number; sub?: string; accent?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-4',
        accent && `border-l-4 ${accent}`,
        onClick && 'cursor-pointer hover:shadow-sm transition-shadow'
      )}
    >
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h2>
      <div className="flex-1" />
      {children}
    </div>
  )
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({
  title, children, onClose, size = 'md',
}: {
  title: string; children: React.ReactNode; onClose: () => void; size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={cn('bg-white rounded-2xl w-full shadow-xl flex flex-col max-h-[90vh]', widths[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Alert ───────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }: { type?: 'info' | 'warning' | 'error' | 'success'; children: React.ReactNode }) {
  const styles = {
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }
  return (
    <div className={cn('border rounded-xl px-4 py-3 text-sm flex items-start gap-2', styles[type])}>
      {children}
    </div>
  )
}

// ── Button ──────────────────────────────────────────────────────────────────
export function Button({
  children, onClick, type = 'button', variant = 'primary', size = 'md', disabled, className,
}: {
  children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'; disabled?: boolean; className?: string
}) {
  const variants = {
    primary:   'bg-red-600 hover:bg-red-700 text-white border-transparent',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    danger:    'bg-red-50 hover:bg-red-100 text-red-600 border-red-200',
    ghost:     'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 font-semibold border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
    >
      {children}
    </button>
  )
}

// ── FormField ───────────────────────────────────────────────────────────────
export function FormField({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={cn(inputClass, props.className)}>{props.children}</select>
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, props.className)} />
}

// ── Table ───────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl overflow-hidden', className)}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('bg-gray-50 px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-2.5 border-b border-gray-100 align-middle', className)}>
      {children}
    </td>
  )
}
