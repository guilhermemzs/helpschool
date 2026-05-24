import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const t = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: { availability: true, lessons: { take: 20, orderBy: { date: 'desc' }, include: { class: true } } },
  })
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(t)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN','COORDINATOR'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { availability, ...data } = await req.json()
  const teacher = await prisma.teacher.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(availability !== undefined ? {
        availability: {
          deleteMany: {},
          create: availability,
        }
      } : {}),
    },
    include: { availability: true },
  })
  return NextResponse.json(teacher)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.teacher.update({ where: { id: params.id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
