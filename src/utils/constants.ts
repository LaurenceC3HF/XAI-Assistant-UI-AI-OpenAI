export const TABS = [
  { id: 'insight', label: 'INSIGHT', description: 'Key facts and perceptions' },
  { id: 'reasoning', label: 'REASONING', description: 'Causal analysis and trade-offs' },
  { id: 'projection', label: 'PROJECTION', description: 'Future outcomes and alternatives' }
] as const;

export const COLORS = {
  primary: '#1e40af',
  secondary: '#0f172a',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
} as const;

export const ANIMATION_DURATION = 200;