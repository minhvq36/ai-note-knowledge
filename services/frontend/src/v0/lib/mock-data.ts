export interface Tenant {
  id: string
  name: string
  slug: string
  role: "owner" | "admin" | "member"
  memberCount: number
  noteCount: number
  createdAt: string
}

export interface Note {
  id: string
  title: string
  preview: string
  author: string
  authorAvatar: string
  updatedAt: string
  tags: string[]
  shared: boolean
  pinned: boolean
}

export interface Member {
  id: string
  name: string
  email: string
  avatar: string
  role: "owner" | "admin" | "member"
  joinedAt: string
}

export const tenants: Tenant[] = [
  {
    id: "1",
    name: "Acme Corp",
    slug: "acme-corp",
    role: "owner",
    memberCount: 12,
    noteCount: 234,
    createdAt: "2025-01-15",
  },
  {
    id: "2",
    name: "DevTools Inc",
    slug: "devtools-inc",
    role: "admin",
    memberCount: 8,
    noteCount: 156,
    createdAt: "2025-03-22",
  },
  {
    id: "3",
    name: "StartupXYZ",
    slug: "startup-xyz",
    role: "member",
    memberCount: 5,
    noteCount: 89,
    createdAt: "2025-06-10",
  },
  {
    id: "4",
    name: "CloudNative Labs",
    slug: "cloudnative-labs",
    role: "admin",
    memberCount: 20,
    noteCount: 412,
    createdAt: "2024-11-05",
  },
]

export const notes: Note[] = [
  {
    id: "1",
    title: "API Design Guidelines",
    preview: "Best practices for designing RESTful APIs with proper versioning, error handling, and documentation standards.",
    author: "Sarah Chen",
    authorAvatar: "SC",
    updatedAt: "2 hours ago",
    tags: ["api", "guidelines"],
    shared: true,
    pinned: true,
  },
  {
    id: "2",
    title: "Sprint Planning Notes",
    preview: "Key decisions from the Q1 sprint planning session. Focus areas include performance optimization and developer experience.",
    author: "Alex Rivera",
    authorAvatar: "AR",
    updatedAt: "5 hours ago",
    tags: ["planning", "sprint"],
    shared: true,
    pinned: false,
  },
  {
    id: "3",
    title: "Database Migration Strategy",
    preview: "Migration plan from PostgreSQL 14 to 16 with zero-downtime deployment strategy and rollback procedures.",
    author: "Jordan Park",
    authorAvatar: "JP",
    updatedAt: "1 day ago",
    tags: ["database", "migration"],
    shared: false,
    pinned: true,
  },
  {
    id: "4",
    title: "Authentication Flow Redesign",
    preview: "Proposed changes to the OAuth2 flow including PKCE implementation and session management improvements.",
    author: "Sarah Chen",
    authorAvatar: "SC",
    updatedAt: "2 days ago",
    tags: ["auth", "security"],
    shared: true,
    pinned: false,
  },
  {
    id: "5",
    title: "CI/CD Pipeline Optimization",
    preview: "Analysis of current build times and proposed optimizations using caching strategies and parallel execution.",
    author: "Mike Torres",
    authorAvatar: "MT",
    updatedAt: "3 days ago",
    tags: ["devops", "ci-cd"],
    shared: false,
    pinned: false,
  },
  {
    id: "6",
    title: "Component Library Audit",
    preview: "Review of existing UI components for accessibility compliance, performance bottlenecks, and design consistency.",
    author: "Alex Rivera",
    authorAvatar: "AR",
    updatedAt: "4 days ago",
    tags: ["ui", "design-system"],
    shared: true,
    pinned: false,
  },
  {
    id: "7",
    title: "Monitoring & Alerting Setup",
    preview: "Configuration notes for Grafana dashboards, Prometheus metrics collection, and PagerDuty integration.",
    author: "Jordan Park",
    authorAvatar: "JP",
    updatedAt: "5 days ago",
    tags: ["monitoring", "infrastructure"],
    shared: false,
    pinned: false,
  },
]

export const members: Member[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah@acme.dev",
    avatar: "SC",
    role: "owner",
    joinedAt: "Jan 2025",
  },
  {
    id: "2",
    name: "Alex Rivera",
    email: "alex@acme.dev",
    avatar: "AR",
    role: "admin",
    joinedAt: "Feb 2025",
  },
  {
    id: "3",
    name: "Jordan Park",
    email: "jordan@acme.dev",
    avatar: "JP",
    role: "member",
    joinedAt: "Mar 2025",
  },
  {
    id: "4",
    name: "Mike Torres",
    email: "mike@acme.dev",
    avatar: "MT",
    role: "member",
    joinedAt: "Apr 2025",
  },
  {
    id: "5",
    name: "Emily Zhao",
    email: "emily@acme.dev",
    avatar: "EZ",
    role: "member",
    joinedAt: "May 2025",
  },
]
