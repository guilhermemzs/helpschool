import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search   = searchParams.get('search')   || ''
  const type     = searchParams.get('type')     || ''
  const modality = searchParams.get('modality') || ''

  const teachers = await prisma.teacher.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: 'insensitive' } } : {},
        type   ? { type:     type     as any } : {},
        modality ? { modality: modality as any } : {},
        { active: true },
      ]
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: {
      availability: { orderBy: { weekday: 'asc' } },
      _count: { select: { lessons: true } },
    },
  })
  return NextResponse.json(teachers)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN','COORDINATOR'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { availability, ...data } = await req.json()

  const teacher = await prisma.teacher.create({
    data: {
      ...data,
      availability: availability?.length
        ? { create: availability }
        : undefined,
    },
    include: { availability: true },
  })
  return NextResponse.json(teacher, { status: 201 })
}
