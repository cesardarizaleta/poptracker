"use client"

import Image from "next/image"
import { Suspense, useEffect, useState, type FormEvent } from "react"
import {
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
} from "lucide-react"

import { PolarPopConsole } from "@/components/polar-pop-console"
import { SellerPortal } from "@/components/seller-portal"
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
import { createClient } from "@/lib/client"
import type { UserProfile } from "@/lib/supabase-types"

const CORPORATE_DOMAIN = "empresaspolar.com"

const supabase = createClient()

function isCorporateEmail(value: string) {
  return new RegExp(`^[^\\s@]+@${CORPORATE_DOMAIN.replace(".", "\\.")}$`, "i").test(
    value.trim()
  )
}

function isValidPassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)
}

export function PopLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadProfile(userId: string, userEmail: string | undefined) {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, territory")
        .eq("id", userId)
        .maybeSingle()

      if (!isMounted) return

      if (profileError || !data) {
        await supabase.auth.signOut()
        setError(
          profileError
            ? "No se pudo cargar tu perfil. Verifica que hayas ejecutado el esquema de Supabase."
            : "Tu usuario existe, pero todavía no tiene un perfil de acceso asignado."
        )
      } else {
        setProfile({ ...data, email: data.email ?? userEmail ?? null } as UserProfile)
      }

      setIsSessionLoading(false)
    }

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        void loadProfile(user.id, user.email)
      } else if (isMounted) {
        setIsSessionLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setProfile(null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (isSessionLoading) {
    return <main className="min-h-screen bg-[#f4f7fb]" />
  }

  if (profile) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#f4f7fb]" />}>
        {profile.role === "coordinator" ? (
          <PolarPopConsole onLogout={() => void handleLogout()} profile={profile} />
        ) : (
          <SellerPortal onLogout={() => void handleLogout()} profile={profile} />
        )}
      </Suspense>
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()

    if (!isCorporateEmail(normalizedEmail)) {
      setError(`Usa un correo corporativo con dominio @${CORPORATE_DOMAIN}.`)
      return
    }

    if (!isValidPassword(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
      )
      return
    }

    setError("")
    setIsPending(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (authError || !data.user) {
      setIsPending(false)
      setError(authError?.message ?? "El correo o la contraseña no son válidos.")
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, territory")
      .eq("id", data.user.id)
      .maybeSingle()

    if (profileError || !profileData) {
      await supabase.auth.signOut()
      setIsPending(false)
      setError(
        profileError
          ? "El acceso funcionó, pero no se pudo consultar el perfil. Ejecuta el esquema de Supabase."
          : "El usuario no tiene un rol asignado. Crea su registro en la tabla profiles."
      )
      return
    }

    setProfile({ ...profileData, email: profileData.email ?? data.user.email ?? null } as UserProfile)
    setIsPending(false)
  }

  return (
    <main className="login-shell relative min-h-screen overflow-hidden bg-[#f4f7fb] px-5 py-8 text-[#102543] sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rotate-12 bg-[#00338d] opacity-[0.06]" />
      <div className="pointer-events-none absolute -bottom-36 -left-24 size-96 -rotate-12 bg-[#f4c542] opacity-20" />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Card className="login-panel-enter mx-auto w-full max-w-[500px] border-[#d6e1f0] bg-white shadow-[12px_12px_0_rgba(0,51,141,0.12)]">
          <CardHeader className="gap-5 border-b border-[#e5ebf4] px-7 py-7 sm:px-9 sm:py-9">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-48 items-center border border-[#d6e1f0] bg-white px-3">
                <Image
                  alt="Empresas Polar"
                  className="h-auto w-full object-contain"
                  height={80}
                  priority
                  src="/empresas-polar-logo.png"
                  width={220}
                />
              </div>
            </div>
            <div>
              <CardTitle className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[#102543]">
                Acceso a Control POP
              </CardTitle>
              <CardDescription className="mt-2 max-w-sm leading-6">
                Inicia sesión con tu correo corporativo para continuar.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-7 py-7 sm:px-9 sm:py-9">
            <form className="space-y-5" noValidate onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="corporate-email">
                  <Mail className="size-4 text-[#00338d]" />
                  Correo corporativo
                </Label>
                <Input
                  aria-describedby={error ? "login-error" : undefined}
                  aria-invalid={Boolean(error && !isCorporateEmail(email))}
                  autoComplete="email"
                  id="corporate-email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={`nombre.apellido@${CORPORATE_DOMAIN}`}
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="corporate-password">
                  <KeyRound className="size-4 text-[#00338d]" />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    aria-describedby={error ? "login-error" : undefined}
                    aria-invalid={Boolean(error && !isValidPassword(password))}
                    autoComplete="current-password"
                    className="pr-10"
                    id="corporate-password"
                    minLength={8}
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ingresa tu contraseña"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <Button
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-0 top-0 text-[#526782]"
                    onClick={() => setShowPassword((current) => !current)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <p className="text-xs leading-5 text-[#71839b]">
                  Mínimo 8 caracteres, con mayúscula, minúscula y número.
                </p>
              </div>

              {error ? (
                <p className="border border-[#d96b6b]/30 bg-[#fff2f2] px-3 py-2 text-sm leading-5 text-[#a93333]" id="login-error" role="alert">
                  {error}
                </p>
              ) : null}

              <Button className="h-11 w-full justify-between px-4" disabled={isPending} type="submit">
                <span>{isPending ? "Validando acceso…" : "Acceder a Control POP"}</span>
                {isPending ? <LoaderCircle className="animate-spin" /> : <ArrowRight className="motion-icon" />}
              </Button>
            </form>

            <details className="mt-7 border-t border-[#e5ebf4] pt-5 group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#71839b] outline-none transition-colors hover:text-[#00338d] focus-visible:text-[#00338d] [&::-webkit-details-marker]:hidden">
                Perfiles de acceso
                <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="mt-3 grid gap-3 text-xs text-[#526782] sm:grid-cols-2">
                <div className="border border-[#e5ebf4] p-3">
                  <p className="font-bold text-[#00338d]">Vendedor</p>
                  <p className="mt-2 leading-5">Acceso administrado desde Supabase Auth.</p>
                </div>
                <div className="border border-[#e5ebf4] p-3">
                  <p className="font-bold text-[#00338d]">Coordinador</p>
                  <p className="mt-2 leading-5">Acceso administrado desde Supabase Auth.</p>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
