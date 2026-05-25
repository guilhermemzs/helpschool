import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { timesOverlap, getWeekdayFromDate } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const dateStr   = searchParams.get('date')
  const teacherId = searchParams.get('teacherId') || ''

  if (!dateStr) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const date    = new Date(dateStr + 'T00:00:00')
  const dateEnd = new Date(dateStr + 'T23:59:59')

  const lessons = await prisma.dailyLesson.findMany({
    where: {
      date: { gte: date, lte: dateEnd },
      ...(teacherId ? { teacherId } : {}),
    },
    orderBy: { startTime: 'asc' },
    include: {
      class:   { select: { code: true, studentNames: true, level: true } },
      teacher: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(lessons)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, weekday, classId, teacherId, startTime, endTime, modality, notes, isFromFixed } = body

  const dateObj    = new Date(date + 'T00:00:00')
  const dateEndObj = new Date(date + 'T23:59:59')

  // Conflict check
  const existingOnDay = await prisma.dailyLesson.findMany({
    where: { date: { gte: dateObj, lte: dateEndObj }, status: { not: 'CANCELLED' } },
    select: { teacherId: true, classId: true, startTime: true, endTime: true },
  })

  const errors: string[] = []

  // Teacher conflict
  if (teacherId) {
    const teacherBusy = existingOnDay.find(l => l.teacherId === teacherId && timesOverlap(startTime, endTime, l.startTime, l.endTime))
    if (teacherBusy) errors.push(`Professor já tem aula neste horário (${teacherBusy.startTime} - ${teacherBusy.endTime}).`)
  }

  // Class conflict
  const classBusy = existingOnDay.find(l => l.classId === classId && timesOverlap(startTime, endTime, l.startTime, l.endTime))
  if (classBusy) errors.push(`Esta turma já tem aula neste horário.`)

  if (errors.length > 0) return NextResponse.json({ conflict: true, errors }, { status: 409 })

  const lesson = await prisma.dailyLesson.create({
    data: {
      date: dateObj, weekday, classId, teacherId: teacherId || null,
      startTime, endTime, modality: modality || 'ONLINE',
      notes: notes || null, isFromFixed: isFromFixed || false,
    },
    include: { class: true, teacher: true },
  })

  return NextResponse.json(lesson, { status: 201 })
}
