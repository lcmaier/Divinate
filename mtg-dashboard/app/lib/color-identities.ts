// app/lib/color-identities.ts

// Main color palette interface
export interface ColorPalette {
    primary: string;      // Main color (header backgrounds, borders)
    secondary: string;    // Secondary color (accents, buttons)
    light: string;        // Light version (backgrounds)
    dark: string;         // Dark version (text)
    muted: string;        // Muted version (subtle elements)
    border: string;       // Border color
    header: string;       // Header background
    text: {
      primary: string;    // Primary text color
      secondary: string;  // Secondary text color
    };
    panel: {
      background: string; // Panel background
      border: string;     // Panel border
    };
  }
  
  // White (W)
  export const whitePalette: ColorPalette = {
    primary: '#E9E7E2',       // Soft white
    secondary: '#F8F6F0',     // Off-white
    light: '#FDFCFA',         // Very light white
    dark: '#ABA89E',          // Slightly gray
    muted: '#F5F3ED',         // Muted white
    border: '#E0DED8',        // Light gray border
    header: 'linear-gradient(135deg, #FFFFFF 0%, #E9E7E2 100%)',
    text: {
      primary: '#1A1814',     // Almost black
      secondary: '#7A776E',   // Muted gray
    },
    panel: {
      background: '#FDFCFA',
      border: '#E0DED8',
    },
  };
  
  // Blue (U)
  export const bluePalette: ColorPalette = {
    primary: '#3B82F6',       // Medium blue
    secondary: '#60A5FA', 
    light: '#EFF6FF',         // Very light blue
    dark: '#1E40AF',          // Dark blue
    muted: '#BFDBFE',         // Soft blue
    border: '#93C5FD',        // Light blue border
    header: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
    text: {
      primary: '#1E3A8A',     // Dark blue
      secondary: '#3B82F6',   // Medium blue
    },
    panel: {
      background: '#F5F9FF',
      border: '#BFDBFE',
    },
  };
  
  // Black (B)
  export const blackPalette: ColorPalette = {
    primary: '#374151',       // Charcoal
    secondary: '#4B5563',     // Dark gray
    light: '#F3F4F6',         // Light gray
    dark: '#1F2937',          // Very dark gray
    muted: '#9CA3AF',         // Medium gray
    border: '#6B7280',        // Gray border
    header: 'linear-gradient(135deg, #4B5563 0%, #374151 100%)',
    text: {
      primary: '#1F2937',     // Dark gray
      secondary: '#6B7280',   // Medium gray
    },
    panel: {
      background: '#F9FAFB',
      border: '#E5E7EB',
    },
  };
  
  // Red (R)
  export const redPalette: ColorPalette = {
    primary: '#EF4444',       // Medium red
    secondary: '#F87171',     // Light red
    light: '#FEF2F2',         // Very light red
    dark: '#B91C1C',          // Dark red
    muted: '#FECACA',         // Soft red
    border: '#FCA5A5',        // Light red border
    header: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
    text: {
      primary: '#991B1B',     // Dark red
      secondary: '#EF4444',   // Medium red
    },
    panel: {
      background: '#FEF2F2',
      border: '#FECACA',
    },
  };
  
  // Green (G)
  export const greenPalette: ColorPalette = {
    primary: '#10B981',       // Medium green
    secondary: '#34D399',     // Light green
    light: '#ECFDF5',         // Very light green
    dark: '#047857',          // Dark green
    muted: '#A7F3D0',         // Soft green
    border: '#6EE7B7',        // Light green border
    header: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
    text: {
      primary: '#065F46',     // Dark green
      secondary: '#10B981',   // Medium green
    },
    panel: {
      background: '#F0FDF4',
      border: '#A7F3D0',
    },
  };
  
  // Colorless
  export const colorlessPalette: ColorPalette = {
    primary: '#94A3B8',       // Slate
    secondary: '#CBD5E1',     // Light slate
    light: '#F8FAFC',         // Very light slate
    dark: '#64748B',          // Dark slate
    muted: '#E2E8F0',         // Soft slate
    border: '#CBD5E1',        // Light slate border
    header: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
    text: {
      primary: '#334155',     // Dark slate
      secondary: '#64748B',   // Medium slate
    },
    panel: {
      background: '#F8FAFC',
      border: '#E2E8F0',
    },
  };
  
  // Multicolor (Gold)
  export const multicolorPalette: ColorPalette = {
    primary: '#F59E0B',       // Amber
    secondary: '#FBBF24',     // Light amber
    light: '#FFFBEB',         // Very light amber
    dark: '#B45309',          // Dark amber
    muted: '#FDE68A',         // Soft amber
    border: '#FCD34D',        // Light amber border
    header: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
    text: {
      primary: '#92400E',     // Dark amber
      secondary: '#F59E0B',   // Medium amber
    },
    panel: {
      background: '#FFFBEB',
      border: '#FDE68A',
    },
  };
  
  // Function to get the palette based on color identity
  export function getPaletteFromColorIdentity(colorIdentity: string[]): ColorPalette {
    // No colors means colorless
    if (!colorIdentity || colorIdentity.length === 0) {
      return colorlessPalette;
    }
    
    // Sort the colors to ensure consistent order (WUBRG)
    const sortOrder: Record<string, number> = { W: 0, U: 1, B: 2, R: 3, G: 4 };
    const sortedColors = [...colorIdentity].sort((a, b) => sortOrder[a] - sortOrder[b]);
    const colorKey = sortedColors.join('');
    
    // More than 1 color uses the gold/multicolor palette
    if (colorIdentity.length > 1) {
      return multicolorPalette;
    }
    
    // Map the color combinations to the appropriate palette
    const palettes: Record<string, ColorPalette> = {
      // Single colors
      'W': whitePalette,
      'U': bluePalette,
      'B': blackPalette,
      'R': redPalette,
      'G': greenPalette,
    };
    
    return palettes[colorKey] || multicolorPalette;
  }