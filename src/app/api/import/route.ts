import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

function modalityMap(val: string): 'ONLINE'|'PRESENCIAL'|'DOMICILIO'|'HIBRIDA' {
  const v = (val || '').toLowerCase().trim()
  if (v.includes('online'))     return 'ONLINE'
  if (v.includes('pres'))       return 'PRESENCIAL'
  if (v.includes('dom') || v === 'casa') return 'DOMICILIO'
  if (v.includes('híbrido') || v.includes('hibrido') || v.includes('híbrida')) return 'HIBRIDA'
  return 'ONLINE'
}

function statusMap(val: string): 'FAZER'|'FAZENDO'|'ENTREGUE'|'CORRIGINDO' {
  const v = (val || '').toLowerCase().trim()
  if (v.includes('fazendo') || v.includes('fazend')) return 'FAZENDO'
  if (v.includes('entregue')) return 'ENTREGUE'
  if (v.includes('corrigindo')) return 'CORRIGINDO'
  return 'FAZER'
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN','COORDINATOR'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const mode = formData.get('mode') as string // 'preview' | 'import'

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })

  const results: { classes: any[]; flexible: any[]; lessons: any[]; teachers: any[] } = {
    classes: [], flexible: [], lessons: [], teachers: [],
  }
  const errors: string[] = []

  // ── Parse Help School main tab ──────────────────────────────────────────
  if (wb.SheetNames.includes('Help School')) {
    const ws   = wb.Sheets['Help School']
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' })

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i] as any[]
      const code = String(row[1] || '').trim()
      if (!code || !code.toLowerCase().startsWith('class')) continue

      results.classes.push({
        code,
        studentNames:     String(row[2]  || '').trim(),
        classType:        String(row[3]  || 'Individual').trim(),
        level:            String(row[4]  || '').trim(),
        ageGroup:         String(row[5]  || '').trim(),
        allowedTeachers:  String(row[6]  || 'Todos').trim(),
        teachingModality: modalityMap(String(row[7]  || '')),
        testStatus:       statusMap(String(row[8]  || '')),
        lessonsPerWeek:   parseInt(String(row[9]  || '2')) || 2,
        notes:            String(row[10] || '').trim() || null,
        status:           'ACTIVE',
      })
    }
  }

  // ── Parse FLEXÍVEL tab ───────────────────────────────────────────────────
  if (wb.SheetNames.includes('FLEXÍVEL')) {
    const ws   = wb.Sheets['FLEXÍVEL']
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' })

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as any[]
      const code = String(row[0] || '').trim()
      if (!code || !code.toLowerCase().startsWith('class')) continue

      const freq = String(row[2] || '1X').replace(/[^0-9]/g, '') || '1'
      results.flexible.push({
        classCode:     code,
        studentName:   String(row[1] || '').trim(),
        lessonsPerWeek:parseInt(freq) || 1,
        notes:         String(row[3] || '').trim(),
        status:        'ACTIVE',
      })
    }
  }

  // ── Parse Professor tab ──────────────────────────────────────────────────
  if (wb.SheetNames.includes('Professores')) {
    const ws   = wb.Sheets['Professores']
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' })
    const days  = ['Segunda','Terca','Quarta','Quinta','Sexta','Sabado']

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i] as any[]
      const name = String(row[0] || '').trim()
      if (!name) continue

      const teacherType = String(row[1] || '').toLowerCase().includes('fix') ? 'FIXED' : 'FLEXIBLE'
      const modality    = modalityMap(String(row[2] || 'Online'))

      const avail: any[] = []
      days.forEach((day, idx) => {
        const cell = String(row[3 + idx] || '').trim()
        if (cell && cell !== '-' && cell !== 'NaN') {
          const match = cell.match(/(\d{2}:\d{2})\s*[àa-]\s*(\d{2}:\d{2})/)
          if (match) avail.push({ weekday: day === 'Terca' ? 'Terça' : day === 'Sabado' ? 'Sábado' : day, startTime: match[1], endTime: match[2] })
        }
      })

      results.teachers.push({
        name,
        type:         teacherType,
        modality,
        specialty:    String(row[9] || '').includes('Espanhol') ? 'Espanhol' : null,
        needsConfirm: String(row[10] || '').toLowerCase().includes('sim'),
        notes:        String(row[11] || '').trim() || null,
        availability: avail,
      })
    }
  }

  // ── Parse weekday schedule tabs ──────────────────────────────────────────
  const weekdayTabs: Record<string, string> = {
    Segunda: 'Segunda', Terça: 'Terça', Quarta: 'Quarta',
    Quinta: 'Quinta', Sexta: 'Sexta', Sabado: 'Sábado',
  }
  for (const [tabName, weekday] of Object.entries(weekdayTabs)) {
    if (!wb.SheetNames.some(n => n.includes(tabName))) continue
    const sheetName = wb.SheetNames.find(n => n.includes(tabName))!
    const ws   = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' })

    for (let i = 4; i < rows.length; i++) {
      const row = rows[i] as any[]
      const startRaw = row[0]
      const endRaw   = row[1]
      if (!startRaw || !endRaw) continue

      const fmt = (t: any) => {
        if (t instanceof Date) return t.toTimeString().slice(0, 5)
        const s = String(t).trim()
        if (s.match(/^\d{2}:\d{2}/)) return s.slice(0, 5)
        return null
      }

      const startTime = fmt(startRaw)
      const endTime   = fmt(endRaw)
      if (!startTime || !endTime) continue

      results.lessons.push({
        weekday,
        startTime,
        endTime,
        teacherName: String(row[2] || '').trim() || null,
        modality:    modalityMap(String(row[3] || 'Online')),
        classCode:   String(row[4] || '').trim() || null,
        level:       String(row[5] || '').trim() || null,
        studentName: String(row[6] || '').trim() || null,
        status:      String(row[7] || '').toLowerCase().includes('confirm') ? 'CONFIRMED' : 'PENDING',
        notes:       String(row[8] || '').trim() || null,
      })
    }
  }

  if (mode === 'preview') {
    return NextResponse.json({ results, errors })
  }

  // ── Actually import ──────────────────────────────────────────────────────
  let imported = { classes: 0, flexible: 0, teachers: 0, lessons: 0 }

  // Import classes
  for (const c of results.classes) {
    try {
      await prisma.class.upsert({
        where: { code: c.code },
        update: c,
        create: c,
      })
      imported.classes++
    } catch (e) {
      errors.push(`Turma ${c.code}: ${(e as any).message}`)
    }
  }

  // Import teachers
  for (const t of results.teachers) {
    try {
      const { availability, ...teacherData } = t
      const existing = await prisma.teacher.findFirst({ where: { name: t.name } })
      if (existing) {
        await prisma.teacher.update({
          where: { id: existing.id },
          data: {
            ...teacherData,
            availability: { deleteMany: {}, create: availability },
          },
        })
      } else {
        await prisma.teacher.create({
          data: { ...teacherData, availability: { create: availability } },
        })
      }
      imported.teachers++
    } catch (e) {
      errors.push(`Professor ${t.name}: ${(e as any).message}`)
    }
  }

  // Import flexible students
  for (const f of results.flexible) {
    try {
      const cls = await prisma.class.findUnique({ where: { code: f.classCode } })
      if (!cls) { errors.push(`Turma ${f.classCode} não encontrada para ${f.studentName}`); continue }
      const exists = await prisma.flexibleStudent.findFirst({ where: { classId: cls.id, studentName: f.studentName } })
      if (!exists) {
        await prisma.flexibleStudent.create({ data: { classId: cls.id, studentName: f.studentName, lessonsPerWeek: f.lessonsPerWeek, notes: f.notes, status: 'ACTIVE' } })
      }
      imported.flexible++
    } catch (e) {
      errors.push(`Flexível ${f.studentName}: ${(e as any).message}`)
    }
  }

  return NextResponse.json({ imported, errors, total: results })
}
