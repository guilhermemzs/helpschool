import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schedules = await prisma.schedule.findMany({
    orderBy: { weekStartDate: 'desc' },
    include: { _count: { select: { lessons: true } } },
  })
  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN','COORDINATOR','SECRETARY'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { weekStartDate, weekEndDate, name, copyFromId } = await req.json()

  const schedule = await prisma.schedule.create({
    data: {
      weekStartDate: new Date(weekStartDate),
      weekEndDate:   new Date(weekEndDate),
      name,
    }
  })

  // Copy lessons from previous schedule
  if (copyFromId) {
    const prevLessons = await prisma.lesson.findMany({ where: { scheduleId: copyFromId } })
    const start = new Date(weekStartDate)
    const dayMap: Record<string, number> = {
      'Segunda': 0, 'Terça': 1, 'Quarta': 2, 'Quinta': 3, 'Sexta': 4, 'Sábado': 5,
    }
    for (const l of prevLessons) {
      const offset = dayMap[l.weekday] ?? 0
      const newDate = new Date(start)
      newDate.setDate(newDate.getDate() + offset)
      await prisma.lesson.create({
        data: {
          scheduleId: schedule.id,
          classId:    l.classId,
          teacherId:  l.teacherId,
          date:       newDate,
          weekday:    l.weekday,
          startTime:  l.startTime,
          endTime:    l.endTime,
          modality:   l.modality,
          level:      l.level,
          studentName:l.studentName,
          status:     'PENDING',
          notes:      l.notes,
          needsConfirm: l.needsConfirm,
        }
      })
    }
  }

  return NextResponse.json(schedule, { status: 201 })
}
