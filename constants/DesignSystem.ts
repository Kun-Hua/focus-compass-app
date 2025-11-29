// Design System - Colors
// Based on design_system.md

export const Colors = {
  // Primary Colors
  primary: '#3B82F6',       // Blue - Main actions, active states
  success: '#10B981',       // Green - Achievement, completion
  warning: '#F59E0B',       // Amber - Alerts, caution
  error: '#EF4444',         // Red - Failures, errors
  
  // Neutral Colors
  background: '#F9FAFB',    // Light Gray - App background
  surface: '#FFFFFF',       // White - Cards, modals, panels
  
  // Text Colors
  text: {
    primary: '#111827',     // Gray 900
    secondary: '#6B7280',   // Gray 500
    tertiary: '#9CA3AF',    // Gray 400
    disabled: '#D1D5DB',    // Gray 300
  },
  
  // State Colors (Lighter variants)
  primaryLight: '#EFF6FF',  // Blue 50
  successLight: '#D1FAE5',  // Green 100
  warningLight: '#FEF3C7',  // Amber 100
  errorLight: '#FEE2E2',    // Red 100
  
  // Border Colors
  border: {
    default: '#E5E7EB',     // Gray 200
    focus: '#3B82F6',       // Primary
    error: '#EF4444',       // Error
  },
};

// Typography Scale
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

// Spacing System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

// Shadows
export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};
