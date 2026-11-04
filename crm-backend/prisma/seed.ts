import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1) Roles base
  const rolesDef = [
    { name: 'super_admin', description: 'Super Administrador', ranking: 100 },
    { name: 'admin', description: 'Administrador', ranking: 80 },
    { name: 'gerente', description: 'Gerente', ranking: 50 },
    { name: 'asesor', description: 'Asesor', ranking: 10 },
  ];
  for (const r of rolesDef) {
    await prisma.roles.upsert({
      where: { name: r.name },
      update: { description: r.description, ranking: r.ranking },
      create: { name: r.name, description: r.description, ranking: r.ranking, permissions: {} },
    });
  }
  const superAdmin = await prisma.roles.findUnique({ where: { name: 'super_admin' } });

  // 2) Usuario admin
  const email = (process.env.ADMIN_EMAIL || 'admin@viajesnova.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.users.upsert({
    where: { email },
    update: { password_hash: hash, email_confirmed_at: new Date() },
    create: { email, password_hash: hash, full_name: 'Administrador', email_confirmed_at: new Date() },
  });

  await prisma.profiles.upsert({
    where: { id: user.id },
    update: { role_id: superAdmin!.id, is_active: true, full_name: 'Administrador', email },
    create: { id: user.id, email, full_name: 'Administrador', role_id: superAdmin!.id, is_active: true },
  });

  console.log(`Seed OK. Roles: ${rolesDef.length}. Admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
