import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWeekdayFromDate } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date } = await req.json()
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const dateObj    = new Date(date + 'T00:00:00')
  const dateEndObj = new Date(date + 'T23:59:59')
  const weekday    = getWeekdayFromDate(new Date(date + 'T12:00:00'))

  // Get active fixed lessons for this weekday
  const fixedLessons = await prisma.fixedLesson.findMany({
    where: { weekday, active: true },
    include: { class: true },
  })

  if (fixedLessons.length === 0) return NextResponse.json({ count: 0, message: 'Nenhuma aula fixa para este dia.' })

  // Check which are already in the daily schedule
  const existing = await prisma.dailyLesson.findMany({
    where: { date: { gte: dateObj, lte: dateEndObj }, isFromFixed: true },
    select: { classId: true, startTime: true },
  })

  let count = 0
  for (const fl of fixedLessons) {
    const alreadyExists = existing.find(e => e.classId === fl.classId && e.startTime === fl.startTime)
    if (!alreadyExists) {
      await prisma.dailyLesson.create({
        data: {
          date: dateObj, weekday, classId: fl.classId,
          startTime: fl.startTime, endTime: fl.endTime,
          modality: fl.modality, notes: fl.notes,
          isFromFixed: true, status: 'PENDING',
        },
      })
      count++
    }
  }

  return NextResponse.json({ count, total: fixedLessons.length })
}
