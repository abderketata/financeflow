import { createTheme, alpha, type SxProps, type Theme } from '@mui/material/styles';

// ── Palette Flux Financier — Clean SaaS Fintech ─────────────────────────
const slate = {
  900: '#0F172A',
  800: '#1E293B',
  700: '#334155',
  600: '#475569',
  500: '#64748B',
  400: '#94A3B8',
  300: '#CBD5E1',
  200: '#E2E8F0',
  100: '#F1F5F9',
  50:  '#F8FAFC',
};

const blue = {
  900: '#1E3A8A',
  800: '#1E40AF',
  700: '#1D4ED8',
  600: '#2563EB',
  500: '#3B82F6',
  400: '#60A5FA',
  300: '#93C5FD',
  200: '#BFDBFE',
  100: '#DBEAFE',
  50:  '#EFF6FF',
};

export const brandColors = {
  slate,
  blue,
  // keep navy as alias for backward compatibility
  navy: slate,
  // Semantic
  credit:     '#059669',
  creditBg:   '#ECFDF5',
  debit:      '#DC2626',
  debitBg:    '#FEF2F2',
  warning:    '#D97706',
  warningBg:  '#FFFBEB',
  alert:      '#7C3AED',
  alertBg:    '#F5F3FF',
  info:       '#2563EB',
  infoBg:     '#EFF6FF',
  // Sidebar (light mode)
  sidebar: {
    bg: '#FFFFFF',
    activeItem: alpha(blue[600], 0.08),
    hoverItem:  alpha(slate[500], 0.06),
  },
  // Surfaces
  surface: {
    glass: '#FFFFFF',
    glassBorder: alpha(slate[200], 0.8),
    elevated: '#FFFFFF',
    soft: slate[100],
    subtle: alpha(slate[200], 0.5),
  },
  // Gradients
  gradient: {
    sidebar: '#FFFFFF',
    cta: `linear-gradient(135deg, ${blue[600]} 0%, ${blue[500]} 100%)`,
    ctaHover: `linear-gradient(135deg, ${blue[700]} 0%, ${blue[600]} 100%)`,
    card: '#FFFFFF',
    hero: `linear-gradient(135deg, ${slate[900]} 0%, ${blue[800]} 50%, ${blue[600]} 100%)`,
  },
};

// ── Shadow system ───────────────────────────────────────────────────────
export const premiumShadows = {
  xs: `0 1px 2px ${alpha(slate[900], 0.05)}`,
  sm: `0 1px 3px ${alpha(slate[900], 0.07)}, 0 1px 2px ${alpha(slate[900], 0.04)}`,
  md: `0 4px 8px ${alpha(slate[900], 0.05)}, 0 2px 4px ${alpha(slate[900], 0.03)}`,
  lg: `0 10px 20px ${alpha(slate[900], 0.06)}, 0 4px 8px ${alpha(slate[900], 0.03)}`,
  xl: `0 20px 40px ${alpha(slate[900], 0.08)}, 0 8px 16px ${alpha(slate[900], 0.04)}`,
  card: `0 1px 3px ${alpha(slate[900], 0.06)}, 0 1px 2px ${alpha(slate[900], 0.03)}`,
  cardHover: `0 8px 24px ${alpha(slate[900], 0.08)}, 0 4px 8px ${alpha(slate[900], 0.04)}`,
  button: `0 1px 2px ${alpha(blue[700], 0.2)}, 0 1px 3px ${alpha(slate[900], 0.06)}`,
  buttonHover: `0 4px 12px ${alpha(blue[700], 0.25)}, 0 2px 4px ${alpha(slate[900], 0.06)}`,
  dialog: `0 25px 50px ${alpha(slate[900], 0.15)}`,
  glass: `0 4px 6px ${alpha(slate[900], 0.04)}`,
  ring: (color: string) => `0 0 0 3px ${alpha(color, 0.12)}`,
};

// ── Style helpers ───────────────────────────────────────────────────────
export const glassCard = (): SxProps<Theme> => ({
  background: '#FFFFFF',
  border: `1px solid ${slate[200]}`,
  boxShadow: premiumShadows.card,
});

export const accentBar = (color: string, height = 3): SxProps<Theme> => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height,
  background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.3)})`,
  borderRadius: '12px 12px 0 0',
});

export const iconBox = (color: string, size = 44): SxProps<Theme> => ({
  width: size,
  height: size,
  borderRadius: size >= 44 ? '12px' : '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(color, 0.08),
  border: `1px solid ${alpha(color, 0.08)}`,
  color,
  flexShrink: 0,
  transition: 'all 0.2s ease',
});

export const actionIconButton = (color: string): SxProps<Theme> => ({
  color,
  backgroundColor: alpha(color, 0.06),
  border: `1px solid ${alpha(color, 0.1)}`,
  borderRadius: '9px',
  width: 32,
  height: 32,
  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(color, 0.12),
    borderColor: alpha(color, 0.2),
    transform: 'translateY(-1px)',
    boxShadow: `0 2px 8px ${alpha(color, 0.15)}`,
  },
});

/** Standardized clear button style (red X) for all clearable fields. */
export const clearButtonStyle: SxProps<Theme> = {
  width: 24,
  height: 24,
  color: '#DC2626',
  backgroundColor: alpha('#DC2626', 0.08),
  border: `1px solid ${alpha('#DC2626', 0.14)}`,
  '&:hover': {
    backgroundColor: alpha('#DC2626', 0.14),
    borderColor: alpha('#DC2626', 0.24),
  },
};

/** Standardized clear button style for absolutely positioned clear buttons. */
export const clearButtonAbsoluteStyle: SxProps<Theme> = {
  position: 'absolute',
  right: 28,
  top: '50%',
  transform: 'translateY(-50%)',
  ...clearButtonStyle,
};

export const numericFont = '"DM Mono", "Roboto Mono", monospace';
export const headingFont = '"Plus Jakarta Sans", "Inter", sans-serif';

// ── Theme ───────────────────────────────────────────────────────────────
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: blue[600],
      light: blue[400],
      dark: blue[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: blue[500],
      light: blue[300],
      dark: blue[700],
      contrastText: '#ffffff',
    },
    error: {
      main: '#DC2626',
      light: '#FCA5A5',
      dark: '#991B1B',
    },
    warning: {
      main: '#D97706',
      light: '#FCD34D',
      dark: '#92400E',
    },
    success: {
      main: '#059669',
      light: '#6EE7B7',
      dark: '#065F46',
    },
    info: {
      main: '#2563EB',
      light: '#93C5FD',
      dark: '#1E40AF',
    },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    divider: alpha(slate[200], 0.8),
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif',
    h1: {
      fontFamily: headingFont,
      fontWeight: 800,
      fontSize: '2rem',
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
      color: slate[900],
    },
    h2: {
      fontFamily: headingFont,
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
      color: slate[900],
    },
    h3: {
      fontFamily: headingFont,
      fontWeight: 700,
      fontSize: '1.4rem',
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
      color: slate[900],
    },
    h4: {
      fontFamily: headingFont,
      fontWeight: 700,
      fontSize: '1.2rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.35,
      color: slate[800],
    },
    h5: {
      fontFamily: headingFont,
      fontWeight: 600,
      fontSize: '1.05rem',
      letterSpacing: '-0.005em',
      color: slate[800],
    },
    h6: {
      fontFamily: headingFont,
      fontWeight: 600,
      fontSize: '0.95rem',
      color: slate[800],
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '0.95rem',
      color: slate[600],
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      color: slate[500],
    },
    body1: {
      fontSize: '0.938rem',
      lineHeight: 1.65,
      color: slate[700],
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: slate[500],
    },
    caption: {
      fontSize: '0.8rem',
      color: slate[500],
      letterSpacing: '0.01em',
    },
    overline: {
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: slate[500],
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
      letterSpacing: '0.01em',
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: 6, height: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: slate[300],
            borderRadius: 3,
            '&:hover': { background: slate[400] },
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${alpha(slate[200], 0.8)}`,
          boxShadow: premiumShadows.card,
          transition: 'box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: premiumShadows.cardHover,
            borderColor: alpha(slate[300], 0.9),
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 12 },
        elevation1: {
          boxShadow: premiumShadows.sm,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 22px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': { transform: 'translateY(0)' },
        },
        contained: {
          background: `linear-gradient(135deg, ${blue[600]} 0%, ${blue[500]} 100%)`,
          boxShadow: premiumShadows.button,
          '&:hover': {
            background: `linear-gradient(135deg, ${blue[700]} 0%, ${blue[600]} 100%)`,
            boxShadow: premiumShadows.buttonHover,
            transform: 'translateY(-1px)',
          },
        },
        containedError: {
          background: `linear-gradient(135deg, #DC2626 0%, #EF4444 100%)`,
          boxShadow: `0 1px 2px ${alpha('#DC2626', 0.2)}, 0 1px 3px ${alpha(slate[900], 0.06)}`,
          '&:hover': {
            background: `linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)`,
            boxShadow: `0 4px 12px ${alpha('#DC2626', 0.3)}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          borderColor: slate[200],
          color: slate[700],
          backgroundColor: '#FFFFFF',
          '&:hover': {
            borderWidth: 1.5,
            backgroundColor: blue[50],
            borderColor: blue[400],
            color: blue[600],
            transform: 'translateY(-1px)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: alpha(blue[500], 0.06),
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.82rem',
          borderRadius: 8,
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '0.95rem',
          borderRadius: 12,
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease',
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            fontSize: '0.9rem',
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: blue[400],
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              boxShadow: `0 0 0 3px ${alpha(blue[500], 0.1)}`,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: blue[500],
              borderWidth: 2,
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: slate[200],
            transition: 'all 0.2s ease',
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.88rem',
            color: slate[500],
            '&.Mui-focused': {
              color: blue[600],
            },
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: 8,
          height: 26,
          transition: 'all 0.15s ease',
        },
        colorSuccess: {
          backgroundColor: brandColors.creditBg,
          color: '#065F46',
          border: `1px solid ${alpha('#059669', 0.15)}`,
        },
        colorWarning: {
          backgroundColor: brandColors.warningBg,
          color: '#92400E',
          border: `1px solid ${alpha('#D97706', 0.15)}`,
        },
        colorError: {
          backgroundColor: brandColors.debitBg,
          color: '#991B1B',
          border: `1px solid ${alpha('#DC2626', 0.15)}`,
        },
        colorInfo: {
          backgroundColor: brandColors.infoBg,
          color: '#1E40AF',
          border: `1px solid ${alpha('#2563EB', 0.15)}`,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          boxShadow: premiumShadows.dialog,
          border: `1px solid ${alpha(slate[200], 0.6)}`,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: headingFont,
          fontSize: '1.1rem',
          fontWeight: 700,
          paddingBottom: 8,
        },
      },
    },

    MuiAutocomplete: {
      defaultProps: {
        openText: 'Ouvrir',
        clearText: 'Effacer',
        loadingText: 'Chargement…',
      },
      styleOverrides: {
        root: {
          '& .MuiAutocomplete-popupIndicator': {
            color: slate[400],
            borderRadius: 8,
            transition: 'all 0.18s ease',
          },
          '& .MuiAutocomplete-popupIndicator:hover': {
            backgroundColor: alpha(blue[500], 0.08),
            color: blue[600],
          },
          '& .MuiAutocomplete-clearIndicator': {
            width: 24,
            height: 24,
            color: '#DC2626',
            backgroundColor: alpha('#DC2626', 0.08),
            border: `1px solid ${alpha('#DC2626', 0.14)}`,
            borderRadius: 8,
            transition: 'all 0.18s ease',
            '&:hover': {
              backgroundColor: alpha('#DC2626', 0.14),
              borderColor: alpha('#DC2626', 0.24),
            },
          },
        },
        paper: {
          marginTop: 6,
          borderRadius: 14,
          border: `1px solid ${alpha(slate[200], 0.95)}`,
          backgroundColor: alpha(slate[50], 0.98),
          backgroundImage: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.92)} 0%, ${alpha(blue[50], 0.72)} 100%)`,
          boxShadow: premiumShadows.lg,
          overflow: 'hidden',
        },
        listbox: {
          padding: 6,
          '& .MuiAutocomplete-option': {
            minHeight: 52,
            padding: '9px 12px',
            margin: '3px 0',
            borderRadius: 10,
            border: '1px solid transparent',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: alpha(blue[500], 0.06),
              borderColor: alpha(blue[300], 0.18),
            },
            '&.Mui-focused, &[data-focus="true"]': {
              backgroundColor: alpha(blue[500], 0.08),
              borderColor: alpha(blue[400], 0.22),
            },
            '&[aria-selected="true"]': {
              backgroundColor: alpha(blue[500], 0.12),
              borderColor: alpha(blue[500], 0.24),
            },
            '&[aria-selected="true"]:hover, &[aria-selected="true"].Mui-focused': {
              backgroundColor: alpha(blue[500], 0.16),
              borderColor: alpha(blue[500], 0.28),
            },
          },
        },
        noOptions: {
          padding: '10px 12px',
          color: slate[500],
          fontSize: '0.84rem',
        },
        loading: {
          padding: '10px 12px',
          color: slate[500],
          fontSize: '0.84rem',
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${slate[200]}`,
          boxShadow: premiumShadows.lg,
          background: '#FFFFFF',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          fontSize: '0.88rem',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: slate[50],
          },
          '&.Mui-selected': {
            backgroundColor: alpha(blue[50], 0.8),
            '&:hover': {
              backgroundColor: blue[50],
            },
          },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease',
        },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '0.85rem',
          fontFamily: headingFont,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.88rem',
          borderRadius: 10,
          minHeight: 44,
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            color: blue[600],
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 2,
          backgroundColor: blue[600],
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: alpha(slate[300], 0.2),
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 500,
          fontSize: '0.88rem',
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: brandColors.creditBg,
          color: '#065F46',
          borderColor: alpha('#059669', 0.15),
        },
        standardError: {
          backgroundColor: brandColors.debitBg,
          color: '#991B1B',
          borderColor: alpha('#DC2626', 0.15),
        },
        standardWarning: {
          backgroundColor: brandColors.warningBg,
          color: '#92400E',
          borderColor: alpha('#D97706', 0.15),
        },
        standardInfo: {
          backgroundColor: brandColors.infoBg,
          color: '#1E40AF',
          borderColor: alpha('#2563EB', 0.15),
        },
      },
    },

    MuiBadge: {
      styleOverrides: {
        colorError: {
          background: '#DC2626',
          fontWeight: 700,
          fontSize: '0.68rem',
          boxShadow: `0 2px 4px ${alpha('#DC2626', 0.3)}`,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.78rem',
          fontWeight: 500,
          backgroundColor: slate[800],
          padding: '7px 14px',
          boxShadow: premiumShadows.md,
        },
        arrow: {
          color: slate[800],
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: slate[200],
        },
      },
    },
  },
});

// DataGrid overrides (applied separately to avoid strict TS component typing)
(theme.components as any).MuiDataGrid = {
  styleOverrides: {
    root: {
      border: 'none',
      fontSize: '0.855rem',
      fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif',
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: '#FAFBFC',
        borderBottom: `2px solid ${slate[200]}`,
        fontSize: '0.72rem',
        fontWeight: 700,
        color: slate[500],
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        minHeight: '48px !important',
      },
      '& .MuiDataGrid-columnHeader': {
        '&:focus, &:focus-within': {
          outline: 'none',
        },
      },
      '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 700,
        fontFamily: headingFont,
      },
      '& .MuiDataGrid-columnSeparator': {
        display: 'none',
      },
      '& .MuiDataGrid-cell': {
        borderBottom: `1px solid ${alpha(slate[200], 0.6)}`,
        color: slate[700],
        padding: '14px 16px',
        fontSize: '0.855rem',
        display: 'flex',
        alignItems: 'center',
        '&:focus, &:focus-within': {
          outline: 'none',
        },
      },
      '& .MuiDataGrid-row': {
        minHeight: '56px !important',
        transition: 'background 0.15s ease',
        '&:hover': {
          backgroundColor: alpha(blue[50], 0.5),
        },
        '&:last-child .MuiDataGrid-cell': {
          borderBottom: 'none',
        },
        '&.Mui-selected': {
          backgroundColor: alpha(blue[50], 0.7),
          '&:hover': {
            backgroundColor: blue[50],
          },
        },
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: `2px solid ${slate[200]}`,
        backgroundColor: '#FAFBFC',
        minHeight: '48px !important',
      },
      '& .MuiDataGrid-virtualScroller': {
        backgroundColor: '#FFFFFF',
      },
    },
  },
};
