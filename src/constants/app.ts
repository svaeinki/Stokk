// Límites de la versión gratuita
export const FREE_TIER_PRODUCT_LIMIT = 20;

// Paleta de colores de la app
export const PALETTE = {
  // Colores principales
  smartBlue: '#3066BE',      // Primary - azul principal
  darkCyan: '#119DA4',       // Secondary - cyan oscuro
  steelBlue: '#6D9DC5',      // Tertiary - azul acero
  pearlAqua: '#80DED9',      // Accent - aqua perla
  icyAqua: '#AEECEF',        // Light accent - aqua hielo

  // Variantes para modo oscuro (más brillantes)
  smartBlueDark: '#4A8AE6',
  darkCyanDark: '#1AC4CC',
  steelBlueDark: '#8BB8DB',
  pearlAquaDark: '#9EEAE6',
  icyAquaDark: '#C4F4F6',
} as const;

// Colores especiales que no están en el tema (ej: iconos decorativos)
export const COLORS = {
  gold: '#FFD700',           // Para iconos de premium/diamante
  success: '#4CAF50',        // Verde éxito
  warning: '#FF9800',        // Naranja advertencia
  error: '#F44336',          // Rojo error
} as const;
