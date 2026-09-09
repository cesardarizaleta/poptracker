"use client"

import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import {
  ArrowRight,
  Check,
  CircleUserRound,
  Clock3,
  Eraser,
  LogOut,
  MapPin,
  PenLine,
  Send,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/client"
import {
  campaigns,
  formatNumber,
  initialMaterials,
  type Campaign,
  type Material,
} from "@/lib/pop-model"
import type { UserProfile } from "@/lib/supabase-types"

type SellerPortalProps = {
  onLogout: () => void
  profile: UserProfile
}

const ACTIVE_CAMPAIGNS = campaigns.filter((campaign) => campaign.status === "Activa")

const PREVIOUS_DELIVERIES = [
  {
    campaign: "P.A.N. · Aniversario",
    material: "Exhibidores P.A.N.",
    quantity: 48,
    location: "Comercial La Estrella",
    time: "Hace 12 min",
  },
  {
    campaign: "Maltín Polar · Fútbol",
    material: "Stands de activación",
    quantity: 12,
    location: "Plaza Venezuela",
    time: "Ayer · 4:36 p. m.",
  },
  {
    campaign: "P.A.N. · Aniversario",
    material: "Cenefas de anaquel",
    quantity: 24,
    location: "Automercado La Unión",
    time: "Ayer · 11:10 a. m.",
  },
]

function formatDeliveryTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(elapsed / 60000))
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return new Intl.DateTimeFormat("es-VE", { dateStyle: "medium" }).format(new Date(value))
}

function CampaignOption({
  campaign,
  selected,
  onSelect,
}: {
  campaign: Campaign
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      aria-pressed={selected}
      className={`h-auto min-h-20 flex-col items-start gap-1 border p-3 text-left transition-all ${
        selected
          ? "border-[#00338d] bg-[#00338d] text-white hover:bg-[#00338d] hover:text-white"
          : "border-[#d6e1f0] bg-white text-[#102543] hover:border-[#00338d] hover:bg-[#f4f7fb]"
      }`}
      onClick={onSelect}
      type="button"
      variant="outline"
    >
      <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${selected ? "text-[#f4c542]" : "text-[#71839b]"}`}>
        {campaign.brand}
      </span>
      <span className="text-sm font-bold leading-5">{campaign.name}</span>
      <span className={`font-mono text-[10px] ${selected ? "text-white/65" : "text-[#71839b]"}`}>
        {campaign.coverage}% cobertura · {formatNumber(campaign.delivered)} entregados
      </span>
    </Button>
  )
}

function MaterialOption({
  material,
  selected,
  onSelect,
}: {
  material: Material
  selected: boolean
  onSelect: () => void
}) {
  const available = material.available - material.reserved

  return (
    <Button
      aria-pressed={selected}
      className={`h-auto min-h-20 items-start justify-between gap-3 border p-3 text-left transition-all ${
        selected
          ? "border-[#f4c542] bg-[#fff8d9] text-[#102543] hover:bg-[#fff8d9] hover:text-[#102543]"
          : "border-[#d6e1f0] bg-white text-[#102543] hover:border-[#f4c542] hover:bg-[#fffdf1]"
      }`}
      onClick={onSelect}
      type="button"
      variant="outline"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{material.name}</span>
        <span className="mt-1 block font-mono text-[10px] text-[#71839b]">{material.sku}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-mono text-sm font-bold text-[#00338d]">{formatNumber(available)}</span>
        <span className="block text-[10px] text-[#71839b]">disponibles</span>
      </span>
    </Button>
  )
}

function SignaturePad({
  hasSignature,
  onSigned,
  onClear,
  onSignatureChange,
}: {
  hasSignature: boolean
  onSigned: () => void
  onClear: () => void
  onSignatureChange: (value: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const signedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const bounds = canvas.getBoundingClientRect()
    const pixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.floor(bounds.width * pixelRatio)
    canvas.height = Math.floor(bounds.height * pixelRatio)

    const context = canvas.getContext("2d")
    if (!context) return

    context.scale(pixelRatio, pixelRatio)
    context.lineCap = "square"
    context.lineJoin = "round"
    context.lineWidth = 2
    context.strokeStyle = "#00338d"
  }, [])

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget
    const context = canvas.getContext("2d")
    if (!context) return

    const point = getPoint(event)
    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    context.beginPath()
    context.moveTo(point.x, point.y)
  }

  function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return

    const context = event.currentTarget.getContext("2d")
    if (!context) return

    const point = getPoint(event)
    context.lineTo(point.x, point.y)
    context.stroke()
    if (!signedRef.current) {
      signedRef.current = true
      onSigned()
    }
  }

  function finishDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (signedRef.current) {
      onSignatureChange(event.currentTarget.toDataURL("image/png"))
    }
  }

  function clear() {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    signedRef.current = false
    onSignatureChange("")
    onClear()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-[#102543]" htmlFor="seller-signature">
          <PenLine className="size-4 text-[#00338d]" />
          Firma del vendedor
        </Label>
        <Button
          className="h-7 px-2 text-xs text-[#526782]"
          disabled={!hasSignature}
          onClick={clear}
          type="button"
          variant="ghost"
        >
          <Eraser className="size-3.5" />
          Limpiar
        </Button>
      </div>
      <div className="relative h-40 overflow-hidden border border-[#b9cbe2] bg-[#fbfdff] focus-within:border-[#00338d] focus-within:ring-3 focus-within:ring-[#00338d]/15">
        <canvas
          aria-label="Área para dibujar la firma del vendedor"
          className="absolute inset-0 size-full touch-none outline-none"
          id="seller-signature"
          onPointerCancel={finishDrawing}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={finishDrawing}
          ref={canvasRef}
          tabIndex={0}
        />
        {!hasSignature ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-[#9aa9bc]">
            Firma aquí con el dedo o el mouse
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-5 bottom-7 border-b border-dashed border-[#b9cbe2]" />
      </div>
      <p className="text-xs leading-5 text-[#71839b]">
        La firma es obligatoria para enviar el reporte de entrega.
      </p>
    </div>
  )
}

function SellerHeader({ onLogout, profile }: SellerPortalProps) {
  return (
    <header className="border-b border-[#d6e1f0] bg-white px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-36 items-center border border-[#d6e1f0] bg-white px-2">
            <Image
              alt="Empresas Polar"
              className="h-auto w-full object-contain"
              height={64}
              priority
              src="/empresas-polar-logo.png"
              width={180}
            />
          </div>
          <div className="hidden border-l border-[#d6e1f0] pl-4 sm:block">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#71839b]">
              Portal de vendedor
            </p>
            <p className="mt-1 text-sm font-bold text-[#102543]">Reporte de ejecución POP</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-[#102543]">{profile.full_name ?? "Vendedor"}</p>
            <p className="text-xs text-[#71839b]">{profile.territory ?? "Territorio sin asignar"}</p>
          </div>
          <div className="flex size-9 items-center justify-center bg-[#00338d] text-white">
            <CircleUserRound className="size-5" />
          </div>
          <Button
            aria-label="Cerrar sesión"
            onClick={onLogout}
            size="icon"
            type="button"
            variant="ghost"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}

type DeliverySummary = {
  campaign: string
  material: string
  quantity: number
  location: string
  time: string
}

function SellerHome({
  onLogout,
  onStart,
  profile,
  previousDeliveries,
}: SellerPortalProps & { onStart: () => void; previousDeliveries: DeliverySummary[] }) {
  return (
    <main className="seller-view-enter min-h-screen bg-[#f4f7fb] text-[#102543]">
      <SellerHeader onLogout={onLogout} profile={profile} />
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="flex flex-col justify-between gap-6 border-b border-[#d6e1f0] pb-8 sm:flex-row sm:items-end">
          <div>
            <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.05em] text-[#102543] sm:text-5xl">
              Registra tu entrega.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#526782]">
              Selecciona la campaña, indica qué material POP entregaste y confirma con tu firma.
            </p>
          </div>
          <Button className="h-11 w-full gap-3 px-5 sm:w-auto" onClick={onStart} type="button">
            Registrar entrega
            <ArrowRight className="motion-icon" />
          </Button>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Card className="seller-stagger-1 border-[#d6e1f0] bg-white">
            <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-black tracking-[-0.04em]">Progreso de hoy</CardTitle>
                  <CardDescription className="mt-1">Tu avance en la ruta asignada.</CardDescription>
                </div>
                <span className="font-mono text-2xl font-bold text-[#00338d]">33%</span>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 sm:p-6 sm:pt-2">
              <div className="flex items-center justify-between gap-4 text-xs font-bold text-[#526782]">
                <span>2 de 6 entregas completadas</span>
                <span className="font-mono text-[#00338d]">Meta diaria</span>
              </div>
              <Progress
                className="mt-3 h-2 gap-0 bg-[#eaf2fb] [&_[data-slot=progress-indicator]]:bg-[#f4c542]"
                value={33}
              />
              <div className="mt-5 grid grid-cols-6 gap-2" aria-label="Entregas completadas de la jornada">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    className={`flex aspect-square items-center justify-center border font-mono text-xs font-bold ${index < 2 ? "border-[#00338d] bg-[#00338d] text-white" : "border-[#d6e1f0] bg-[#f4f7fb] text-[#a1afc0]"}`}
                    key={index}
                  >
                    {index < 2 ? <Check className="size-4" /> : index + 1}
                  </div>
                ))}
              </div>
              <p className="mt-5 border-l-2 border-[#f4c542] pl-3 text-xs leading-5 text-[#526782]">
                Cada entrega suma evidencia para cerrar tu jornada.
              </p>
            </CardContent>
          </Card>

          <Card className="seller-stagger-2 border-[#d6e1f0] bg-white">
            <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-black tracking-[-0.04em]">Entregas anteriores</CardTitle>
                  <CardDescription className="mt-1">Tu actividad reciente en campo.</CardDescription>
                </div>
                <Clock3 className="size-5 text-[#00338d]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-2 sm:p-6 sm:pt-2">
              {previousDeliveries.map((delivery) => (
                <div className="flex items-center gap-3 border border-[#e4ebf4] p-3" key={`${delivery.time}-${delivery.material}`}>
                  <div className="flex size-9 shrink-0 items-center justify-center bg-[#f3f9e8] text-[#4f8f45]">
                    <Check className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-[#102543]">{delivery.material}</p>
                      <p className="shrink-0 font-mono text-sm font-bold text-[#00338d]">+{delivery.quantity}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#71839b]">{delivery.campaign} · {delivery.location}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#a0afbf]">{delivery.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

type DraftUpdates = {
  paso?: number
  campana?: string
  material?: string
  cantidad?: string
  firma?: "0" | "1"
  enviado?: "0" | "1"
}

export function SellerPortal({ onLogout, profile }: SellerPortalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isWizard = searchParams.get("vista") === "entrega"
  const parsedStep = Number(searchParams.get("paso") ?? "1")
  const currentStep = Number.isInteger(parsedStep) ? Math.min(4, Math.max(1, parsedStep)) : 1

  const [selectedCampaignId, setSelectedCampaignId] = useState(
    searchParams.get("campana") ?? ACTIVE_CAMPAIGNS[0]?.id ?? ""
  )
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    searchParams.get("material") ?? initialMaterials[0]?.id ?? ""
  )
  const [quantity, setQuantity] = useState(searchParams.get("cantidad") ?? "1")
  const [hasSignature, setHasSignature] = useState(searchParams.get("firma") === "1")
  const [signatureData, setSignatureData] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isSent, setIsSent] = useState(searchParams.get("enviado") === "1")
  const [error, setError] = useState("")
  const [availableCampaigns, setAvailableCampaigns] = useState(ACTIVE_CAMPAIGNS)
  const [availableMaterials, setAvailableMaterials] = useState(initialMaterials)
  const [previousDeliveries, setPreviousDeliveries] = useState(PREVIOUS_DELIVERIES)

  useEffect(() => {
    let isMounted = true

    async function loadSupabaseData() {
      const supabase = createClient()
      const [campaignResponse, materialResponse, deliveryResponse] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id, name, brand, status, coverage, leads, revenue, delivered, goal")
          .eq("status", "Activa")
          .order("name"),
        supabase
          .from("materials")
          .select("id, name, sku, category, available, reserved, reorder_point, campaign_id")
          .order("name"),
        supabase
          .from("deliveries")
          .select("id, quantity, location, created_at, campaign_id, material_id")
          .order("created_at", { ascending: false })
          .limit(3),
      ])

      if (!isMounted) return

      if (campaignResponse.error || materialResponse.error || deliveryResponse.error) {
        setError("No se pudieron cargar todos los datos de Supabase. Verifica que hayas ejecutado supabase/schema.sql.")
        return
      }

      const campaignRows = campaignResponse.data ?? []
      const materialRows = materialResponse.data ?? []
      const mappedCampaigns = campaignRows.map((campaign) => ({
        ...campaign,
        status: campaign.status as Campaign["status"],
      }))
      const mappedMaterials = materialRows.map((material) => ({
        ...material,
        reorderPoint: material.reorder_point,
        campaign: material.campaign_id,
      }))
      const mappedDeliveries = (deliveryResponse.data ?? []).map((delivery) => ({
        campaign: mappedCampaigns.find((campaign) => campaign.id === delivery.campaign_id)?.name ?? delivery.campaign_id,
        material: mappedMaterials.find((material) => material.id === delivery.material_id)?.name ?? delivery.material_id,
        quantity: delivery.quantity,
        location: delivery.location,
        time: formatDeliveryTime(delivery.created_at),
      }))

      setAvailableCampaigns(mappedCampaigns)
      setAvailableMaterials(mappedMaterials)
      setPreviousDeliveries(mappedDeliveries)
    }

    void loadSupabaseData()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedCampaign = availableCampaigns.find((campaign) => campaign.id === selectedCampaignId)
  const selectedMaterial = availableMaterials.find((material) => material.id === selectedMaterialId)
  const quantityValue = Number(quantity)
  const availableQuantity = selectedMaterial
    ? selectedMaterial.available - selectedMaterial.reserved
    : 0
  const canSubmit = Boolean(
    selectedCampaign &&
      selectedMaterial &&
      Number.isInteger(quantityValue) &&
      quantityValue > 0 &&
      quantityValue <= availableQuantity &&
      hasSignature &&
      Boolean(signatureData) &&
      !isPending &&
      !isSent
  )

  function persistDraft(updates: DraftUpdates = {}) {
    const params = new URLSearchParams()
    params.set("vista", "entrega")
    params.set("paso", String(updates.paso ?? currentStep))
    params.set("campana", updates.campana ?? selectedCampaignId)
    params.set("material", updates.material ?? selectedMaterialId)
    params.set("cantidad", updates.cantidad ?? quantity)
    params.set("firma", updates.firma ?? (hasSignature ? "1" : "0"))
    params.set("enviado", updates.enviado ?? (isSent ? "1" : "0"))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function openWizard() {
    setSelectedCampaignId(availableCampaigns[0]?.id ?? "")
    setSelectedMaterialId(availableMaterials[0]?.id ?? "")
    setQuantity("1")
    setHasSignature(false)
    setSignatureData("")
    setIsSent(false)
    setError("")
    const params = new URLSearchParams()
    params.set("vista", "entrega")
    params.set("paso", "1")
    params.set("campana", availableCampaigns[0]?.id ?? "")
    params.set("material", availableMaterials[0]?.id ?? "")
    params.set("cantidad", "1")
    params.set("firma", "0")
    params.set("enviado", "0")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function goHome() {
    setError("")
    router.replace(pathname, { scroll: false })
  }

  function updateCampaign(id: string) {
    setSelectedCampaignId(id)
    setError("")
    setIsSent(false)
    persistDraft({ campana: id, enviado: "0" })
  }

  function updateMaterial(id: string) {
    setSelectedMaterialId(id)
    setError("")
    setIsSent(false)
    persistDraft({ material: id, enviado: "0" })
  }

  function goToStep(step: number) {
    setError("")
    persistDraft({ paso: step })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !selectedCampaign ||
      !selectedMaterial ||
      !Number.isInteger(quantityValue) ||
      quantityValue < 1 ||
      quantityValue > availableQuantity
    ) {
      setError(
        `Selecciona una campaña, un material POP y una cantidad entera entre 1 y ${formatNumber(availableQuantity)}.`
      )
      return
    }

    if (!hasSignature || !signatureData) {
      setError("Dibuja la firma del vendedor antes de enviar el reporte.")
      return
    }

    setError("")
    setIsPending(true)
    persistDraft({ enviado: "0", firma: "1", paso: 4 })

    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData.user) {
      setIsPending(false)
      setError("Tu sesión expiró. Vuelve a iniciar sesión para enviar el reporte.")
      return
    }

    const { error: insertError } = await supabase.from("deliveries").insert({
      seller_id: authData.user.id,
      campaign_id: selectedCampaign.id,
      material_id: selectedMaterial.id,
      quantity: quantityValue,
      location: profile.territory ?? "Territorio asignado",
      signature_data: signatureData,
      signature_captured: true,
      status: "Pendiente",
    })

    setIsPending(false)

    if (insertError) {
      setError("No se pudo guardar el reporte en Supabase. Verifica las políticas RLS y vuelve a intentar.")
      return
    }

    setIsSent(true)
    setPreviousDeliveries((current) => [
      {
        campaign: selectedCampaign.name,
        material: selectedMaterial.name,
        quantity: quantityValue,
        location: profile.territory ?? "Territorio asignado",
        time: "Ahora",
      },
      ...current,
    ].slice(0, 3))
    persistDraft({ enviado: "1", firma: "1", paso: 4 })
  }

  if (!isWizard) {
    return <SellerHome onLogout={onLogout} onStart={openWizard} previousDeliveries={previousDeliveries} profile={profile} />
  }

  return (
    <main className="seller-view-enter min-h-screen bg-[#f4f7fb] text-[#102543]">
      <SellerHeader onLogout={onLogout} profile={profile} />
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="flex flex-col gap-5 border-b border-[#d6e1f0] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button className="mb-5 -ml-2 px-2 text-xs text-[#526782]" onClick={goHome} type="button" variant="ghost">
              <ArrowRight className="rotate-180" /> Volver a mi jornada
            </Button>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#00338d]">Nuevo reporte</p>
            <h1 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Registrar entrega.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#526782]">
              Completa cada paso. Tu avance queda guardado en la dirección de esta pantalla.
            </p>
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#71839b]">Paso {currentStep} de 4</span>
        </section>

        <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Pasos del reporte de entrega">
          {["Campaña", "Material", "Cantidad", "Firma"].map((label, index) => {
            const step = index + 1
            const isComplete = step < currentStep
            const isCurrent = step === currentStep
            return (
              <li className={`border p-3 ${isCurrent ? "border-[#00338d] bg-[#00338d] text-white" : isComplete ? "border-[#b5d880] bg-[#f3f9e8] text-[#356120]" : "border-[#d6e1f0] bg-white text-[#71839b]"}`} key={label}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold">0{step}</span>
                  {isComplete ? <Check className="size-3.5" /> : null}
                </div>
                <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.12em]">{label}</span>
              </li>
            )
          })}
        </ol>

        <form className="mt-5" noValidate onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            <Card className="seller-stagger-1 border-[#d6e1f0] bg-white">
              <CardHeader className="border-b border-[#e5ebf4] p-5 sm:p-7">
                <CardTitle className="text-2xl font-black tracking-[-0.04em]">¿Qué campaña estás realizando?</CardTitle>
                <CardDescription className="mt-1">Elige la campaña que corresponde a tu ruta de hoy.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
                {availableCampaigns.map((campaign) => (
                  <CampaignOption
                    campaign={campaign}
                    key={campaign.id}
                    onSelect={() => updateCampaign(campaign.id)}
                    selected={selectedCampaignId === campaign.id}
                  />
                ))}
                <Button className="mt-3 h-11 justify-between sm:col-span-2" onClick={() => goToStep(2)} type="button">
                  Continuar con el material <ArrowRight className="motion-icon" />
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {currentStep === 2 ? (
            <Card className="seller-stagger-1 border-[#d6e1f0] bg-white">
              <CardHeader className="border-b border-[#e5ebf4] p-5 sm:p-7">
                <CardTitle className="text-2xl font-black tracking-[-0.04em]">¿Qué material POP entregaste?</CardTitle>
                <CardDescription className="mt-1">Selecciona una opción para {selectedCampaign?.brand} · {selectedCampaign?.name}.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
                {availableMaterials.map((material) => (
                  <MaterialOption
                    key={material.id}
                    material={material}
                    onSelect={() => updateMaterial(material.id)}
                    selected={selectedMaterialId === material.id}
                  />
                ))}
                <div className="mt-3 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-between">
                  <Button className="h-11" onClick={() => goToStep(1)} type="button" variant="outline">Atrás</Button>
                  <Button className="h-11 justify-between sm:min-w-56" onClick={() => goToStep(3)} type="button">
                    Continuar con la cantidad <ArrowRight className="motion-icon" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentStep === 3 ? (
            <Card className="seller-stagger-1 border-[#d6e1f0] bg-white">
              <CardHeader className="border-b border-[#e5ebf4] p-5 sm:p-7">
                <CardTitle className="text-2xl font-black tracking-[-0.04em]">¿Cuántas unidades entregaste?</CardTitle>
                <CardDescription className="mt-1">Indica una cantidad entera disponible para asignar.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-7">
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="delivery-quantity">Cantidad entregada</Label>
                  <Input
                    aria-describedby={error ? "seller-report-error" : undefined}
                    aria-invalid={Boolean(error)}
                    className="h-14 text-2xl font-bold"
                    id="delivery-quantity"
                    inputMode="numeric"
                    max={availableQuantity}
                    min="1"
                    onChange={(event) => {
                      setQuantity(event.target.value)
                      setError("")
                      setIsSent(false)
                      persistDraft({ cantidad: event.target.value, enviado: "0" })
                    }}
                    required
                    step="1"
                    type="number"
                    value={quantity}
                  />
                  <p className="text-xs leading-5 text-[#71839b]">Disponible para asignar: {formatNumber(availableQuantity)} unidades.</p>
                </div>
                <div className="mt-8 border border-[#d6e1f0] bg-[#f4f7fb] p-4 text-sm">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#71839b]">Resumen</p>
                  <p className="mt-2 font-bold text-[#102543]">{selectedMaterial?.name}</p>
                  <p className="mt-1 text-xs text-[#526782]">{selectedCampaign?.brand} · {selectedCampaign?.name}</p>
                </div>
                {error ? <p className="mt-4 border border-[#d96b6b]/30 bg-[#fff2f2] px-3 py-2 text-sm leading-5 text-[#a93333]" id="seller-report-error" role="alert">{error}</p> : null}
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button className="h-11" onClick={() => goToStep(2)} type="button" variant="outline">Atrás</Button>
                  <Button className="h-11 justify-between sm:min-w-56" onClick={() => goToStep(4)} type="button">
                    Continuar con la firma <ArrowRight className="motion-icon" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {currentStep === 4 ? (
            <Card className="seller-stagger-1 border-[#00338d] bg-white shadow-[10px_10px_0_rgba(0,51,141,0.14)]">
              <CardHeader className="bg-[#00338d] p-5 text-white sm:p-7">
                <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-[-0.04em]">
                  <PenLine className="size-5 text-[#f4c542]" /> Confirma tu reporte
                </CardTitle>
                <CardDescription className="mt-1 text-[#b9d1f2]">Firma al final para enviar la entrega.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-5 sm:p-7">
                <div className="grid gap-3 border border-[#d6e1f0] bg-[#f4f7fb] p-4 text-sm">
                  <div className="flex items-start justify-between gap-4"><span className="text-[#71839b]">Campaña</span><span className="text-right font-bold text-[#102543]">{selectedCampaign?.brand} · {selectedCampaign?.name}</span></div>
                  <div className="flex items-start justify-between gap-4"><span className="text-[#71839b]">Material POP</span><span className="text-right font-bold text-[#102543]">{selectedMaterial?.name}</span></div>
                  <div className="flex items-center justify-between gap-4 border-t border-[#d6e1f0] pt-3"><span className="flex items-center gap-2 text-[#71839b]"><MapPin className="size-3.5" />Cantidad</span><span className="font-mono font-bold text-[#00338d]">{formatNumber(quantityValue)} unidades</span></div>
                </div>

                <SignaturePad
                  hasSignature={hasSignature}
                  onClear={() => {
                    setHasSignature(false)
                    setSignatureData("")
                    setError("")
                    persistDraft({ firma: "0", enviado: "0" })
                  }}
                  onSigned={() => {
                    setHasSignature(true)
                    setError("")
                    setIsSent(false)
                    persistDraft({ firma: "1", enviado: "0" })
                  }}
                  onSignatureChange={setSignatureData}
                />

                {error ? <p className="border border-[#d96b6b]/30 bg-[#fff2f2] px-3 py-2 text-sm leading-5 text-[#a93333]" id="seller-report-error" role="alert">{error}</p> : null}
                {isSent ? <p className="flex items-start gap-2 border border-[#b5d880] bg-[#f3f9e8] p-3 text-sm leading-5 text-[#356120]" role="status"><Check className="mt-0.5 size-4 shrink-0" />Reporte enviado correctamente. Quedó registrado para validación.</p> : null}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button className="h-11" onClick={() => goToStep(3)} type="button" variant="outline">Atrás</Button>
                  <Button className="h-11 justify-between sm:min-w-56" disabled={!canSubmit} type="submit">
                    <span>{isPending ? "Enviando reporte…" : isSent ? "Reporte enviado" : "Enviar reporte"}</span>
                    {isPending ? <Send className="animate-pulse" /> : <ArrowRight className="motion-icon" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </form>
      </div>
    </main>
  )
}
