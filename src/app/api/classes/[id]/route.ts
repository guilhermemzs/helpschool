import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cls = await prisma.class.findUnique({
    where: { id: params.id },
    include: {
      lessons: { orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }], include: { teacher: true } },
      flexibleStudents: true,
    },
  })
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(cls)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN','COORDINATOR','SECRETARY'].includes(session.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const old = await prisma.class.findUnique({ where: { id: params.id } })

  const cls = await prisma.class.update({ where: { id: params.id }, data: body })
  await prisma.auditLog.create({ data: {
    userId: session.user.id, action: 'UPDATE', entityType: 'Class', entityId: cls.id, oldValue: old, newValue: cls,
  }})
  return NextResponse.json(cls)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.class.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
