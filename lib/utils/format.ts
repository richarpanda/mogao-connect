const MXN = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

export function formatPrecio(precio: number): string {
    return MXN.format(precio);
}

export function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatFechaHora(iso: string): string {
    return new Date(iso).toLocaleString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
