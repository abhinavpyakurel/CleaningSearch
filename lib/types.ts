export type ServiceType =
  | "Deep Clean"
  | "Regular Clean"
  | "Move-in/out"
  | "Post-Construction"
  | "Office Clean"
  | "Carpet Clean"
  | "Window Clean"
  | "Eco-Friendly"

export type Availability = "Available Today" | "Available This Week" | "Available Next Week"

export interface Review {
  id: string
  author: string
  avatar: string
  rating: number
  date: string
  comment: string
}

export interface Cleaner {
  id: string
  name: string
  avatar: string
  tagline: string
  location: string
  distance: string
  rating: number
  reviewCount: number
  hourlyRate: number
  minimumHours: number
  yearsExperience: number
  jobsCompleted: number
  responseTime: string
  availability: Availability
  services: ServiceType[]
  bio: string
  verified: boolean
  backgroundChecked: boolean
  insured: boolean
  languages: string[]
  badges: string[]
  featured: boolean
  reviews: Review[]
}
