/**
 * DTOs centralizados del backend.
 * Importar desde aquí en services y controllers — no duplicar tipos inline.
 */

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface RegisterDto {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol_id: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

/** Payload firmado dentro del JWT */
export interface JwtPayload {
  id: string;
  rol_id: string;
  rol: string; // nombre del rol (ADMIN, CAJERO…) — evita query a BD en role.middleware
}

// ─── AGENDA ──────────────────────────────────────────────────────────────────

export type TipoCita =
  | "CONSULTA"
  | "CONTROL"
  | "VACUNACION"
  | "CIRUGIA"
  | "PELUQUERIA"
  | "OTRO";

export interface CreateCitaDto {
  mascota_id: string;
  doctor_id?: string;
  consultorio_id?: string;
  fecha_hora: string;
  duracion_min?: number;
  tipo?: TipoCita;
  motivo: string;
  notas?: string;
}

export interface UpdateCitaDto {
  doctor_id?: string;
  consultorio_id?: string;
  fecha_hora?: string;
  duracion_min?: number;
  tipo?: TipoCita;
  motivo?: string;
  notas?: string;
}

export interface SolicitarCitaDto {
  mascota_id: string;
  fecha_hora: string;
  duracion_min?: number;
  tipo?: TipoCita;
  motivo?: string;
}

export type EstadoCita =
  | "SOLICITADA"
  | "PROGRAMADA"
  | "CONFIRMADA"
  | "COMPLETADA"
  | "CANCELADA"
  | "NO_ASISTIO";

// ─── FICHA ───────────────────────────────────────────────────────────────────

export interface CreateFichaDto {
  mascota_id: string;
  servicio_id: string;
  motivo?: string;
  prioridad?: "URGENTE" | "NORMAL";
  creado_por_id?: string;
}

export interface IniciarFichaDto {
  doctor_id?: string;
  consultorio_id: string;
}

export interface UpsertSoapDto {
  motivo_detalle?: string;
  anamnesis?: string;
  peso?: number;
  temperatura?: number;
  fc?: number;
  fr?: number;
  hallazgos?: string;
  diagnostico?: string;
  tratamiento?: string;
}

export interface AddConsumoDto {
  producto_id: string;
  cantidad: number;
}

// ─── MASCOTA ─────────────────────────────────────────────────────────────────

export interface CreateMascotaDto {
  nombre: string;
  especie_id: string;
  raza_id?: string;
  color_id?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  peso_actual?: number;
  esterilizado?: boolean;
  alergias?: { alergia_id: string; severidad: string }[];
}

export interface UpdateMascotaDto {
  nombre?: string;
  especie_id?: string;
  raza_id?: string;
  color_id?: string;
  sexo?: string;
  esterilizado?: boolean;
  peso_actual?: number;
  fecha_nacimiento?: string;
}

export interface CreatePropietarioDto {
  nombre: string;
  email: string;
  telefono?: string;
  ci?: string;
  password?: string;
}

export interface CreateMascotaConPropietarioDto {
  mascota: CreateMascotaDto;
  propietario?: CreatePropietarioDto;
  propietario_id?: string;
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export interface CreateUsuarioDto {
  nombre: string;
  email: string;
  password?: string;
  telefono?: string;
  ci?: string;
  rol_id: string;
}

export interface UpdateUsuarioDto {
  nombre?: string;
  email?: string;
  telefono?: string;
  ci?: string;
  rol_id?: string;
}

// ─── CAJA ────────────────────────────────────────────────────────────────────

export type MetodoPago = "EFECTIVO" | "TARJETA" | "QR";

export interface CobrarFichaDto {
  ficha_id: string;
  cajero_id: string;
  punto_caja_id?: string;
  metodo_pago?: MetodoPago;
  monto_recibido?: number;
}

export interface VentaDirectaDto {
  cajero_id: string;
  nombre_cliente?: string;
  punto_caja_id?: string;
  metodo_pago?: MetodoPago;
  monto_recibido?: number;
  productos: { id: string; cantidad: number }[];
}

// ─── CONSULTORIO ─────────────────────────────────────────────────────────────

export type TipoConsultorio =
  | "CONSULTORIO"
  | "LABORATORIO"
  | "QUIROFANO"
  | "SALA_ESPERA"
  | "OTRO";
export type EstadoConsultorio = "LIBRE" | "OCUPADO" | "LIMPIEZA";

export interface CreateConsultorioDto {
  nombre: string;
  especialidad?: string;
  tipo?: TipoConsultorio;
  responsable_id?: string;
}

export interface UpdateConsultorioDto {
  nombre?: string;
  especialidad?: string;
  tipo?: TipoConsultorio;
  estado?: EstadoConsultorio;
  responsable_id?: string;
}

// ─── PRODUCTO ─────────────────────────────────────────────────────────────────

export interface CreateProductoDto {
  nombre: string;
  descripcion?: string;
  categoria_id?: string;
  precio_venta: number;
  stock_actual?: number;
  stock_minimo?: number;
}

export interface UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  categoria_id?: string;
  precio_venta?: number;
  stock_actual?: number;
  stock_minimo?: number;
}

export type TipoMovimiento = "INGRESO" | "SALIDA";

export interface AjustarStockDto {
  cantidad: number;
  tipo: TipoMovimiento;
  motivo?: string;
}
