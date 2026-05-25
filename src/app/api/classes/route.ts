import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const type   = searchParams.get('type')   || ''
  const status = searchParams.get('status') || ''
  const classes = await prisma.class.findMany({
    where: {
      AND: [
        search ? { OR: [{ code: { contains: search, mode: 'insensitive' } }, { studentNames: { contains: search, mode: 'insensitive' } }] } : {},
        type   ? { classType: type   as any } : {},
        status ? { status:    status as any } : {},
      ]
    },
    orderBy: [{ status: 'asc' }, { code: 'asc' }],
  })
  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const exists = await prisma.class.findUnique({ where: { code: body.code } })
  if (exists) return NextResponse.json({ error: 'Código já existe.' }, { status: 409 })
  const cls = await prisma.class.create({ data: body })
  return NextResponse.json(cls, { status: 201 })
}
