// src/redux/slices/themeSlice.js
// Theme state management using Redux Toolkit

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
const getSystemColorScheme = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
import { lightTheme, darkTheme } from '../../theme/theme';

// Available theme modes
export const ThemeMode = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Initial state
const initialState = {
  mode: ThemeMode.SYSTEM,
  isDark: false,
  theme: lightTheme,
  fontScale: 1.0,
  highContrast: false,
  reducedMotion: false,
  status: 'idle'
};

/**
 * Load theme settings from AsyncStorage
 */
export const loadThemeSettings = createAsyncThunk(
  'theme/loadThemeSettings',
  async (_, { rejectWithValue }) => {
      const [[, themeMode], [, fontScale]] = await AsyncStorage.multiGet(['themeMode', 'fontScale']);
      const highContrast = localStorage.getItem('highContrast') === 'true';
      const reducedMotion = localStorage.getItem('reducedMotion') === 'true';
      const systemColorScheme = getSystemColorScheme();
      const mode = themeMode || ThemeMode.SYSTEM;
      const isDark = mode === ThemeMode.DARK || 
        (mode === ThemeMode.SYSTEM && systemColorScheme === 'dark');
      
    try {
      return {
        mode,
        isDark,
        fontScale: fontScale ? parseFloat(fontScale) : 1.0,
        highContrast,
        reducedMotion
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Save theme mode to AsyncStorage
 */
export const saveThemeMode = createAsyncThunk(
  'theme/saveThemeMode',
  async (mode, { rejectWithValue }) => {
    try {
      // Validate mode
      if (!Object.values(ThemeMode).includes(mode)) {
        throw new Error(`Invalid theme mode: ${mode}`);
      }
      
      // Save to AsyncStorage
      AsyncStorage.setItem('themeMode', mode);
      
      // Get system color scheme
      const systemColorScheme = getSystemColorScheme();
      
      // Determine if dark mode
      const isDark = mode === ThemeMode.DARK || 
        (mode === ThemeMode.SYSTEM && systemColorScheme === 'dark');
      
      return { mode, isDark };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Save accessibility settings
 */
export const saveAccessibilitySettings = createAsyncThunk(
  'theme/saveAccessibilitySettings',
  async (settings, { rejectWithValue }) => {
    try {
      const { fontScale, highContrast, reducedMotion } = settings;
      
      // Save to AsyncStorage
      if (fontScale !== undefined) {
        if (typeof fontScale === 'number') {
          localStorage.setItem('fontScale', fontScale.toString());
        }
      }
      if (highContrast !== undefined) {
        localStorage.setItem('highContrast', String(highContrast));
      }
      
      if (reducedMotion !== undefined) {
        if (typeof reducedMotion === 'boolean') {
          localStorage.setItem('reducedMotion', reducedMotion.toString());
        }
      }
      
      return settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the theme slice
const themeSlice = createSlice({
  name: 'theme',
  reducers: {
    // Toggle between light and dark mode, and handle system mode by switching to light/dark based on current system appearance
    toggleTheme: (state) => {
      // If in system mode, switch to light/dark
      if (state.mode === ThemeMode.SYSTEM) {
        state.mode = state.isDark ? ThemeMode.LIGHT : ThemeMode.DARK;
      } else {
        // Toggle between light and dark
        state.mode = state.mode === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT;
      }
      
      // Update isDark flag
      state.isDark = state.mode === ThemeMode.DARK;
      
      // Update theme object
      state.theme = state.isDark ? darkTheme : lightTheme;
    },
    
    // Set theme based on system changes
    setSystemAppearance: (state, action) => {
      const colorScheme = action.payload;
      
      // Only update if in system mode
      if (state.mode === ThemeMode.SYSTEM) {
        state.isDark = colorScheme === 'dark';
        state.theme = state.isDark ? darkTheme : lightTheme;
      }
    },
    
    // Reset theme settings to defaults
    resetThemeSettings: (state) => {
      state.mode = ThemeMode.SYSTEM;
      state.isDark = getSystemColorScheme() === 'dark';
      state.theme = state.isDark ? darkTheme : lightTheme;
      state.fontScale = 1.0;
      state.highContrast = false;
      state.reducedMotion = false;
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    addLoadThemeSettingsCases(builder);
    addSaveThemeModeCases(builder);
    addSaveAccessibilitySettingsCases(builder);
  }
});
// Add cases for loadThemeSettings
const addLoadThemeSettingsCases = (builder) => {
  builder
    .addCase(loadThemeSettings.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(loadThemeSettings.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.mode = action.payload.mode;
      state.isDark = action.payload.isDark;
      state.theme = action.payload.isDark ? darkTheme : lightTheme;
      state.fontScale = action.payload.fontScale;
      state.highContrast = action.payload.highContrast;
      state.reducedMotion = action.payload.reducedMotion;
    })
    .addCase(loadThemeSettings.rejected, (state) => {
      state.status = 'failed';
      // On error, we keep default settings: mode as SYSTEM, isDark as false, theme as lightTheme, fontScale as 1.0, highContrast as false, and reducedMotion as false
    });
};

// Add cases for saveThemeMode
const addSaveThemeModeCases = (builder) => {
  builder.addCase(saveThemeMode.fulfilled, (state, action) => {
    state.mode = action.payload.mode;
    state.isDark = action.payload.isDark;
    state.theme = action.payload.isDark ? darkTheme : lightTheme;
  });
};

// Add cases for saveAccessibilitySettings
const addSaveAccessibilitySettingsCases = (builder) => {
  builder.addCase(saveAccessibilitySettings.fulfilled, (state, action) => {
    const { fontScale, highContrast, reducedMotion } = action.payload;

    if (fontScale !== undefined) {
      state.fontScale = fontScale;
    }

    if (highContrast !== undefined) {
      state.highContrast = highContrast;
    }

    if (reducedMotion !== undefined) {
      state.reducedMotion = reducedMotion;
    }
  });
};

// Export actions
export const selectThemeObject = (state) => state.theme.theme;
export const {
  toggleTheme,
  setSystemAppearance,
  resetThemeSettings
} = themeSlice.actions;

// Export selectors
export const selectThemeMode = (state) => state.theme.mode;
export const selectIsDarkMode = (state) => state.theme.isDark;
export const selectTheme = (state) => state.theme.theme;
export const selectFontScale = (state) => state.theme.fontScale;
export const selectHighContrast = (state) => state.theme.highContrast;
export const selectReducedMotion = (state) => state.theme.reducedMotion;

// Export reducer
export default themeSlice.reducer;
