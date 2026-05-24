import { prisma } from '@/lib/prisma'
import { timesOverlap } from '@/lib/utils'

export interface ConflictResult {
  hasConflict: boolean
  errors: string[]
  warnings: string[]
}

export async function checkLessonConflicts(params: {
  teacherId?:  string | null
  classId:     string
  weekday:     string
  startTime:   string
  endTime:     string
  modality:    string
  scheduleId?: string | null
  excludeLessonId?: string
}): Promise<ConflictResult> {
  const { teacherId, classId, weekday, startTime, endTime, modality, scheduleId, excludeLessonId } = params
  const errors: string[]   = []
  const warnings: string[] = []

  // Get all lessons on same weekday in same schedule (or same date)
  const existingLessons = await prisma.lesson.findMany({
    where: {
      weekday,
      ...(scheduleId ? { scheduleId } : {}),
      ...(excludeLessonId ? { NOT: { id: excludeLessonId } } : {}),
    },
    include: { teacher: true, class: true },
  })

  // 1. Teacher conflict — same teacher, overlapping time
  if (teacherId) {
    const teacherLessons = existingLessons.filter(l => l.teacherId === teacherId)
    for (const l of teacherLessons) {
      if (timesOverlap(startTime, endTime, l.startTime, l.endTime)) {
        errors.push(`Conflito: professor já possui aula às ${l.startTime} (${l.class.code} - ${l.class.studentNames}).`)
      }
    }

    // 2. Teacher modality mismatch
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { availability: { where: { weekday } } },
    })
    if (teacher) {
      if (teacher.modality === 'ONLINE' && modality !== 'ONLINE') {
        errors.push(`Este professor atende apenas aulas Online, não ${modality}.`)
      }
      if (teacher.specialty === 'Espanhol' && modality === 'ONLINE') {
        warnings.push(`Atenção: ${teacher.name} é professor de Espanhol e normalmente não deve dar aulas de inglês online.`)
      }

      // 3. Teacher availability check
      const avail = teacher.availability[0]
      if (avail?.startTime && avail?.endTime) {
        if (startTime < avail.startTime || endTime > avail.endTime) {
          warnings.push(`Atenção: ${teacher.name} está disponível de ${avail.startTime} às ${avail.endTime} neste dia.`)
        }
      }
      if (teacher.needsConfirm) {
        warnings.push(`Lembrete: confirmar disponibilidade com ${teacher.name} antes de marcar a aula.`)
      }
    }
  }

  // 4. Class conflict — same class, overlapping time
  const classLessons = existingLessons.filter(l => l.classId === classId)
  for (const l of classLessons) {
    if (timesOverlap(startTime, endTime, l.startTime, l.endTime)) {
      errors.push(`Conflito: esta turma já está marcada às ${l.startTime}.`)
    }
  }

  // 5. Paused/cancelled class
  const cls = await prisma.class.findUnique({ where: { id: classId } })
  if (cls?.status === 'PAUSED')    warnings.push(`Atenção: turma ${cls.code} está pausada.`)
  if (cls?.status === 'CANCELLED') errors.push(`Turma ${cls?.code} está cancelada.`)

  return { hasConflict: errors.length > 0, errors, warnings }
}
