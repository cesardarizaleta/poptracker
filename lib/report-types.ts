import type { Activity, Campaign, Material } from "@/lib/pop-model"

export type ReportExportKind = "executive" | "operation" | "inventory"

export type ReportTerritory = {
  name: string
  code: string
  pdv: number
  delivered: number
  leads: number
  stock: string
  pending: number
  campaign: string
  seller: string
  signal: string
}

export type ReportSeller = {
  name: string
  initials: string
  deliveries: number
  evidence: number
  leads: number
  territory: string
}

export type PopReportPayload = {
  kind: ReportExportKind
  generatedAt: string
  profile: {
    fullName: string
    territory: string
  }
  period: string
  deliveredUnits: number
  freeStock: number
  inventoryValue: number
  leadCount: number
  attributedRevenue: number
  campaigns: Campaign[]
  materials: Material[]
  activities: Activity[]
  territories: ReportTerritory[]
  sellers: ReportSeller[]
}
