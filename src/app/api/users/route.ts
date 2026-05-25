import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, email, password, role } = await req.json()
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10), role }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true } })
  return NextResponse.json(user, { status: 201 })
}
