import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { timesOverlap } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekday   = searchParams.get('weekday')   || ''
  const startTime = searchParams.get('startTime') || ''
  const endTime   = searchParams.get('endTime')   || ''
  const modality  = searchParams.get('modality')  || ''
  const scheduleId= searchParams.get('scheduleId')|| ''
  const classId   = searchParams.get('classId')   || ''

  const [teachers, existingLessons, cls] = await Promise.all([
    prisma.teacher.findMany({
      where: { active: true },
      include: { availability: { where: { weekday } } },
    }),
    prisma.lesson.findMany({
      where: { ...(scheduleId ? { scheduleId } : {}), weekday, status: { not: 'CANCELLED' } },
      select: { teacherId: true, startTime: true, endTime: true },
    }),
    classId ? prisma.class.findUnique({ where: { id: classId } }) : null,
  ])

  const suggestions = teachers
    .map(teacher => {
      const reasons: string[] = []
      let score = 100

      // Modality match
      if (teacher.modality === 'ONLINE' && modality !== 'ONLINE') {
        return { ...teacher, available: false, reason: 'Atende apenas Online' }
      }

      // Specialty check (Maria Laura is Spanish only)
      if (teacher.specialty === 'Espanhol') {
        return { ...teacher, available: false, reason: 'Professor de Espanhol' }
      }

      // Time conflict
      const busy = existingLessons.some(
        l => l.teacherId === teacher.id && timesOverlap(startTime, endTime, l.startTime, l.endTime)
      )
      if (busy) return { ...teacher, available: false, reason: 'Já possui aula neste horário' }

      // Availability window
      const avail = teacher.availability[0]
      if (avail?.startTime && avail?.endTime) {
        if (startTime < avail.startTime || endTime > avail.endTime) {
          reasons.push(`Disponível de ${avail.startTime} às ${avail.endTime}`)
          score -= 30
        }
      }

      // Preferred teacher
      if (cls?.allowedTeachers) {
        const allowed = cls.allowedTeachers.toLowerCase()
        if (allowed.includes('menos ' + teacher.name.toLowerCase())) {
          return { ...teacher, available: false, reason: `Restrito para esta turma` }
        }
        if (allowed !== 'todos' && !allowed.includes(teacher.name.toLowerCase())) {
          score -= 20
        }
        if (allowed.includes(teacher.name.toLowerCase())) score += 20
      }

      if (teacher.needsConfirm) reasons.push('Confirmar disponibilidade')
      if (teacher.type === 'FIXED') score += 10

      return {
        id:        teacher.id,
        name:      teacher.name,
        type:      teacher.type,
        modality:  teacher.modality,
        available: true,
        score,
        reasons,
        needsConfirm: teacher.needsConfirm,
      }
    })
    .filter(t => t.available)
    .sort((a, b) => (b as any).score - (a as any).score)

  return NextResponse.json(suggestions)
}
