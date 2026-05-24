import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type       = searchParams.get('type')       || 'classes' // classes | lessons | teachers
  const scheduleId = searchParams.get('scheduleId') || ''

  const wb = XLSX.utils.book_new()

  if (type === 'classes') {
    const classes = await prisma.class.findMany({ orderBy: { code: 'asc' } })
    const data = classes.map(c => ({
      'Turma':       c.code,
      'Aluno(s)':    c.studentNames,
      'Tipo':        c.classType,
      'Nível':       c.level,
      'Faixa Etária':c.ageGroup,
      'Professores': c.allowedTeachers,
      'Modalidade':  c.teachingModality,
      'Prova':       c.testStatus,
      'Aulas/sem':   c.lessonsPerWeek,
      'Status':      c.status,
      'Obs':         c.notes,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Turmas')
  }

  if (type === 'lessons' && scheduleId) {
    const lessons = await prisma.lesson.findMany({
      where: { scheduleId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      include: { class: true, teacher: true },
    })
    const data = lessons.map(l => ({
      'Dia':      l.weekday,
      'Início':   l.startTime,
      'Fim':      l.endTime,
      'Professor':l.teacher?.name || '',
      'Modalidade':l.modality,
      'Turma':    l.class.code,
      'Aluno':    l.class.studentNames,
      'Nível':    l.level || l.class.level,
      'Status':   l.status,
      'Obs':      l.notes,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Escala')
  }

  if (type === 'teachers') {
    const teachers = await prisma.teacher.findMany({ where: { active: true }, orderBy: { name: 'asc' }, include: { availability: true } })
    const data = teachers.map(t => ({
      'Nome':       t.name,
      'Tipo':       t.type,
      'Modalidade': t.modality,
      'Especialidade': t.specialty,
      'Confirmar':  t.needsConfirm ? 'Sim' : 'Não',
      'Obs':        t.notes,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Professores')
  }

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="helpschool-${type}.xlsx"`,
    },
  })
}
