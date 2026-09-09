export type UserRole = "seller" | "coordinator"

export type UserProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  territory: string | null
}
