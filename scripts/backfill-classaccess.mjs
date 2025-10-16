import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // pega todas as turmas e vê se já existe ClassAccess para o owner
  const classes = await prisma.class.findMany({
    select: { id: true, ownerId: true, accesses: { select: { userId: true, role: true } } }
  });

  let toCreate = [];
  for (const c of classes) {
    const hasAccessForOwner = c.accesses.some(a => a.userId === c.ownerId);
    if (!hasAccessForOwner) {
      toCreate.push({ classId: c.id, userId: c.ownerId, role: 'PROFESSOR' });
    }
  }

  if (toCreate.length === 0) {
    console.log('Nada a criar. Todas as turmas já possuem ClassAccess para o owner.');
  } else {
    console.log(`Criando ${toCreate.length} vínculos ClassAccess faltantes...`);
    await prisma.$transaction(
      toCreate.map(item => prisma.classAccess.upsert({
        where: { class_user_unique: { classId: item.classId, userId: item.userId } },
        update: { role: item.role },
        create: { classId: item.classId, userId: item.userId, role: item.role }
      }))
    );
    console.log('Backfill concluído.');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
