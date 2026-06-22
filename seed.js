const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient({});

async function main() {
  console.log("Creando rol Admin...");
  const roleAdmin = await prisma.role.upsert({
    where: { nombre: "Admin" },
    update: {},
    create: {
      nombre: "Admin",
      permisos: { all: true },
    },
  });

  console.log("Creando rol Veterinario...");
  const roleVeterinario = await prisma.role.upsert({
    where: { nombre: "Veterinario" },
    update: {},
    create: {
      nombre: "Veterinario",
      permisos: { clinical: true },
    },
  });

  console.log("Creando rol Cajero...");
  const roleCajero = await prisma.role.upsert({
    where: { nombre: "Cajero" },
    update: {},
    create: {
      nombre: "Cajero",
      permisos: { pos: true },
    },
  });

  console.log("Creando rol Farmacéutico...");
  const roleFarmaceutico = await prisma.role.upsert({
    where: { nombre: "Farmacéutico" },
    update: {},
    create: {
      nombre: "Farmacéutico",
      permisos: { inventory: true },
    },
  });

  console.log("Creando rol Laboratorista...");
  const roleLaboratorista = await prisma.role.upsert({
    where: { nombre: "Laboratorista" },
    update: {},
    create: {
      nombre: "Laboratorista",
      permisos: { laboratory: true },
    },
  });

  console.log("Creando usuario admin@veterinaria.com...");
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.usuario.upsert({
    where: { email: "admin@veterinaria.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@veterinaria.com",
      password_hash: adminHash,
      rol_id: roleAdmin.id,
    },
  });

  console.log("Creando usuario veterinario@veterinaria.com...");
  const vetHash = await bcrypt.hash("vet123", 10);
  await prisma.usuario.upsert({
    where: { email: "veterinario@veterinaria.com" },
    update: {},
    create: {
      nombre: "Veterinario",
      email: "veterinario@veterinaria.com",
      password_hash: vetHash,
      rol_id: roleVeterinario.id,
    },
  });

  console.log("Creando usuario cajero@veterinaria.com...");
  const cajeroHash = await bcrypt.hash("cajero123", 10);
  await prisma.usuario.upsert({
    where: { email: "cajero@veterinaria.com" },
    update: {},
    create: {
      nombre: "Cajero",
      email: "cajero@veterinaria.com",
      password_hash: cajeroHash,
      rol_id: roleCajero.id,
    },
  });

  console.log("Creando usuario farmaceutico@veterinaria.com...");
  const farmaHash = await bcrypt.hash("farma123", 10);
  await prisma.usuario.upsert({
    where: { email: "farmaceutico@veterinaria.com" },
    update: {},
    create: {
      nombre: "Farmacéutico",
      email: "farmaceutico@veterinaria.com",
      password_hash: farmaHash,
      rol_id: roleFarmaceutico.id,
    },
  });

  console.log("Creando usuario laboratorista@veterinaria.com...");
  const labHash = await bcrypt.hash("lab123", 10);
  await prisma.usuario.upsert({
    where: { email: "laboratorista@veterinaria.com" },
    update: {},
    create: {
      nombre: "Laboratorista",
      email: "laboratorista@veterinaria.com",
      password_hash: labHash,
      rol_id: roleLaboratorista.id,
    },
  });

  console.log("Seed exitoso: todos los roles y usuarios de prueba creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
