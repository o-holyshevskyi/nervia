/* eslint-disable @typescript-eslint/no-explicit-any */

/** Mock groups for demo cluster mode (GraphGroup shape). */
export const mockGroups = [
  { id: "g-ai", name: "AI", color: "#10b981" },
  { id: "g-research", name: "Research", color: "#6366f1" },
  { id: "g-design", name: "Design", color: "#f97316" },
  { id: "g-product", name: "Product", color: "#06b6d4" },
];

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

/** Mock nodes for demo: same shape as useGraphData / GraphNetwork expect. */
export const initialNodes: any[] = [
  { id: "n1", title: "AI Ideas", content: "Ideas for AI-powered features.", type: "idea", group: 2, group_id: "g-ai", tags: ["ai", "roadmap"], val: 5, created_at: new Date(now - 5 * day).toISOString() },
  { id: "n2", title: "Project Alpha", content: "Main product initiative.", type: "note", group: 3, group_id: "g-research", tags: ["product", "alpha"], val: 5, created_at: new Date(now - 4 * day).toISOString() },
  { id: "n3", title: "Meeting Notes", content: "Q1 planning and decisions.", type: "note", group: 1, tags: ["meetings"], val: 5, created_at: new Date(now - 3 * day).toISOString() },
  { id: "n4", title: "Research", content: "User research findings and synthesis.", type: "note", group: 3, group_id: "g-research", tags: ["research", "ux"], val: 5, created_at: new Date(now - 6 * day).toISOString() },
  { id: "n5", title: "Design System", content: "Components and tokens.", type: "note", group: 4, group_id: "g-design", tags: ["design", "ui"], val: 5, created_at: new Date(now - 7 * day).toISOString() },
  { id: "n6", title: "API Docs", content: "REST and GraphQL reference.", type: "link", url: "https://api.example.com/docs", group: 1, tags: ["api", "dev"], val: 5, created_at: new Date(now - 2 * day).toISOString() },
  { id: "n7", title: "Neural Architecture", content: "How we model knowledge graphs.", type: "idea", group: 2, group_id: "g-ai", tags: ["ai", "architecture"], val: 5, created_at: new Date(now - 8 * day).toISOString() },
  { id: "n8", title: "Roadmap 2025", content: "High-level product roadmap.", type: "note", group: 4, group_id: "g-product", tags: ["roadmap", "strategy"], val: 5, created_at: new Date(now - 1 * day).toISOString() },
  { id: "n9", title: "UX Patterns", content: "Reusable patterns library.", type: "note", group: 4, group_id: "g-design", tags: ["design", "ux"], val: 5, created_at: new Date(now - 9 * day).toISOString() },
  { id: "n10", title: "Data Pipeline", content: "ETL and ingestion flows.", type: "idea", group: 2, group_id: "g-ai", tags: ["data", "ai"], val: 5, created_at: new Date(now - 10 * day).toISOString() },
  { id: "n11", title: "Customer Feedback", content: "NPS and support insights.", type: "note", group: 3, group_id: "g-research", tags: ["feedback", "research"], val: 5, created_at: new Date(now - 11 * day).toISOString() },
  { id: "n12", title: "Docs Site", content: "Public documentation.", type: "link", url: "https://docs.example.com", group: 1, tags: ["docs"], val: 5, created_at: new Date(now - 12 * day).toISOString() },
  { id: "n13", title: "A/B Tests", content: "Experiments and results.", type: "note", group: 3, group_id: "g-research", tags: ["experiments"], val: 5, created_at: new Date(now - 13 * day).toISOString() },
  { id: "n14", title: "Brand Guidelines", content: "Logo, colors, voice.", type: "note", group: 4, group_id: "g-design", tags: ["brand", "design"], val: 5, created_at: new Date(now - 14 * day).toISOString() },
  { id: "n15", title: "Integrations", content: "Third-party APIs and webhooks.", type: "idea", group: 2, group_id: "g-ai", tags: ["integrations", "api"], val: 5, created_at: new Date(now - 15 * day).toISOString() },
  { id: "n16", title: "Sprint Planning", content: "Current sprint goals.", type: "note", group: 1, tags: ["agile", "meetings"], val: 5, created_at: new Date(now - 16 * day).toISOString() },
  { id: "n17", title: "Security Review", content: "Audit and compliance notes.", type: "note", group: 1, tags: ["security"], val: 5, created_at: new Date(now - 17 * day).toISOString() },
  { id: "n18", title: "Performance", content: "Metrics and optimization.", type: "idea", group: 2, group_id: "g-ai", tags: ["perf", "ai"], val: 5, created_at: new Date(now - 18 * day).toISOString() },
];

/** Mock links for demo: source/target ids, relationType, label, weight. */
export const initialLinks: any[] = [
  { source: "n1", target: "n2", relationType: "manual", label: "feeds into", weight: 1 },
  { source: "n1", target: "n7", relationType: "ai", label: "AI Similarity", weight: 1 },
  { source: "n2", target: "n3", relationType: "manual", label: "discussed in", weight: 1 },
  { source: "n2", target: "n8", relationType: "manual", label: "part of", weight: 1 },
  { source: "n3", target: "n16", relationType: "manual", label: "sprint", weight: 1 },
  { source: "n4", target: "n2", relationType: "manual", label: "informs", weight: 1 },
  { source: "n4", target: "n11", relationType: "manual", label: "feedback", weight: 1 },
  { source: "n5", target: "n9", relationType: "manual", label: "extends", weight: 1 },
  { source: "n5", target: "n14", relationType: "manual", label: "brand", weight: 1 },
  { source: "n6", target: "n10", relationType: "manual", label: "API", weight: 1 },
  { source: "n6", target: "n15", relationType: "manual", label: "integrations", weight: 1 },
  { source: "n7", target: "n1", relationType: "ai", label: "AI connection", weight: 1 },
  { source: "n7", target: "n10", relationType: "manual", label: "data", weight: 1 },
  { source: "n8", target: "n2", relationType: "manual", label: "roadmap", weight: 1 },
  { source: "n9", target: "n5", relationType: "manual", label: "design system", weight: 1 },
  { source: "n10", target: "n18", relationType: "manual", label: "perf", weight: 1 },
  { source: "n11", target: "n13", relationType: "manual", label: "experiments", weight: 1 },
  { source: "n12", target: "n6", relationType: "manual", label: "docs", weight: 1 },
  { source: "n13", target: "n4", relationType: "manual", label: "research", weight: 1 },
  { source: "n15", target: "n6", relationType: "manual", label: "API", weight: 1 },
  { source: "n16", target: "n3", relationType: "manual", label: "meetings", weight: 1 },
  { source: "n17", target: "n2", relationType: "manual", label: "security", weight: 1 },
  { source: "n18", target: "n7", relationType: "ai", label: "AI connection", weight: 1 },
];
