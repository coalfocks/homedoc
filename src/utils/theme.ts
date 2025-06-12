export const theme = {
  colors: {
    // Primary brand colors
    primary: {
      main: '#8A75FF',
      light: '#A99BFF',
      dark: '#6B4EFF',
      contrast: '#FFFFFF',
    },
    // Secondary brand colors
    secondary: {
      main: '#FF6B4E',
      light: '#FF8A75',
      dark: '#B54A3B',
      contrast: '#FFFFFF',
    },
    // Accent colors
    accent: {
      main: '#00C853',
      light: '#69F0AE',
      dark: '#009624',
      contrast: '#FFFFFF',
    },
    // Neutral colors
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    // Semantic colors
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
      contrast: '#FFFFFF',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
      contrast: '#FFFFFF',
    },
    warning: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#FFA000',
      contrast: '#1A1A1A',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
      contrast: '#FFFFFF',
    },
    // Background colors
    background: {
      default: '#1A1F2E', // Dark slate background
      paper: '#2A2F3E', // Slightly lighter slate for cards
      dark: '#0A0F1E', // Darker slate for contrast
    },
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B5C4', // Light gray for secondary text
      disabled: '#6E7280',
      hint: '#6E7280',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: '50%',
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 28,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 18,
      fontWeight: 'bold',
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    body1: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    body2: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    button: {
      fontSize: 14,
      fontWeight: 'bold',
      lineHeight: 20,
      letterSpacing: 1.25,
      textTransform: 'uppercase',
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  animation: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};
