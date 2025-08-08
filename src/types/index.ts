// Represents a single lottery draw
export interface LottoDraw {
  Date: string;
  B1: number;
  B2: number;
  B3: number;
  B4: number;
  B5: number;
  B6: number;
  BB: number;
}

// Represents the frequency of each number
export interface NumberFrequency {
  [key: number]: number;
}

export interface AdvancedStats {

  mean: number;
  variance: number; stdDev: number; skewness: number; kurtosis: number; median: number; q1: number; q3: number; iqr: number; cv: number; min: number; max: number;

}