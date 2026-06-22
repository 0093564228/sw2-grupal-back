const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  const password_hash = await bcrypt.hash("admin123", 10);
  await prisma.usuario.update({
    where: { email: "admin@veterinaria.com" },
    data: { password_hash },
  });
  console.log("¡Contraseña actualizada a un hash válido de bcrypt!");
}
main().finally(() => prisma.$disconnect());
