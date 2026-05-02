"use client"

import {
  Briefcase,
  Building2,
  Cpu,
  DollarSign,
  BarChart3,
  Zap,
  ShoppingCart,
  Pill,
  Truck,
  Home,
  Smartphone,
  Utensils,
  Film,
  Plane,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

type IndustryBadgeProps = {
  industry: string | null | undefined
}

// Factory icon component (not in lucide-react by default)
const Factory = ({ ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 20h20M4 10l2-6h12l2 6M6 12v6M10 12v6M14 12v6M18 12v6" />
  </svg>
)

const INDUSTRY_STYLES: Record<string, { icon: LucideIcon | typeof Factory; className: string }> = {
  TECHNOLOGY: { icon: Cpu, className: "border-blue-500/30 bg-blue-500/10 text-blue-700" },
  FINANCE: { icon: DollarSign, className: "border-green-500/30 bg-green-500/10 text-green-700" },
  HEALTHCARE: { icon: Pill, className: "border-red-500/30 bg-red-500/10 text-red-700" },
  ENERGY: { icon: Zap, className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700" },
  RETAIL: { icon: ShoppingCart, className: "border-pink-500/30 bg-pink-500/10 text-pink-700" },
  CONSUMER: { icon: Utensils, className: "border-orange-500/30 bg-orange-500/10 text-orange-700" },
  INDUSTRIAL: { icon: Factory, className: "border-slate-500/30 bg-slate-500/10 text-slate-700" },
  TRANSPORTATION: { icon: Truck, className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700" },
  REALESTATE: { icon: Home, className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  TELECOMMUNICATIONS: { icon: Smartphone, className: "border-purple-500/30 bg-purple-500/10 text-purple-700" },
  MEDIA: { icon: Film, className: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700" },
  TRAVEL: { icon: Plane, className: "border-teal-500/30 bg-teal-500/10 text-teal-700" },
  FINANCIAL_SERVICES: { icon: BarChart3, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" },
}

function normalizeIndustry(industry: string): string {
  return industry.trim().toUpperCase().replace(/\s+/g, "")
}

function getIndustryVisuals(industry: string | null | undefined): {
  icon: LucideIcon | typeof Factory
  className: string
} {
  if (!industry) {
    return INDUSTRY_STYLES.FINANCIAL_SERVICES || { icon: Briefcase, className: "border-gray-500/30 bg-gray-500/10 text-gray-700" }
  }

  const normalized = normalizeIndustry(industry)

  // Try exact match
  if (INDUSTRY_STYLES[normalized]) {
    return INDUSTRY_STYLES[normalized]
  }

  // Try partial matches
  for (const [key, style] of Object.entries(INDUSTRY_STYLES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return style
    }
  }

  // Default fallback
  return INDUSTRY_STYLES.FINANCIAL_SERVICES || { icon: Briefcase, className: "border-gray-500/30 bg-gray-500/10 text-gray-700" }
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function IndustryBadge({ industry }: IndustryBadgeProps) {
  if (!industry) {
    return null
  }

  const { icon: IndustryIcon, className } = getIndustryVisuals(industry)

  return (
    <Badge variant="outline" className={className}>
      <IndustryIcon data-icon="inline-start" />
      {toTitleCase(industry)}
    </Badge>
  )
}


