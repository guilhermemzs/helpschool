import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const classSchema = z.object({
  code:             z.string().min(1),
  studentNames:     z.string().min(1),
  classType:        z.string(),
  level:            z.string(),
  ageGroup:         z.string().optional(),
  allowedTeachers:  z.string().optional(),
  teachingModality: z.enum(['ONLINE','PRESENCIAL','DOMICILIO','HIBRIDA']),
  testStatus:       z.enum(['FAZER','FAZENDO','ENTREGUE','CORRIGINDO']).default('FAZER'),
  lessonsPerWeek:   z.number().int().min(1).max(7).default(2),
  notes:            z.string().optional(),
  status:           z.enum(['ACTIVE','PAUSED','CANCELLED','FINISHED']).default('ACTIVE'),
  preferredTeacher: z.string().optional(),
  fixedDays:        z.string().optional(),
  fixedTimes:       z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search   = searchParams.get('search')   || ''
  const level    = searchParams.get('level')    || ''
  const modality = searchParams.get('modality') || ''
  const status   = searchParams.get('status')   || ''

  const classes = await prisma.class.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { code:         { contains: search, mode: 'insensitive' } },
            { studentNames: { contains: search, mode: 'insensitive' } },
          ]
        } : {},
        level    ? { level:            level    } : {},
        modality ? { teachingModality: modality as any } : {},
        status   ? { status:           status   as any } : {},
      ]
    },
    orderBy: [
      { status: 'asc' },
      { code: 'asc' },
    ],
    include: { _count: { select: { lessons: true } } },
  })

  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN','COORDINATOR','SECRETARY'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = classSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Check code uniqueness
  const exists = await prisma.class.findUnique({ where: { code: parsed.data.code } })
  if (exists) return NextResponse.json({ error: 'Código de turma já existe.' }, { status: 409 })

  const cls = await prisma.class.create({ data: parsed.data })
  await prisma.auditLog.create({ data: {
    userId: session.user.id, action: 'CREATE', entityType: 'Class', entityId: cls.id, newValue: cls,
  }})
  return NextResponse.json(cls, { status: 201 })
}
