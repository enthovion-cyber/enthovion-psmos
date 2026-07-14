export const defaultGasThresholds = {
  O2: { min: 19.5, max: 23.5, units: '%' },
  LEL_HOT_WORK: { min: 0, max: 0, units: '%' },
  LEL_CONFINED_SPACE: { min: null, max: 10, units: '%' },
  H2S: { min: null, max: 1, units: 'ppm' },
  CO: { min: null, max: 25, units: 'ppm' }
} as const;
