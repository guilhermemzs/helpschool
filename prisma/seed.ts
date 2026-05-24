// prisma/seed.ts
import { PrismaClient, Modality, TeacherType, ClassStatus, LessonStatus, TestStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  const coordHash = await bcrypt.hash('coord123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@helpschool.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@helpschool.com', passwordHash: adminHash, role: 'ADMIN' },
  })
  await prisma.user.upsert({
    where: { email: 'coord@helpschool.com' },
    update: {},
    create: { name: 'Coordenação', email: 'coord@helpschool.com', passwordHash: coordHash, role: 'COORDINATOR' },
  })
  await prisma.user.upsert({
    where: { email: 'secretaria@helpschool.com' },
    update: {},
    create: { name: 'Secretaria', email: 'secretaria@helpschool.com', passwordHash: await bcrypt.hash('sec123', 10), role: 'SECRETARY' },
  })

  // ── Teachers ───────────────────────────────────────────────────────────────
  const teacherData = [
    { name: 'Estevão',       type: 'FLEXIBLE' as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar horário.' },
    { name: 'Leonardo',      type: 'FLEXIBLE' as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: '15:00 às 20:00' },
    { name: 'Samara',        type: 'FLEXIBLE' as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar horário.' },
    { name: 'Yuri',          type: 'FLEXIBLE' as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Disponibilidade ampla; confirmar.' },
    { name: 'Ana Carolina',  type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Após 20:00' },
    { name: 'Julia Amorim',  type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Geralmente à noite.' },
    { name: 'Guilherme',     type: 'FIXED'    as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: null },
    { name: 'Lays',          type: 'FIXED'    as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: null },
    { name: 'Ana Elise',     type: 'FIXED'    as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Dias exatos a confirmar.' },
    { name: 'Emanuele',      type: 'FIXED'    as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Dias exatos a confirmar.' },
    { name: 'Maria Laura',   type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: 'Espanhol', needsConfirm: true,  notes: 'Apenas espanhol. Perguntar horário.' },
    { name: 'Ana Beatriz',   type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Costuma desmarcar.' },
    { name: 'Silvia',        type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar o horário.' },
    { name: 'Maria Clara',   type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar o horário.' },
    { name: 'Natália',       type: 'FLEXIBLE' as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar disponibilidade.' },
    { name: 'Pedro Lucas',   type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Tarde e noite.' },
    { name: 'Rafaela',       type: 'FIXED'    as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Sábado fixo.' },
    { name: 'Luisa Alves',   type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Após 18:00' },
    { name: 'Raffael',       type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar horário.' },
    { name: 'Ana Clara Morais', type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,  specialty: null,       needsConfirm: true,  notes: '07:00 às 11:00' },
    { name: 'Ana Clara',     type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Segunda a quarta às 19:00.' },
    { name: 'Ana Cristina',  type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar o horário.' },
    { name: 'Ana Félix',     type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Geralmente depois das 18:00.' },
    { name: 'Amanda',        type: 'FLEXIBLE' as TeacherType, modality: 'HIBRIDA' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar horário.' },
    { name: 'William',       type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Perguntar horário.' },
    { name: 'Marcelo',       type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Após 15:00' },
    { name: 'Luiza Adas',    type: 'FLEXIBLE' as TeacherType, modality: 'ONLINE' as Modality,     specialty: null,       needsConfirm: true,  notes: 'Conferir.' },
    { name: 'Maria Elisa',   type: 'FLEXIBLE' as TeacherType, modality: 'DOMICILIO' as Modality,  specialty: null,       needsConfirm: true,  notes: null },
  ]

  const teachers: Record<string, string> = {}
  for (const t of teacherData) {
    const existing = await prisma.teacher.findFirst({ where: { name: t.name } })
    if (!existing) {
      const created = await prisma.teacher.create({ data: t })
      teachers[t.name] = created.id
    } else {
      teachers[t.name] = existing.id
    }
  }

  // Availability for fixed teachers
  const availabilityData = [
    { name: 'Guilherme', avail: [
      { weekday: 'Segunda', startTime: '08:00', endTime: '17:00' },
      { weekday: 'Terça',   startTime: '08:00', endTime: '17:00' },
      { weekday: 'Quarta',  startTime: '08:00', endTime: '17:00' },
      { weekday: 'Quinta',  startTime: '08:00', endTime: '17:00' },
      { weekday: 'Sexta',   startTime: '09:00', endTime: '18:00' },
    ]},
    { name: 'Lays', avail: [
      { weekday: 'Segunda', startTime: '14:00', endTime: '22:00' },
      { weekday: 'Terça',   startTime: '14:00', endTime: '22:00' },
      { weekday: 'Quarta',  startTime: '14:00', endTime: '22:00' },
      { weekday: 'Quinta',  startTime: '14:00', endTime: '22:00' },
      { weekday: 'Sexta',   startTime: '09:00', endTime: '19:00' },
    ]},
    { name: 'Ana Elise', avail: [
      { weekday: 'Segunda', startTime: '14:00', endTime: '18:00' },
      { weekday: 'Terça',   startTime: '15:00', endTime: '18:00' },
      { weekday: 'Quarta',  startTime: '14:00', endTime: '18:00' },
      { weekday: 'Quinta',  startTime: '14:00', endTime: '18:00' },
      { weekday: 'Sexta',   startTime: '14:00', endTime: '18:00' },
    ]},
    { name: 'Emanuele', avail: [
      { weekday: 'Segunda', startTime: '14:00', endTime: '19:00' },
      { weekday: 'Terça',   startTime: '14:00', endTime: '19:00' },
      { weekday: 'Quarta',  startTime: '14:00', endTime: '19:00' },
      { weekday: 'Quinta',  startTime: '14:00', endTime: '19:00' },
      { weekday: 'Sexta',   startTime: '14:00', endTime: '19:00' },
    ]},
    { name: 'Yuri', avail: [
      { weekday: 'Segunda', startTime: '07:00', endTime: '23:00' },
      { weekday: 'Terça',   startTime: '07:00', endTime: '23:00' },
      { weekday: 'Quarta',  startTime: '07:00', endTime: '23:00' },
      { weekday: 'Quinta',  startTime: '07:00', endTime: '23:00' },
      { weekday: 'Sexta',   startTime: '07:00', endTime: '23:00' },
    ]},
    { name: 'Rafaela', avail: [
      { weekday: 'Sábado',  startTime: '08:00', endTime: '12:00' },
    ]},
    { name: 'Ana Clara Morais', avail: [
      { weekday: 'Segunda', startTime: '07:00', endTime: '11:00' },
      { weekday: 'Terça',   startTime: '07:00', endTime: '11:00' },
      { weekday: 'Quarta',  startTime: '07:00', endTime: '11:00' },
      { weekday: 'Quinta',  startTime: '07:00', endTime: '11:00' },
      { weekday: 'Sexta',   startTime: '07:00', endTime: '11:00' },
    ]},
  ]

  for (const { name, avail } of availabilityData) {
    if (!teachers[name]) continue
    for (const a of avail) {
      const exists = await prisma.teacherAvailability.findFirst({ where: { teacherId: teachers[name], weekday: a.weekday } })
      if (!exists) {
        await prisma.teacherAvailability.create({ data: { teacherId: teachers[name], ...a } })
      }
    }
  }

  // ── Classes ────────────────────────────────────────────────────────────────
  const classData = [
    { code: 'Class 1',   studentNames: 'Nájila',                 classType: 'Grupo',       level: 'A1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 2',   studentNames: 'Luis Gustavo',           classType: 'Grupo',       level: 'A2', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 3',   studentNames: 'Fernanda Tom',           classType: 'Individual',  level: 'A1', ageGroup: '11 - 16',  allowedTeachers: 'menos William',                          teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 4',   studentNames: 'Catarina',               classType: 'Individual',  level: 'B1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'PRESENCIAL' as Modality,  testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: 'Aulas paralisadas',         status: 'PAUSED' as ClassStatus },
    { code: 'Class 5',   studentNames: 'Thiago Filho',           classType: 'Individual',  level: 'A2', ageGroup: '11 - 16',  allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 6',   studentNames: 'Nicolle',                classType: 'Grupo',       level: 'B1', ageGroup: '11 - 16',  allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 1, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 7',   studentNames: 'Arthur',                 classType: 'Grupo',       level: 'B1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 8',   studentNames: 'Danilo',                 classType: 'Grupo',       level: 'B1', ageGroup: '11 - 16',  allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 9',   studentNames: 'Isa',                    classType: 'Individual',  level: 'A1', ageGroup: '08 - 10',  allowedTeachers: 'Todos',                                  teachingModality: 'PRESENCIAL' as Modality,  testStatus: 'ENTREGUE' as TestStatus, lessonsPerWeek: 2, notes: null,                     status: 'ACTIVE' as ClassStatus },
    { code: 'Class 10',  studentNames: 'Rafael',                 classType: 'Individual',  level: 'A1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 11',  studentNames: 'Duda',                   classType: 'Grupo',       level: 'B1', ageGroup: '11 - 16',  allowedTeachers: 'Todos',                                  teachingModality: 'PRESENCIAL' as Modality,  testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 12',  studentNames: 'Pedro Borba',            classType: 'Individual',  level: 'B1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 13',  studentNames: 'David',                  classType: 'Individual',  level: 'B2', ageGroup: '17+',      allowedTeachers: 'Samara, Lays',                           teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 1, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 14',  studentNames: 'Anne e Alice',           classType: 'Grupo',       level: 'B1', ageGroup: '11 - 16',  allowedTeachers: 'Samara, Amanda',                         teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 1, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 15',  studentNames: 'Fernanda',               classType: 'Individual',  level: 'A2', ageGroup: '17+',      allowedTeachers: 'menos Yuri',                             teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 1, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 16',  studentNames: 'Alice',                  classType: 'Individual',  level: 'B1', ageGroup: '11 - 16',  allowedTeachers: 'Samara, Ana Clara, Ana Cristina',        teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 17',  studentNames: 'Cadu',                   classType: 'Grupo',       level: 'A2', ageGroup: '11 - 16',  allowedTeachers: 'menos Ana Clara',                        teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: 'Aulas paralisadas',         status: 'PAUSED' as ClassStatus },
    { code: 'Class 18',  studentNames: 'Lays',                   classType: 'Individual',  level: 'Prova de proef.', ageGroup: '17+', allowedTeachers: 'Amanda',                        teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 1, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 19',  studentNames: 'Debora Lilian de Carvalho', classType: 'Individual', level: 'A2', ageGroup: '17+',   allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 20',  studentNames: 'Samara Costa',           classType: 'Individual',  level: 'A1', ageGroup: '17+',      allowedTeachers: 'Yuri',                                   teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 21',  studentNames: 'Dani',                   classType: 'Grupo',       level: 'B1', ageGroup: '17+',      allowedTeachers: 'menos Ana Clara',                        teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 22',  studentNames: 'Rafael',                 classType: 'Individual',  level: 'B1', ageGroup: '11 - 16',  allowedTeachers: 'Todos',                                  teachingModality: 'PRESENCIAL' as Modality,  testStatus: 'ENTREGUE' as TestStatus, lessonsPerWeek: 2, notes: null,                     status: 'ACTIVE' as ClassStatus },
    { code: 'Class 23',  studentNames: 'Charles',                classType: 'Grupo',       level: 'B2', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'ENTREGUE' as TestStatus, lessonsPerWeek: 1, notes: null,                     status: 'ACTIVE' as ClassStatus },
    { code: 'Class 24',  studentNames: 'Antonio',                classType: 'Individual',  level: 'A2', ageGroup: '11 - 16',  allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'ENTREGUE' as TestStatus, lessonsPerWeek: 2, notes: null,                     status: 'ACTIVE' as ClassStatus },
    { code: 'Class 25',  studentNames: 'Joao Marcelo',           classType: 'Grupo',       level: 'A1', ageGroup: '08 - 10',  allowedTeachers: 'menos Ana Carolina',                     teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 27',  studentNames: 'Beatriz Campos',         classType: 'Individual',  level: 'A1', ageGroup: '4 -7',     allowedTeachers: 'Mulheres',                               teachingModality: 'PRESENCIAL' as Modality,  testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 28',  studentNames: 'Cecilia',                classType: 'Individual',  level: 'A1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'PRESENCIAL' as Modality,  testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 30',  studentNames: 'Aldo',                   classType: 'Individual',  level: 'B2', ageGroup: '17+',      allowedTeachers: 'menos Yuri',                             teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 31',  studentNames: 'Lucas',                  classType: 'Grupo',       level: 'Prova De Proef.', ageGroup: '11 - 16', allowedTeachers: 'Yuri, Estevao, William',    teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 1, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 34',  studentNames: 'Igor',                   classType: 'Individual',  level: 'A2', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZENDO' as TestStatus, lessonsPerWeek: 2, notes: null,                       status: 'ACTIVE' as ClassStatus },
    { code: 'Class 37',  studentNames: 'Jorge',                  classType: 'Grupo',       level: 'A1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'PRESENCIAL' as Modality,  testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 38',  studentNames: 'Sara',                   classType: 'Individual',  level: 'A1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 1, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 39',  studentNames: 'Vitoria',                classType: 'Individual',  level: 'A1', ageGroup: '17+',      allowedTeachers: 'Mulheres',                               teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 40',  studentNames: 'Monica',                 classType: 'Individual',  level: 'B1', ageGroup: '17+',      allowedTeachers: 'Amanda, Estevão',                        teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 41',  studentNames: 'Carlos',                 classType: 'Individual',  level: 'B1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: 'Só com Amanda',             status: 'ACTIVE' as ClassStatus },
    { code: 'Class 42',  studentNames: 'Lucas Rocha',            classType: 'Individual',  level: 'A2', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'HIBRIDA' as Modality,     testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 43',  studentNames: 'Daniela Menezes',        classType: 'Individual',  level: 'B1', ageGroup: '17+',      allowedTeachers: 'Amanda, Ana Cristina, Ana Clara',        teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 80',  studentNames: 'Marcos',                 classType: 'Individual',  level: 'A2', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: '* Só com Amanda',            status: 'ACTIVE' as ClassStatus },
    { code: 'Class 113', studentNames: 'Bianca',                 classType: 'Grupo',       level: 'A1', ageGroup: '11 - 16',  allowedTeachers: 'Todos',                                  teachingModality: 'DOMICILIO' as Modality,   testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
    { code: 'Class 159', studentNames: 'Eduardo',                classType: 'Individual',  level: 'C1', ageGroup: '17+',      allowedTeachers: 'Todos',                                  teachingModality: 'ONLINE' as Modality,      testStatus: 'FAZER' as TestStatus, lessonsPerWeek: 2, notes: null,                        status: 'ACTIVE' as ClassStatus },
  ]

  const classes: Record<string, string> = {}
  for (const c of classData) {
    const existing = await prisma.class.findUnique({ where: { code: c.code } })
    if (!existing) {
      const created = await prisma.class.create({ data: c })
      classes[c.code] = created.id
    } else {
      classes[c.code] = existing.id
    }
  }

  // ── Flexible Students ──────────────────────────────────────────────────────
  const flexData = [
    { classCode: 'Class 2',  studentName: 'Luis Gustavo', lessonsPerWeek: 2, notes: 'Online',                           status: 'ACTIVE' as const },
    { classCode: 'Class 6',  studentName: 'Nicole',       lessonsPerWeek: 1, notes: 'Online',                           status: 'ACTIVE' as const },
    { classCode: 'Class 10', studentName: 'Rafael',       lessonsPerWeek: 2, notes: 'Online',                           status: 'ACTIVE' as const },
    { classCode: 'Class 15', studentName: 'Fernanda',     lessonsPerWeek: 1, notes: 'Online',                           status: 'ACTIVE' as const },
    { classCode: 'Class 38', studentName: 'Sara',         lessonsPerWeek: 1, notes: 'Presencial',                       status: 'ACTIVE' as const, preferredModality: 'PRESENCIAL' as Modality },
    { classCode: 'Class 42', studentName: 'Lucas Rocha',  lessonsPerWeek: 1, notes: 'Faz Aula A Cada 15 Dias / Online', status: 'ACTIVE' as const },
    { classCode: 'Class 41', studentName: 'Carlos',       lessonsPerWeek: 2, notes: 'Online - Só com Amanda',           status: 'ACTIVE' as const },
    { classCode: 'Class 80', studentName: 'Marcos',       lessonsPerWeek: 2, notes: 'Online',                           status: 'WAITING' as const },
  ]

  for (const f of flexData) {
    if (!classes[f.classCode]) continue
    const existing = await prisma.flexibleStudent.findFirst({ where: { classId: classes[f.classCode], studentName: f.studentName } })
    if (!existing) {
      await prisma.flexibleStudent.create({ data: { classId: classes[f.classCode], studentName: f.studentName, lessonsPerWeek: f.lessonsPerWeek, notes: f.notes, status: f.status, preferredModality: f.preferredModality } })
    }
  }

  // ── Schedule & Lessons ─────────────────────────────────────────────────────
  let schedule = await prisma.schedule.findFirst({ where: { name: 'Semana 19/05 - 24/05' } })
  if (!schedule) {
    schedule = await prisma.schedule.create({
      data: { weekStartDate: new Date('2026-05-19'), weekEndDate: new Date('2026-05-24'), name: 'Semana 19/05 - 24/05' }
    })
  }

  const getTeacherId = (name: string) => name ? teachers[name] || null : null
  const getClassId   = (code: string) => classes[code] || null

  const lessonData = [
    { weekday: 'Segunda', date: '2026-05-19', startTime: '07:00', endTime: '08:00', teacherName: 'Yuri',        classCode: 'Class 41',  modality: 'ONLINE' as Modality,     status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Segunda', date: '2026-05-19', startTime: '07:00', endTime: '08:00', teacherName: 'Amanda',      classCode: 'Class 19',  modality: 'ONLINE' as Modality,     status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Segunda', date: '2026-05-19', startTime: '08:00', endTime: '09:00', teacherName: 'Ana Cristina',classCode: 'Class 80',  modality: 'ONLINE' as Modality,     status: 'PENDING' as LessonStatus,   notes: '* Só com Amanda' },
    { weekday: 'Segunda', date: '2026-05-19', startTime: '09:00', endTime: '10:00', teacherName: 'Ana Cristina',classCode: 'Class 41',  modality: 'ONLINE' as Modality,     status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Segunda', date: '2026-05-19', startTime: '09:00', endTime: '10:00', teacherName: 'Maria Elisa', classCode: 'Class 113', modality: 'DOMICILIO' as Modality,  status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Segunda', date: '2026-05-19', startTime: '11:00', endTime: '12:00', teacherName: 'Amanda',      classCode: 'Class 43',  modality: 'ONLINE' as Modality,     status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Terça',   date: '2026-05-20', startTime: '07:00', endTime: '08:00', teacherName: 'Yuri',        classCode: 'Class 42',  modality: 'ONLINE' as Modality,     status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Terça',   date: '2026-05-20', startTime: '14:00', endTime: '15:00', teacherName: 'Lays',        classCode: 'Class 13',  modality: 'PRESENCIAL' as Modality, status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Quarta',  date: '2026-05-21', startTime: '09:00', endTime: '10:00', teacherName: 'Guilherme',   classCode: 'Class 38',  modality: 'PRESENCIAL' as Modality, status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Quarta',  date: '2026-05-21', startTime: '14:00', endTime: '15:00', teacherName: 'Ana Elise',   classCode: 'Class 11',  modality: 'PRESENCIAL' as Modality, status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Quinta',  date: '2026-05-22', startTime: '08:00', endTime: '09:00', teacherName: 'Yuri',        classCode: 'Class 20',  modality: 'ONLINE' as Modality,     status: 'CONFIRMED' as LessonStatus, notes: '' },
    { weekday: 'Sexta',   date: '2026-05-23', startTime: '16:00', endTime: '17:00', teacherName: 'Lays',        classCode: 'Class 13',  modality: 'PRESENCIAL' as Modality, status: 'PENDING' as LessonStatus,   notes: '' },
    { weekday: 'Sábado',  date: '2026-05-24', startTime: '08:00', endTime: '09:00', teacherName: 'Rafaela',     classCode: 'Class 37',  modality: 'PRESENCIAL' as Modality, status: 'CONFIRMED' as LessonStatus, notes: '' },
  ]

  for (const l of lessonData) {
    const classId = getClassId(l.classCode)
    if (!classId) continue
    const existing = await prisma.lesson.findFirst({ where: { scheduleId: schedule.id, classId, weekday: l.weekday, startTime: l.startTime } })
    if (!existing) {
      await prisma.lesson.create({
        data: {
          scheduleId: schedule.id, classId,
          teacherId: getTeacherId(l.teacherName),
          date: new Date(l.date), weekday: l.weekday,
          startTime: l.startTime, endTime: l.endTime,
          modality: l.modality, status: l.status, notes: l.notes,
        }
      })
    }
  }

  console.log('✅ Seed complete!')
  console.log('   Users:    admin@helpschool.com / admin123')
  console.log('             coord@helpschool.com / coord123')
  console.log('             secretaria@helpschool.com / sec123')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
