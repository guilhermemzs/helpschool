import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const weekday = searchParams.get('weekday') || ''
  const lessons = await prisma.fixedLesson.findMany({
    where: weekday ? { weekday } : {},
    orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    include: { class: { select: { code: true, studentNames: true } } },
  })
  return NextResponse.json(lessons)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const lesson = await prisma.fixedLesson.create({
    data: body,
    include: { class: { select: { code: true, studentNames: true } } },
  })
  return NextResponse.json(lesson, { status: 201 })
}
