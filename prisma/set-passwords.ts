// Define senhas reais (hash bcrypt) para os usuários criados pelo seed.
// Uso: npx ts-node prisma/set-passwords.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: "admin@izafit.com.br", password: "admin123" },
    { email: "carlos@izafit.com.br", password: "vendedor123" },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.updateMany({
      where: { email: u.email },
      data: { passwordHash },
    });
    console.log(`✓ Senha definida para ${u.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
