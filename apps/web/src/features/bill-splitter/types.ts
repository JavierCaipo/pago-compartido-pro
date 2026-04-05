
export interface Item {
  id: number;
  name: string;
  price: number;
  quantity?: number; // Cantidad total del ítem (ej. 3 Chicharrones), por defecto 1
  assignments: { personId: number, quantity: number }[]; // Asignaciones por persona
}

export interface Person {
  id: number;
  name: string;
}

export interface RawItem {
    name: string;
    price: number;
}

export interface BannerRow {
  id: number;
  negocio_id: number;
  titulo: string;
  imagen_url: string;
  tipo_accion: string;
  data_accion: string;
  activo: boolean;
}
