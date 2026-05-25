'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button, Alert } from '@/components/ui'

interface PreviewData {
  classes:  any[]
  flexible: any[]
  teachers: any[]
  lessons:  any[]
}

export default function ImportPage() {
  const [file,     setFile]     = useState<File | null>(null)
  const [preview,  setPreview]  = useState<PreviewData | null>(null)
  const [errors,   setErrors]   = useState<string[]>([])
  const [loading,  setLoading]  = useState(false)
  const [imported, setImported] = useState<any | null>(null)
  const [step,     setStep]     = useState<'upload'|'preview'|'done'>('upload')

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) { setFile(accepted[0]); setPreview(null); setImported(null); setStep('upload') }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1,
  })

  async function doPreview() {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file); fd.append('mode', 'preview')
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error || 'Erro ao ler arquivo'); return }
    setPreview(data.results); setErrors(data.errors || []); setStep('preview')
  }

  async function doImport() {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file); fd.append('mode', 'import')
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error || 'Erro na importação'); return }
    setImported(data.imported); setErrors(data.errors || []); setStep('done')
    toast.success('Importação concluída!')
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Importação de Planilhas</h1>
      </div>

      <Alert type="info">
        <div className="text-sm">
          <p className="font-semibold mb-1">Planilhas suportadas:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            <li><strong>Help_Inglês.xlsx</strong> — importa turmas (aba Help School), flexíveis (aba FLEXÍVEL)</li>
            <li><strong>Escala (semana).xlsx</strong> — importa professores e horários de aulas</li>
          </ul>
        </div>
      </Alert>

      {/* Step 1 — Upload */}
      <div className={`bg-white border-2 ${isDragActive ? 'border-red-400 bg-red-50' : 'border-dashed border-gray-300'} rounded-2xl p-10 text-center transition-colors mb-4`} {...getRootProps()}>
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Arraste o arquivo Excel aqui</p>
            <p className="text-sm text-gray-400 mt-1">ou clique para selecionar</p>
            <p className="text-xs text-gray-300 mt-2">.xlsx, .xls</p>
          </>
        )}
      </div>

      {file && step === 'upload' && (
        <Button onClick={doPreview} disabled={loading} className="mb-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          {loading ? 'Lendo arquivo...' : 'Pré-visualizar dados'}
        </Button>
      )}

      {/* Step 2 — Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">Pré-visualização</h2>

          {errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-bold text-yellow-700 mb-2">⚠ {errors.length} aviso(s):</p>
              <ul className="text-xs text-yellow-600 space-y-0.5">
                {errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Turmas',      count: preview.classes.length,  color: 'text-blue-700 bg-blue-50' },
              { label: 'Flexíveis',   count: preview.flexible.length,  color: 'text-purple-700 bg-purple-50' },
              { label: 'Professores', count: preview.teachers.length,  color: 'text-green-700 bg-green-50' },
              { label: 'Aulas',       count: preview.lessons.length,   color: 'text-orange-700 bg-orange-50' },
            ].map(c => (
              <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
                <p className="text-2xl font-bold">{c.count}</p>
                <p className="text-xs font-semibold mt-0.5">{c.label} encontradas</p>
              </div>
            ))}
          </div>

          {/* Classes preview */}
          {preview.classes.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Primeiras turmas encontradas:</p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-gray-500 font-bold uppercase">Turma</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold uppercase">Aluno</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold uppercase">Nível</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-bold uppercase">Modalidade</th>
                  </tr></thead>
                  <tbody>
                    {preview.classes.slice(0, 8).map((c, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-1.5 font-bold">{c.code}</td>
                        <td className="px-3 py-1.5">{c.studentNames}</td>
                        <td className="px-3 py-1.5">{c.level}</td>
                        <td className="px-3 py-1.5">{c.teachingModality}</td>
                      </tr>
                    ))}
                    {preview.classes.length > 8 && <tr><td colSpan={4} className="px-3 py-1.5 text-gray-400 italic">+ {preview.classes.length - 8} turmas...</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={doImport} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {loading ? 'Importando...' : `Confirmar importação (${preview.classes.length + preview.teachers.length + preview.flexible.length} registros)`}
            </Button>
            <Button variant="secondary" onClick={() => { setStep('upload'); setPreview(null) }}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === 'done' && imported && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-green-800 mb-4">Importação concluída!</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {Object.entries(imported).map(([k, v]) => (
              <div key={k} className="bg-white rounded-xl p-3 border border-green-200">
                <p className="text-2xl font-bold text-green-700">{String(v)}</p>
                <p className="text-xs text-green-600 capitalize">{k}</p>
              </div>
            ))}
          </div>
          {errors.length > 0 && (
            <div className="text-left bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
              <p className="text-xs font-bold text-yellow-700 mb-1">Avisos ({errors.length}):</p>
              <ul className="text-xs text-yellow-600 space-y-0.5">
                {errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
          <Button variant="secondary" onClick={() => { setFile(null); setStep('upload'); setPreview(null); setImported(null); setErrors([]) }}>
            Importar outro arquivo
          </Button>
        </div>
      )}
    </div>
  )
}
