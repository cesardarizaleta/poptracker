export type CampaignStatus = "Activa" | "En cierre" | "Planificada"

export type Material = {
  id: string
  name: string
  sku: string
  category: string
  available: number
  reserved: number
  reorderPoint: number
  campaign: string
}

export type Campaign = {
  id: string
  name: string
  brand: string
  status: CampaignStatus
  coverage: number
  leads: number
  revenue: number
  delivered: number
  goal: number
}

export type Activity = {
  id: string
  type: "Entrega" | "Lead" | "Reabastecimiento"
  title: string
  detail: string
  time: string
  status: "Verificado" | "En ruta" | "Pendiente"
}

export const locations = [
  "Caracas Metropolitana",
  "Valencia · Carabobo",
  "Maracaibo · Zulia",
  "Barcelona · Anzoátegui",
]

export const sellers = ["María González", "Andrés Rojas", "Valeria Pérez", "Luis Cedeño"]

export const initialMaterials: Material[] = [
  {
    id: "display-pan",
    name: "Exhibidor P.A.N. 65 años",
    sku: "POP-PAN-6501",
    category: "Exhibición",
    available: 1840,
    reserved: 240,
    reorderPoint: 400,
    campaign: "P.A.N. · Aniversario",
  },
  {
    id: "cenefa-polar",
    name: "Cenefa Cerveza Polar",
    sku: "POP-CP-3408",
    category: "Visibilidad",
    available: 620,
    reserved: 120,
    reorderPoint: 300,
    campaign: "Polar · Temporada",
  },
  {
    id: "stand-maltin",
    name: "Stand Maltín Polar fútbol",
    sku: "POP-MP-2119",
    category: "Activación",
    available: 96,
    reserved: 64,
    reorderPoint: 120,
    campaign: "Maltín · Fútbol",
  },
  {
    id: "hablador-pepsi",
    name: "Hablador Pepsi lata",
    sku: "POP-PPS-7812",
    category: "Promoción",
    available: 1240,
    reserved: 80,
    reorderPoint: 250,
    campaign: "Pepsi · Fútbol",
  },
]

export const campaigns: Campaign[] = [
  {
    id: "pan-65",
    name: "Aniversario 65 años",
    brand: "P.A.N.",
    status: "Activa",
    coverage: 78,
    leads: 146,
    revenue: 986400,
    delivered: 3240,
    goal: 4200,
  },
  {
    id: "maltin-football",
    name: "Temporada fútbol",
    brand: "Maltín Polar",
    status: "Activa",
    coverage: 63,
    leads: 98,
    revenue: 612800,
    delivered: 1980,
    goal: 3200,
  },
  {
    id: "pepsi-football",
    name: "La fiesta del fútbol",
    brand: "Pepsi",
    status: "En cierre",
    coverage: 92,
    leads: 142,
    revenue: 1264800,
    delivered: 4260,
    goal: 4600,
  },
]

export const initialActivities: Activity[] = [
  {
    id: "a-1",
    type: "Entrega",
    title: "48 exhibidores entregados",
    detail: "María González · Caracas Metropolitana",
    time: "Hace 12 min",
    status: "Verificado",
  },
  {
    id: "a-2",
    type: "Lead",
    title: "Lead atribuido a activación",
    detail: "P.A.N. · Comercial La Estrella",
    time: "Hace 37 min",
    status: "Verificado",
  },
  {
    id: "a-3",
    type: "Reabastecimiento",
    title: "Solicitud de reposición SAP",
    detail: "Stand Maltín Polar fútbol · Valencia",
    time: "Hace 1 h",
    status: "Pendiente",
  },
]

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-VE").format(value)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    maximumFractionDigits: 0,
  }).format(value)
}

export function materialHealth(material: Material) {
  const freeUnits = material.available - material.reserved
  return freeUnits <= material.reorderPoint ? "Atención" : "Disponible"
}
