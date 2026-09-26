export type RolUsuario = 'admin' | 'agente' | 'cliente' | 'vendedor';
export type EstatusPropiedad = 'disponible' | 'apartada' | 'en_proceso' | 'vendida' | 'pendiente_verificacion';
export type EstatusProceso =
    | 'interesado'
    | 'apartado'
    | 'en_tramite'
    | 'documentacion'
    | 'firma'
    | 'cerrado'
    | 'firma_cv'
    | 'integracion'
    | 'firma_notaria'
    | 'entregado';
export type TipoCita = 'visita' | 'firma' | 'entrega' | 'otro';
export type EstatusCita = 'programada' | 'confirmada' | 'cancelada' | 'realizada';

export type Usuario = {
    id: string;
    nombre: string;
    email: string;
    telefono: string | null;
    rol: RolUsuario;
    activo: boolean;
    created_at: string;
    updated_at: string;
};

export type Agente = {
    id: string;
    usuario_id: string;
    comision_pct: number | null;
    activo: boolean;
    estatus_autorizacion: 'pendiente' | 'autorizado' | 'rechazado';
    motivo_rechazo: string | null;
    origen: 'app' | 'crm';
    created_at: string;
    updated_at: string;
};

export type Contacto = {
    id: string;
    agente_id: string | null;
    usuario_id: string | null;
    nombre: string;
    email: string | null;
    telefono: string | null;
    origen: string | null;
    notas: string | null;
    created_at: string;
    updated_at: string;
};

export type CaracteristicasPropiedad = {
    recamaras?: number;
    banos?: number;
    m2?: number;
    m2_terreno?: number;
    estacionamientos?: number;
    [key: string]: unknown;
};

export type Propiedad = {
    id: string;
    agente_id: string | null;
    titulo: string;
    descripcion: string | null;
    direccion: string | null;
    ciudad: string | null;
    precio: number;
    estatus: EstatusPropiedad;
    caracteristicas: CaracteristicasPropiedad;
    tipo_id: string | null;
    latitud: number | null;
    longitud: number | null;
    vendedor_id: string | null;
    created_at: string;
    updated_at: string;
};

export type PropiedadFoto = {
    id: string;
    propiedad_id: string;
    url: string;
    orden: number;
    created_at: string;
};

export type TipoPropiedad = {
    id: string;
    nombre: string;
    orden: number;
    created_at: string;
};

export type Cita = {
    id: string;
    proceso_id: string | null;
    agente_id: string | null;
    contacto_id: string;
    propiedad_id: string | null;
    fecha_hora: string;
    tipo: TipoCita;
    estatus: EstatusCita;
    notas: string | null;
    created_at: string;
    updated_at: string;
};

export type CitaConPropiedad = Cita & {
    propiedades: Pick<Propiedad, 'id' | 'titulo' | 'direccion' | 'ciudad'> | null;
};

export type ProcesoCompra = {
    id: string;
    propiedad_id: string;
    contacto_id: string;
    agente_id: string;
    estatus: EstatusProceso;
    precio_acordado: number | null;
    fecha_inicio: string;
    fecha_cierre: string | null;
    clave_acceso: string;
    created_at: string;
    updated_at: string;
};

export type ProcesoHistorial = {
    id: string;
    proceso_id: string;
    estatus_anterior: EstatusProceso | null;
    estatus_nuevo: EstatusProceso;
    comentario: string | null;
    usuario_id: string;
    created_at: string;
};

export type VendedorCuenta = {
    id: string;
    usuario_id: string;
    activo: boolean;
    estatus_autorizacion: 'pendiente' | 'autorizado' | 'rechazado';
    motivo_rechazo: string | null;
    origen: 'app' | 'crm';
    created_at: string;
    updated_at: string;
};

export type ProcesoDocumento = {
    id: string;
    proceso_id: string;
    tipo: string;
    nombre_archivo: string;
    url: string;
    subido_por: string;
    created_at: string;
};

export type ProcesoConDetalle = ProcesoCompra & {
    propiedades: Pick<Propiedad, 'id' | 'titulo' | 'direccion' | 'ciudad'>;
    proceso_historial: ProcesoHistorial[];
    proceso_documentos: ProcesoDocumento[];
};
