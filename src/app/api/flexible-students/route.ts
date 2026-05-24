import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  const students = await prisma.flexibleStudent.findMany({
    where: {
      AND: [
        status ? { status: status as any } : {},
        search ? {
          OR: [
            { studentName: { contains: search, mode: 'insensitive' } },
            { class: { code: { contains: search, mode: 'insensitive' } } },
          ]
        } : {},
      ]
    },
    include: { class: { select: { code: true } } },
    orderBy: { studentName: 'asc' },
  })
  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const student = await prisma.flexibleStudent.create({ data, include: { class: true } })
  return NextResponse.json(student, { status: 201 })
}
