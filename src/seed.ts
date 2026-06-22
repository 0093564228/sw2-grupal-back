import prisma from "./config/db";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Iniciando seed...");

  // ===========================
  // ROLES
  // ===========================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { nombre: "ADMIN" },
      update: {},
      create: { nombre: "ADMIN", permisos: { all: true } },
    }),
    prisma.role.upsert({
      where: { nombre: "VETERINARIO" },
      update: {},
      create: {
        nombre: "VETERINARIO",
        permisos: { clinical: true, lab: true },
      },
    }),
    prisma.role.upsert({
      where: { nombre: "RECEPCIONISTA" },
      update: {},
      create: {
        nombre: "RECEPCIONISTA",
        permisos: { fichas: true, pacientes: true },
      },
    }),
    prisma.role.upsert({
      where: { nombre: "CAJERO" },
      update: {},
      create: { nombre: "CAJERO", permisos: { caja: true } },
    }),
    prisma.role.upsert({
      where: { nombre: "FARMACEUTICO" },
      update: {},
      create: { nombre: "FARMACEUTICO", permisos: { farmacia: true } },
    }),
    prisma.role.upsert({
      where: { nombre: "CLIENTE" },
      update: {},
      create: { nombre: "CLIENTE", permisos: {} },
    }),
  ]);

  const [roleAdmin, roleVet, roleRecep, roleCajero, roleFarma, roleCliente] =
    roles;
  console.log("✅ Roles creados");

  // ===========================
  // USUARIOS DEL PERSONAL
  // ===========================
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const [admin, vet1, vet2, recep1, cajero1, farma1] = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "admin@vetcare.com" },
      update: {},
      create: {
        nombre: "Administrador",
        email: "admin@vetcare.com",
        password_hash: await hash("admin123"),
        rol_id: roleAdmin.id,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "carlos.mamani@vetcare.com" },
      update: {},
      create: {
        nombre: "Dr. Carlos Mamani",
        email: "carlos.mamani@vetcare.com",
        password_hash: await hash("vet123"),
        rol_id: roleVet.id,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "paola.rios@vetcare.com" },
      update: {},
      create: {
        nombre: "Dra. Paola Ríos",
        email: "paola.rios@vetcare.com",
        password_hash: await hash("vet123"),
        rol_id: roleVet.id,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "maria.gomez@vetcare.com" },
      update: {},
      create: {
        nombre: "María Gómez",
        email: "maria.gomez@vetcare.com",
        password_hash: await hash("recep123"),
        rol_id: roleRecep.id,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "luis.roca@vetcare.com" },
      update: {},
      create: {
        nombre: "Luis Roca",
        email: "luis.roca@vetcare.com",
        password_hash: await hash("caja123"),
        rol_id: roleCajero.id,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "jose.silva@vetcare.com" },
      update: {},
      create: {
        nombre: "José Silva",
        email: "jose.silva@vetcare.com",
        password_hash: await hash("farma123"),
        rol_id: roleFarma.id,
      },
    }),
  ]);
  console.log("✅ Usuarios del personal creados");

  // ===========================
  // PROPIETARIOS (rol CLIENTE)
  // ===========================
  const [prop1, prop2, prop3] = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "juan.vaca@gmail.com" },
      update: {},
      create: {
        nombre: "Juan Vaca Quiroga",
        email: "juan.vaca@gmail.com",
        password_hash: await hash("cliente123"),
        telefono: "76234512",
        ci: "7890123",
        rol_id: roleCliente.id,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "ana.torrico@gmail.com" },
      update: {},
      create: {
        nombre: "Ana Torrico Vásquez",
        email: "ana.torrico@gmail.com",
        password_hash: await hash("cliente123"),
        telefono: "71122334",
        ci: "4567891",
        rol_id: roleCliente.id,
      },
    }),
    prisma.usuario.upsert({
      where: { email: "roberto.diaz@gmail.com" },
      update: {},
      create: {
        nombre: "Roberto Díaz Salinas",
        email: "roberto.diaz@gmail.com",
        password_hash: await hash("cliente123"),
        telefono: "77889900",
        ci: "3214567",
        rol_id: roleCliente.id,
      },
    }),
  ]);
  console.log("✅ Propietarios creados");

  // ===========================
  // CATÁLOGOS: ESPECIE + RAZA
  // ===========================
  const [especieCanino, especieFelino, especieAve, especieConejo] =
    await Promise.all([
      prisma.especie.upsert({
        where: { nombre: "Canino" },
        update: {},
        create: { nombre: "Canino" },
      }),
      prisma.especie.upsert({
        where: { nombre: "Felino" },
        update: {},
        create: { nombre: "Felino" },
      }),
      prisma.especie.upsert({
        where: { nombre: "Ave" },
        update: {},
        create: { nombre: "Ave" },
      }),
      prisma.especie.upsert({
        where: { nombre: "Conejo" },
        update: {},
        create: { nombre: "Conejo" },
      }),
    ]);

  await Promise.all([
    prisma.raza.upsert({
      where: {
        nombre_especie_id: {
          nombre: "Labrador Retriever",
          especie_id: especieCanino.id,
        },
      },
      update: {},
      create: { nombre: "Labrador Retriever", especie_id: especieCanino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: {
          nombre: "Husky Siberiano",
          especie_id: especieCanino.id,
        },
      },
      update: {},
      create: { nombre: "Husky Siberiano", especie_id: especieCanino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: {
          nombre: "Golden Retriever",
          especie_id: especieCanino.id,
        },
      },
      update: {},
      create: { nombre: "Golden Retriever", especie_id: especieCanino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Shih-Tzu", especie_id: especieCanino.id },
      },
      update: {},
      create: { nombre: "Shih-Tzu", especie_id: especieCanino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Beagle", especie_id: especieCanino.id },
      },
      update: {},
      create: { nombre: "Beagle", especie_id: especieCanino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Mestizo", especie_id: especieCanino.id },
      },
      update: {},
      create: { nombre: "Mestizo", especie_id: especieCanino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: {
          nombre: "Gato Persa",
          especie_id: especieFelino.id,
        },
      },
      update: {},
      create: { nombre: "Gato Persa", especie_id: especieFelino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Siamés", especie_id: especieFelino.id },
      },
      update: {},
      create: { nombre: "Siamés", especie_id: especieFelino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Mestizo", especie_id: especieFelino.id },
      },
      update: {},
      create: { nombre: "Mestizo", especie_id: especieFelino.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Canario", especie_id: especieAve.id },
      },
      update: {},
      create: { nombre: "Canario", especie_id: especieAve.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Periquito", especie_id: especieAve.id },
      },
      update: {},
      create: { nombre: "Periquito", especie_id: especieAve.id },
    }),
    prisma.raza.upsert({
      where: {
        nombre_especie_id: { nombre: "Rex", especie_id: especieConejo.id },
      },
      update: {},
      create: { nombre: "Rex", especie_id: especieConejo.id },
    }),
  ]);
  console.log("✅ Especies y razas creadas");

  // ===========================
  // CATÁLOGO: COLORES
  // ===========================
  await Promise.all([
    prisma.colorMascota.upsert({
      where: { descripcion: "Dorado / Golden" },
      update: {},
      create: { descripcion: "Dorado / Golden" },
    }),
    prisma.colorMascota.upsert({
      where: { descripcion: "Blanco y Negro" },
      update: {},
      create: { descripcion: "Blanco y Negro" },
    }),
    prisma.colorMascota.upsert({
      where: { descripcion: "Negro" },
      update: {},
      create: { descripcion: "Negro" },
    }),
    prisma.colorMascota.upsert({
      where: { descripcion: "Blanco" },
      update: {},
      create: { descripcion: "Blanco" },
    }),
    prisma.colorMascota.upsert({
      where: { descripcion: "Marrón / Café" },
      update: {},
      create: { descripcion: "Marrón / Café" },
    }),
    prisma.colorMascota.upsert({
      where: { descripcion: "Atigrado" },
      update: {},
      create: { descripcion: "Atigrado" },
    }),
    prisma.colorMascota.upsert({
      where: { descripcion: "Gris / Plata" },
      update: {},
      create: { descripcion: "Gris / Plata" },
    }),
  ]);
  console.log("✅ Colores creados");

  // ===========================
  // CATÁLOGO: ALERGIAS
  // ===========================
  await Promise.all([
    prisma.alergia.upsert({
      where: { nombre: "Penicilina" },
      update: {},
      create: { nombre: "Penicilina" },
    }),
    prisma.alergia.upsert({
      where: { nombre: "Alimentaria (Pollo)" },
      update: {},
      create: { nombre: "Alimentaria (Pollo)" },
    }),
    prisma.alergia.upsert({
      where: { nombre: "Polen" },
      update: {},
      create: { nombre: "Polen" },
    }),
    prisma.alergia.upsert({
      where: { nombre: "Ácaros" },
      update: {},
      create: { nombre: "Ácaros" },
    }),
    prisma.alergia.upsert({
      where: { nombre: "Latex" },
      update: {},
      create: { nombre: "Latex" },
    }),
  ]);
  console.log("✅ Alergias creadas");

  // ===========================
  // CATÁLOGO: SERVICIOS (precios en Bs.)
  // ===========================
  const [svcGeneral, svcEspecialista, svcCirugia, svcLab, svcVacuna] =
    await Promise.all([
      prisma.catalogoServicio.upsert({
        where: { nombre: "Consulta General" },
        update: {},
        create: { nombre: "Consulta General", precio_base: 180 },
      }),
      prisma.catalogoServicio.upsert({
        where: { nombre: "Consulta Especialista" },
        update: {},
        create: { nombre: "Consulta Especialista", precio_base: 250 },
      }),
      prisma.catalogoServicio.upsert({
        where: { nombre: "Cirugía Menor" },
        update: {},
        create: { nombre: "Cirugía Menor", precio_base: 800 },
      }),
      prisma.catalogoServicio.upsert({
        where: { nombre: "Laboratorio (Perfil Básico)" },
        update: {},
        create: { nombre: "Laboratorio (Perfil Básico)", precio_base: 120 },
      }),
      prisma.catalogoServicio.upsert({
        where: { nombre: "Vacunación" },
        update: {},
        create: { nombre: "Vacunación", precio_base: 90 },
      }),
    ]);
  console.log("✅ Catálogo de servicios creado");

  // ===========================
  // CATÁLOGO: EXÁMENES DE LAB
  // ===========================
  await Promise.all([
    prisma.catalogoExamen.upsert({
      where: { nombre: "Hemograma Completo" },
      update: {},
      create: {
        nombre: "Hemograma Completo",
        tipo_muestra: "Sangre EDTA",
        precio: 80,
      },
    }),
    prisma.catalogoExamen.upsert({
      where: { nombre: "Bioquímica Sérica" },
      update: {},
      create: {
        nombre: "Bioquímica Sérica",
        tipo_muestra: "Suero",
        precio: 120,
      },
    }),
    prisma.catalogoExamen.upsert({
      where: { nombre: "Urianálisis" },
      update: {},
      create: { nombre: "Urianálisis", tipo_muestra: "Orina", precio: 60 },
    }),
    prisma.catalogoExamen.upsert({
      where: { nombre: "Radiografía Digital" },
      update: {},
      create: {
        nombre: "Radiografía Digital",
        tipo_muestra: "N/A (Imagen)",
        precio: 150,
      },
    }),
    prisma.catalogoExamen.upsert({
      where: { nombre: "Ecografía Abdominal" },
      update: {},
      create: {
        nombre: "Ecografía Abdominal",
        tipo_muestra: "N/A (Imagen)",
        precio: 200,
      },
    }),
    prisma.catalogoExamen.upsert({
      where: { nombre: "Coprologico" },
      update: {},
      create: { nombre: "Coprologico", tipo_muestra: "Heces", precio: 50 },
    }),
  ]);
  console.log("✅ Catálogo de exámenes creado");

  // ===========================
  // CONSULTORIOS
  // ===========================
  await Promise.all([
    prisma.consultorio.upsert({
      where: { id: "cons-sala-1" },
      update: {},
      create: {
        id: "cons-sala-1",
        nombre: "Sala 1 — Consultas",
        especialidad: "Medicina General",
      },
    }),
    prisma.consultorio.upsert({
      where: { id: "cons-sala-2" },
      update: {},
      create: {
        id: "cons-sala-2",
        nombre: "Sala 2 — Consultas",
        especialidad: "Medicina General",
      },
    }),
    prisma.consultorio.upsert({
      where: { id: "cons-cirugia" },
      update: {},
      create: {
        id: "cons-cirugia",
        nombre: "Sala 3 — Cirugía",
        especialidad: "Cirugía y Trauma",
      },
    }),
    prisma.consultorio.upsert({
      where: { id: "cons-lab" },
      update: {},
      create: {
        id: "cons-lab",
        nombre: "Laboratorio Central",
        especialidad: "Imagenología",
      },
    }),
  ]);
  console.log("✅ Consultorios creados");

  // ===========================
  // PUNTOS DE CAJA
  // ===========================
  await Promise.all([
    prisma.puntoCaja.upsert({
      where: { nombre: "Caja Principal 01" },
      update: {},
      create: {
        nombre: "Caja Principal 01",
        ubicacion: "Recepción Administrativa",
      },
    }),
    prisma.puntoCaja.upsert({
      where: { nombre: "Caja Farmacia 01" },
      update: {},
      create: { nombre: "Caja Farmacia 01", ubicacion: "Área de Farmacia" },
    }),
  ]);
  console.log("✅ Puntos de caja creados");

  // ===========================
  // CATEGORÍAS DE PRODUCTOS
  // ===========================
  const [catAnti, catAntii, catInsumo, catVacuna, catAlimento] =
    await Promise.all([
      prisma.categoriaProducto.upsert({
        where: { nombre: "Antibióticos" },
        update: {},
        create: { nombre: "Antibióticos", tipo_item: "MEDICAMENTO" },
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: "Antiinflamatorios" },
        update: {},
        create: { nombre: "Antiinflamatorios", tipo_item: "MEDICAMENTO" },
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: "Insumos Médicos" },
        update: {},
        create: { nombre: "Insumos Médicos", tipo_item: "INSUMO_MEDICO" },
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: "Vacunas" },
        update: {},
        create: { nombre: "Vacunas", tipo_item: "VACUNA" },
      }),
      prisma.categoriaProducto.upsert({
        where: { nombre: "Alimentos Terapéuticos" },
        update: {},
        create: { nombre: "Alimentos Terapéuticos", tipo_item: "ALIMENTO" },
      }),
    ]);
  console.log("✅ Categorías de productos creadas");

  // ===========================
  // PRODUCTOS / INVENTARIO
  // ===========================
  await Promise.all([
    prisma.producto.create({
      data: {
        nombre: "Amoxicilina 250mg",
        descripcion: "Antibiótico oral — caja 20 comp.",
        categoria_id: catAnti.id,
        precio_venta: 45,
        stock_actual: 30,
        stock_minimo: 10,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Meloxicam 2mg/ml",
        descripcion: "Antiinflamatorio inyectable 20ml",
        categoria_id: catAntii.id,
        precio_venta: 120,
        stock_actual: 15,
        stock_minimo: 5,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Ivermectina 1%",
        descripcion: "Antiparasitario inyectable 50ml",
        categoria_id: catAnti.id,
        precio_venta: 85,
        stock_actual: 8,
        stock_minimo: 5,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Suero Fisiológico 500ml",
        descripcion: "NaCl 0.9% bolsa IV",
        categoria_id: catInsumo.id,
        precio_venta: 25,
        stock_actual: 50,
        stock_minimo: 20,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Vacuna Polivalente Canina",
        descripcion: "DA2PP — dosis única",
        categoria_id: catVacuna.id,
        precio_venta: 65,
        stock_actual: 20,
        stock_minimo: 10,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Vendas de Gasa 10cm",
        descripcion: "Paquete x 10 unidades",
        categoria_id: catInsumo.id,
        precio_venta: 18,
        stock_actual: 40,
        stock_minimo: 15,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Furosemida 10mg",
        descripcion: "Diurético — 30 comp.",
        categoria_id: catAntii.id,
        precio_venta: 35,
        stock_actual: 12,
        stock_minimo: 5,
      },
    }),
    prisma.producto.create({
      data: {
        nombre: "Hill's Prescription c/d",
        descripcion: "Alimento terapéutico renal 1.5kg",
        categoria_id: catAlimento.id,
        precio_venta: 180,
        stock_actual: 6,
        stock_minimo: 3,
      },
    }),
  ]);
  console.log("✅ Productos de farmacia creados");

  // ===========================
  // PROVEEDORES
  // ===========================
  await Promise.all([
    prisma.proveedor.create({
      data: {
        nombre_empresa: "Droguería INTI S.A.",
        nit: "10203040",
        contacto: "Lic. Mario Sosa",
        telefono: "70001122",
      },
    }),
    prisma.proveedor.create({
      data: {
        nombre_empresa: "Importadora VetSucre",
        nit: "55667788",
        contacto: "Dra. Elena Ruiz",
        telefono: "71234567",
      },
    }),
  ]);
  console.log("✅ Proveedores creados");

  // ===========================
  // MASCOTAS DE PRUEBA
  // ===========================
  const razaLabrador = await prisma.raza.findFirst({
    where: { nombre: "Labrador Retriever" },
  });
  const razaPersa = await prisma.raza.findFirst({
    where: { nombre: "Gato Persa" },
  });
  const razaCanario = await prisma.raza.findFirst({
    where: { nombre: "Canario" },
  });
  const colorDorado = await prisma.colorMascota.findFirst({
    where: { descripcion: "Dorado / Golden" },
  });
  const colorBN = await prisma.colorMascota.findFirst({
    where: { descripcion: "Blanco y Negro" },
  });
  const alergiaP = await prisma.alergia.findFirst({
    where: { nombre: "Penicilina" },
  });

  const rocky = await prisma.mascota.create({
    data: {
      nombre: "Rocky",
      especie_id: especieCanino.id,
      raza_id: razaLabrador!.id,
      color_id: colorDorado!.id,
      sexo: "M",
      peso_actual: 28.4,
      fecha_nacimiento: new Date("2022-03-15"),
      propietario_id: prop1.id,
    },
  });

  await prisma.pacienteAlergia.create({
    data: { mascota_id: rocky.id, alergia_id: alergiaP!.id, severidad: "Alta" },
  });

  await prisma.mascota.create({
    data: {
      nombre: "Mishi",
      especie_id: especieFelino.id,
      raza_id: razaPersa!.id,
      color_id: colorBN!.id,
      sexo: "H",
      peso_actual: 4.5,
      fecha_nacimiento: new Date("2023-07-20"),
      propietario_id: prop2.id,
    },
  });

  await prisma.mascota.create({
    data: {
      nombre: "Piolín",
      especie_id: especieAve.id,
      raza_id: razaCanario!.id,
      sexo: "M",
      peso_actual: 0.02,
      fecha_nacimiento: new Date("2025-01-10"),
      propietario_id: prop3.id,
    },
  });

  console.log("✅ Mascotas de prueba creadas");

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("\n📋 Credenciales de acceso:");
  console.log("   Admin:        admin@vetcare.com        / admin123");
  console.log("   Veterinario:  carlos.mamani@vetcare.com / vet123");
  console.log("   Veterinario:  paola.rios@vetcare.com    / vet123");
  console.log("   Recepción:    maria.gomez@vetcare.com   / recep123");
  console.log("   Cajero:       luis.roca@vetcare.com     / caja123");
  console.log("   Farmacia:     jose.silva@vetcare.com    / farma123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
