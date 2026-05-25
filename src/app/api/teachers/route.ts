import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const teachers = await prisma.teacher.findMany({
    where: { status: { not: 'INACTIVE' } },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: { availability: true },
  })
  return NextResponse.json(teachers)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { availability, ...data } = await req.json()
  const teacher = await prisma.teacher.create({
    data: { ...data, availability: availability?.length ? { create: availability } : undefined },
    include: { availability: true },
  })
  return NextResponse.json(teacher, { status: 201 })
}
