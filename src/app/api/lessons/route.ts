import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkLessonConflicts } from '@/lib/conflict'
import { z } from 'zod'

const lessonSchema = z.object({
  scheduleId:  z.string().optional().nullable(),
  classId:     z.string(),
  teacherId:   z.string().optional().nullable(),
  date:        z.string(),
  weekday:     z.string(),
  startTime:   z.string(),
  endTime:     z.string(),
  modality:    z.enum(['ONLINE','PRESENCIAL','DOMICILIO','HIBRIDA']),
  level:       z.string().optional().nullable(),
  studentName: z.string().optional().nullable(),
  status:      z.enum(['PENDING','CONFIRMED','RESCHEDULED','CANCELLED','COMPLETED']).default('PENDING'),
  notes:       z.string().optional().nullable(),
  needsConfirm:z.boolean().default(false),
  force:       z.boolean().default(false), // skip conflict block
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scheduleId = searchParams.get('scheduleId')
  const weekday    = searchParams.get('weekday')
  const teacherId  = searchParams.get('teacherId')
  const date       = searchParams.get('date')

  const lessons = await prisma.lesson.findMany({
    where: {
      AND: [
        scheduleId ? { scheduleId }    : {},
        weekday    ? { weekday }       : {},
        teacherId  ? { teacherId }     : {},
        date       ? { date: new Date(date) } : {},
      ]
    },
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    include: {
      class:   { select: { code: true, studentNames: true, teachingModality: true, level: true } },
      teacher: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(lessons)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = lessonSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { force, ...data } = parsed.data

  // Run conflict checks
  const conflicts = await checkLessonConflicts({
    teacherId:  data.teacherId,
    classId:    data.classId,
    weekday:    data.weekday,
    startTime:  data.startTime,
    endTime:    data.endTime,
    modality:   data.modality,
    scheduleId: data.scheduleId,
  })

  if (conflicts.hasConflict && !force) {
    return NextResponse.json({ conflict: true, errors: conflicts.errors, warnings: conflicts.warnings }, { status: 409 })
  }

  const lesson = await prisma.lesson.create({
    data: { ...data, date: new Date(data.date) },
    include: { class: true, teacher: true },
  })

  await prisma.auditLog.create({ data: {
    userId: session.user.id, action: 'CREATE', entityType: 'Lesson', entityId: lesson.id, newValue: lesson,
  }})

  return NextResponse.json({ lesson, warnings: conflicts.warnings }, { status: 201 })
}
