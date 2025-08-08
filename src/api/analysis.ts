import { AdvancedStats, LottoDraw, NumberFrequency } from '../types';

/**
 * A reliable date parser for "DD/MM/YYYY" format.
 * This prevents issues where JavaScript might misinterpret the format.
 * @param dateString A date string, e.g., "25/12/2024".
 * @returns A JavaScript Date object.
 */
const parseDate = (dateString: string): Date => {
  // Handle potential empty or invalid date strings gracefully
  if (!dateString || typeof dateString !== 'string' || dateString.split('/').length !== 3) {
    // Return a very old date so it sorts to the end
    return new Date(0);
  }
  const parts = dateString.split('/');
  // Note: months are 0-indexed in JS Dates (0=Jan, 11=Dec)
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
};



// Calculates the frequency of each number (B1-B6 and BB)
export const calculateFrequency = (draws: LottoDraw[]): NumberFrequency => {
  const frequency: NumberFrequency = {};
  draws.forEach(draw => {
    const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6, draw.BB];
    numbers.forEach(num => {
      if (num) {
        frequency[num] = (frequency[num] || 0) + 1;
      }
    });
  });
  return frequency;
};

// Gets the hottest (most frequent) and coldest (least frequent) numbers
export const getHotAndColdNumbers = (frequency: NumberFrequency, count: number) => {
  const sortedNumbers = Object.entries(frequency).sort((a, b) => b[1] - a[1]);

  const hot = sortedNumbers.slice(0, count).map(item => ({ num: parseInt(item[0]), freq: item[1] }));
  const cold = sortedNumbers.slice(-count).reverse().map(item => ({ num: parseInt(item[0]), freq: item[1] }));

  return { hot, cold };
};

// Analyzes the frequency of number pairs
/*
export const analyzePairs = (draws: LottoDraw[]): Record<string, number> => {
    const pairFrequency: Record<string, number> = {};

    draws.forEach(draw => {
        const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].sort((a, b) => a - b);
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                const pairKey = `${numbers[i]}-${numbers[j]}`;
                pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
            }
        }
    });

    return pairFrequency;
};
*/

// Generates a prediction based on weighted probability from frequency
export const generatePrediction = (frequency: NumberFrequency): number[] => {
  const weightedPool: number[] = [];
  for (const num in frequency) {
    const weight = frequency[num];
    for (let i = 0; i < weight; i++) {
      weightedPool.push(parseInt(num));
    }
  }

  const prediction = new Set<number>();
  while (prediction.size < 6) {
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    prediction.add(weightedPool[randomIndex]);
  }

  return Array.from(prediction).sort((a, b) => a - b);
};

// Add this interface to your src/types/index.ts or at the top of analysis.ts
export interface NumberDetails {
  num: number;
  frequency: number;
  lastSeen: string[];
}

/**
 * Analyzes the full history of each number, calculating total frequency
 * and finding the most recent dates it was drawn.
 * @param draws The array of all lotto draws.
 * @returns An array of objects, each containing details for a specific number.
 */
export const analyzeNumberDetails = (draws: LottoDraw[]): NumberDetails[] => {
  const numberData: { [key: number]: { frequency: number; dates: string[] } } = {};

  // First pass: Iterate through all draws to aggregate frequency and all draw dates for each number.
  draws.forEach(draw => {
    // Combine main and bonus balls for a full analysis
    const numbersInDraw = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6, draw.BB];

    numbersInDraw.forEach(num => {
      if (num) { // Ensure the number is not null or zero
        if (!numberData[num]) {
          // Initialize the entry if it's the first time we see this number
          numberData[num] = { frequency: 0, dates: [] };
        }
        numberData[num].frequency++;
        numberData[num].dates.push(draw.Date);
      }
    });
  });

  // Second pass: Process the aggregated data to finalize the details list.
  const detailedList: NumberDetails[] = Object.entries(numberData).map(([num, data]) => {
    // Sort dates descending (most recent first) and take the top 3.
    // This handles cases where dates might not be in order in the source CSV.
    const lastThreeDates = data.dates
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 3);

    return {
      num: parseInt(num),
      frequency: data.frequency,
      lastSeen: lastThreeDates,
    };
  });

  return detailedList;
};

/**
 * Gets the hottest (most frequent) and coldest (least frequent) numbers
 * from the detailed analysis list.
 * @param details The array of detailed number information from analyzeNumberDetails.
 * @param count The number of hot/cold numbers to return.
 * @returns An object containing arrays for hot and cold numbers.
 */
export const getHotAndColdDetailed = (details: NumberDetails[], count: number) => {
  // Sort by frequency to find the hottest numbers
  const sortedByFrequency = [...details].sort((a, b) => b.frequency - a.frequency);

  const hot = sortedByFrequency.slice(0, count);

  // For cold numbers, take from the end of the list and sort them by frequency ascending
  const cold = sortedByFrequency.slice(-count).sort((a, b) => a.frequency - b.frequency);

  return { hot, cold };
};

// Add this interface to your src/types/index.ts or at the top of analysis.ts
export interface PairDetails {
  pair: string;
  frequency: number;
  lastSeen: string[];
}

/**
 * Analyzes the full history of each number pair, calculating total frequency
 * and finding the most recent dates it was drawn.
 * @param draws The array of all lotto draws.
 * @returns An array of objects, each containing details for a specific pair.
 */
export const analyzePairDetails = (draws: LottoDraw[]): PairDetails[] => {
  const pairData: { [key: string]: { frequency: number; dates: string[] } } = {};

  // Iterate through all draws to aggregate frequency and dates for each pair.
  draws.forEach(draw => {
    // We only analyze pairs from the main numbers (B1-B6)
    const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].sort((a, b) => a - b);
    const drawDate = draw.Date;

    // Create all possible pairs from the sorted numbers in the draw
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const pairKey = `${numbers[i]}-${numbers[j]}`;

        // Initialize the entry if it's the first time we see this pair
        if (!pairData[pairKey]) {
          pairData[pairKey] = { frequency: 0, dates: [] };
        }

        pairData[pairKey].frequency++;
        pairData[pairKey].dates.push(drawDate);
      }
    }
  });

  // Process the aggregated data into a final list.
  const detailedList: PairDetails[] = Object.entries(pairData).map(([pair, data]) => {
    // Sort dates descending (most recent first) and take the top 3.
    const lastThreeDates = data.dates
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 3);

    return {
      pair: pair,
      frequency: data.frequency,
      lastSeen: lastThreeDates,
    };
  });

  // Sort the final list by frequency in descending order before returning.
  return detailedList.sort((a, b) => b.frequency - a.frequency);
};

export const calculateBonusBallFrequency = (draws: LottoDraw[]): NumberFrequency => {
  const frequency: NumberFrequency = {};
  draws.forEach(draw => {
    const bonusBall = draw.BB;
    if (bonusBall) {
      frequency[bonusBall] = (frequency[bonusBall] || 0) + 1;
    }
  });
  return frequency;
};

export const calculateAdvancedStats = (draws: LottoDraw[]): AdvancedStats => {
  const allNumbers = draws.flatMap(draw => [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6]);
  const sums = draws.map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);

  // Calculate mean, variance, standard deviation
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const variance = sums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sums.length;
  const stdDev = Math.sqrt(variance);

  // Calculate skewness and kurtosis
  const skewness = sums.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0) / sums.length;
  const kurtosis = sums.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0) / sums.length - 3;

  // Calculate median and quartiles
  const sortedSums = [...sums].sort((a, b) => a - b);
  const median = sortedSums[Math.floor(sortedSums.length / 2)];
  const q1 = sortedSums[Math.floor(sortedSums.length * 0.25)];
  const q3 = sortedSums[Math.floor(sortedSums.length * 0.75)];
  const iqr = q3 - q1;

  // Calculate coefficient of variation
  const cv = (stdDev / mean) * 100;

  return { mean, variance, stdDev, skewness, kurtosis, median, q1, q3, iqr, cv, min: Math.min(...sums), max: Math.max(...sums) };
}
