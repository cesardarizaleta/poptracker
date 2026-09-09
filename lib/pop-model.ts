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
  imageUrl?: string
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
  /** Foto del producto principal que representa la campaña. */
  imageUrl?: string
  /** Ficha técnica o plan de ejecución de la campaña. */
  briefImageUrl?: string
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
  {
    id: "kit-llaves-carritos",
    name: "Kit higiene de carritos Las Llaves",
    sku: "POP-LL-1509",
    category: "Activación",
    available: 2000,
    reserved: 240,
    reorderPoint: 400,
    campaign: "Las Llaves · Higiene",
    imageUrl: "/product-images/llaves-carritos.png",
  },
  {
    id: "papel-lito-79",
    name: "Papel Lito",
    sku: "POP-LITO-0079",
    category: "Visibilidad",
    available: 79,
    reserved: 0,
    reorderPoint: 20,
    campaign: "Papel Lito · Visibilidad",
    imageUrl: "/product-images/papel-lito.png",
  },
  {
    id: "sangria-lqm",
    name: "Sangría La Que Manda",
    sku: "POP-LQM-5001",
    category: "Producto",
    available: 420,
    reserved: 80,
    reorderPoint: 100,
    campaign: "La Que Manda · Afiches Orla",
    imageUrl: "/product-images/sangria-la-que-manda.png",
  },
  {
    id: "afiche-orla-lqm",
    name: "Afiche Orla La Que Manda",
    sku: "POP-LQM-10000",
    category: "Visibilidad",
    available: 10000,
    reserved: 1600,
    reorderPoint: 2000,
    campaign: "La Que Manda · Afiches Orla",
  },
  {
    id: "capuchon-multimarca",
    name: "Capuchón multimarca",
    sku: "POP-CAP-0300",
    category: "Visibilidad",
    available: 300,
    reserved: 40,
    reorderPoint: 80,
    campaign: "Multimarca · Capuchones",
    imageUrl: "/product-images/capuchones-multimarca.png",
  },
  {
    id: "vaso-tornasol-pepsi",
    name: "Vaso Tornasol Pepsi",
    sku: "POP-PEP-VASO",
    category: "Promoción",
    available: 20000,
    reserved: 3200,
    reorderPoint: 4000,
    campaign: "Pepsi · Vaso Tornasol",
    imageUrl: "/product-images/vasos-pepsi.png",
  },
  {
    id: "combo-mavesa-lock",
    name: "Combo Mavesa 500g + tapa Lock & Lock",
    sku: "POP-MAV-LOCK",
    category: "Promoción",
    available: 50000,
    reserved: 8000,
    reorderPoint: 10000,
    campaign: "Mavesa · Combo tapas",
    imageUrl: "/product-images/combo-mavesa-lock.png",
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
  {
    id: "llaves-higiene",
    name: "Plan de higiene de carritos",
    brand: "Las Llaves",
    status: "Activa",
    coverage: 41,
    leads: 0,
    revenue: 0,
    delivered: 420,
    goal: 2000,
    imageUrl: "/product-images/llaves-carritos.png",
    briefImageUrl: "/product-images/plan-desinfeccion-llaves.png",
  },
  {
    id: "papel-lito",
    name: "Visibilidad nacional",
    brand: "Papel Lito",
    status: "Activa",
    coverage: 34,
    leads: 0,
    revenue: 0,
    delivered: 79,
    goal: 79,
    imageUrl: "/product-images/papel-lito.png",
    briefImageUrl: "/product-images/plan-papel-lito.png",
  },
  {
    id: "lqm-orla",
    name: "Afiches Orla",
    brand: "La Que Manda",
    status: "Activa",
    coverage: 28,
    leads: 0,
    revenue: 0,
    delivered: 1600,
    goal: 10000,
    imageUrl: "/product-images/sangria-la-que-manda.png",
    briefImageUrl: "/product-images/plan-afiches-orla-lqm.png",
  },
  {
    id: "multimarca-capuchones",
    name: "Capuchones multimarca",
    brand: "Multimarca",
    status: "Activa",
    coverage: 22,
    leads: 0,
    revenue: 0,
    delivered: 40,
    goal: 300,
    imageUrl: "/product-images/capuchones-multimarca.png",
    briefImageUrl: "/product-images/plan-capuchones-multimarca.png",
  },
  {
    id: "pepsi-vaso",
    name: "Combo Pepsi + vaso Tornasol",
    brand: "Pepsi",
    status: "Activa",
    coverage: 46,
    leads: 0,
    revenue: 0,
    delivered: 3200,
    goal: 20000,
    imageUrl: "/product-images/vasos-pepsi.png",
    briefImageUrl: "/product-images/plan-pepsi-vaso.png",
  },
  {
    id: "mavesa-combo",
    name: "Combo de tapas con broches",
    brand: "Mavesa",
    status: "Activa",
    coverage: 39,
    leads: 0,
    revenue: 0,
    delivered: 8000,
    goal: 50000,
    imageUrl: "/product-images/combo-mavesa-lock.png",
    briefImageUrl: "/product-images/plan-tapas-mavesa.png",
  },
]

export function getMaterialImage(id: string, remoteImageUrl?: string | null) {
  if (remoteImageUrl && !remoteImageUrl.includes("/plan-")) return remoteImageUrl
  return initialMaterials.find((material) => material.id === id)?.imageUrl
}

export function getCampaignImage(id: string, remoteImageUrl?: string | null) {
  if (remoteImageUrl && !remoteImageUrl.includes("/plan-")) return remoteImageUrl
  return campaigns.find((campaign) => campaign.id === id)?.imageUrl
}

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
