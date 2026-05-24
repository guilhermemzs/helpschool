import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkLessonConflicts } from '@/lib/conflict'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { force, ...data } = body

  const old = await prisma.lesson.findUnique({ where: { id: params.id } })

  // Run conflict checks when changing time/teacher/modality
  if (data.teacherId || data.startTime || data.modality) {
    const current = { ...old, ...data }
    const conflicts = await checkLessonConflicts({
      teacherId:  current.teacherId,
      classId:    current.classId || old?.classId,
      weekday:    current.weekday || old?.weekday,
      startTime:  current.startTime || old?.startTime,
      endTime:    current.endTime || old?.endTime,
      modality:   current.modality || old?.modality,
      scheduleId: current.scheduleId || old?.scheduleId,
      excludeLessonId: params.id,
    })
    if (conflicts.hasConflict && !force) {
      return NextResponse.json({ conflict: true, errors: conflicts.errors, warnings: conflicts.warnings }, { status: 409 })
    }
  }

  const lesson = await prisma.lesson.update({
    where: { id: params.id },
    data: { ...data, ...(data.date ? { date: new Date(data.date) } : {}) },
    include: { class: true, teacher: true },
  })

  await prisma.auditLog.create({ data: {
    userId: session.user.id, action: 'UPDATE', entityType: 'Lesson', entityId: lesson.id, oldValue: old, newValue: lesson,
  }})

  return NextResponse.json(lesson)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.lesson.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
