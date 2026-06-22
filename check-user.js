const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  const user = await prisma.usuario.findUnique({
    where: { email: "admin@veterinaria.com" },
  });
  console.log("User in DB:", user);
  if (user) {
    const isMatch = await bcrypt.compare("admin123", user.password_hash);
    console.log("Does 'admin123' match the hash in DB?", isMatch);
  }
}
main().finally(() => prisma.$disconnect());
