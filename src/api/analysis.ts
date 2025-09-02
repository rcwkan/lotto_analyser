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

type MarkovChain = Record<number, Record<number, number>>;

/**
 * Builds a Markov Chain transition matrix from the draw history.
 * It assumes the draws are sorted from most recent to oldest.
 * @param draws The array of all lotto draws.
 * @returns A Markov Chain transition matrix.
 */
export const buildMarkovChain = (draws: LottoDraw[]): MarkovChain => {
  const chain: MarkovChain = {};
  // We iterate backwards, from the oldest draw to the newest.
  for (let i = draws.length - 2; i >= 0; i--) {
    const currentDrawNumbers = [draws[i].B1, draws[i].B2, draws[i].B3, draws[i].B4, draws[i].B5, draws[i].B6];
    const previousDrawNumbers = [draws[i + 1].B1, draws[i + 1].B2, draws[i + 1].B3, draws[i + 1].B4, draws[i + 1].B5, draws[i + 1].B6];

    for (const prevNum of previousDrawNumbers) {
      if (!chain[prevNum]) {
        chain[prevNum] = {};
      }
      for (const currentNum of currentDrawNumbers) {
        // For each number in the previous draw, we count how many times
        // each number in the current draw appeared next.
        chain[prevNum][currentNum] = (chain[prevNum][currentNum] || 0) + 1;
      }
    }
  }
  return chain;
};

/**
 * Generates a prediction using the Markov Chain model.
 * @param chain The pre-built Markov Chain.
 * @param lastDraw The most recent draw to base the prediction on.
 * @returns An array of 6 predicted numbers.
 */
export const predictWithMarkovChain = (chain: MarkovChain, lastDraw: LottoDraw): number[] => {
  const lastDrawNumbers = [lastDraw.B1, lastDraw.B2, lastDraw.B3, lastDraw.B4, lastDraw.B5, lastDraw.B6];
  const weightedPool: number[] = [];

  // Create a weighted pool of potential next numbers based on the last draw.
  for (const num of lastDrawNumbers) {
    if (chain[num]) {
      for (const nextNum in chain[num]) {
        const weight = chain[num][nextNum];
        for (let i = 0; i < weight; i++) {
          weightedPool.push(parseInt(nextNum));
        }
      }
    }
  }

  // If the pool is too small (e.g., last draw numbers are new), fall back to a random selection.
  if (weightedPool.length < 6) {
    const prediction = new Set<number>();
    while (prediction.size < 6) {
      prediction.add(Math.floor(Math.random() * 59) + 1); // Assuming numbers are 1-59
    }
    return Array.from(prediction).sort((a, b) => a - b);
  }

  // Pick 6 unique numbers from the weighted pool.
  const prediction = new Set<number>();
  while (prediction.size < 6) {
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    prediction.add(weightedPool[randomIndex]);
  }

  return Array.from(prediction).sort((a, b) => a - b);
};

 
/**
 * Calculates the season for a given date.
 * 0: Winter, 1: Spring, 2: Summer, 3: Autumn
 * @param date The date object.
 * @returns A number representing the season.
 */
const getSeason = (date: Date): number => {
  const month = date.getMonth();
  if (month < 2 || month === 11) return 0; // Winter (Dec, Jan, Feb)
  if (month < 5) return 1; // Spring (Mar, Apr, May)
  if (month < 8) return 2; // Summer (Jun, Jul, Aug)
  return 3; // Autumn (Sep, Oct, Nov)
};

/**
 * Calculates the approximate moon phase for a given date.
 * The result is a value from 0 (New Moon) to 7 (Waning Crescent).
 * @param date The date object.
 * @returns A number representing the moon phase.
 */
const getMoonPhase = (date: Date): number => {
    const LUNAR_CYCLE = 29.530588853;
    const KNOWN_NEW_MOON = new Date(2000, 0, 6); // A known new moon date
    const daysSinceKnownNewMoon = (date.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
    const currentCycleDays = daysSinceKnownNewMoon % LUNAR_CYCLE;
    return Math.floor((currentCycleDays / LUNAR_CYCLE) * 8) % 8;
};

/**
 * Calculates the day of the year (1-366).
 * @param date The date object.
 * @returns The day of the year.
 */
const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
};

/**
 * Calculates a numerological "Life Path Number" from a date.
 * It repeatedly sums the digits of the day, month, and year until a single digit is left.
 * @param date The date object.
 * @returns A single-digit number (1-9).
 */
const getLifePathNumber = (date: Date): number => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const sumDigits = (num: number): number => {
        let sum = 0;
        String(num).split('').forEach(digit => {
            sum += parseInt(digit, 10);
        });
        return sum;
    };

    let total = sumDigits(day) + sumDigits(month) + sumDigits(year);
    
    while (total > 9 && total !== 11 && total !== 22) { // Master numbers 11 and 22 are exceptions in numerology, but we'll reduce them for simplicity here.
        total = sumDigits(total);
    }
    
    return total;
};

const getYear = (date: Date): number => {
  
    return date.getFullYear() - 2015;
};

// --- Main Prediction Logic ---

interface FeatureSet {
    season: number;
    moonPhase: number;
    dayOfWeek: number; // Sunday is 0, Saturday is 6
    dayOfYear: number;
    year: number;
    lifePathNumber: number;
}

/**
 * Generates a prediction based on historical performance during similar conditions.
 * @param draws The entire history of lotto draws.
 * @param targetFeatures The features to predict for.
 * @returns An array of 6 predicted numbers.
 */
export const predictWithFeatures = (draws: LottoDraw[], targetFeatures: FeatureSet): number[] => {
    const weightedPool: number[] = [];

    draws.forEach(draw => {
        const drawDate = parseDate(draw.Date);
        const numbersInDraw = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6, draw.BB];

        // Calculate features for the historical draw date
        const drawSeason = getSeason(drawDate);
        const drawMoonPhase = getMoonPhase(drawDate);
        const drawDayOfWeek = drawDate.getDay();
        const drawDayOfYear = getDayOfYear(drawDate);
        const drawLifePath = getLifePathNumber(drawDate);
        const drawYear = getYear(drawDate);

        let weight = 1; // Base weight for every number
        if (drawSeason === targetFeatures.season) weight += 2;
        if (drawMoonPhase === targetFeatures.moonPhase) weight += 2;
        if (drawDayOfWeek === targetFeatures.dayOfWeek) weight += 1; // Day of week is a strong factor
        if (drawLifePath === targetFeatures.lifePathNumber) weight += 1;
        if (drawYear === targetFeatures.year) weight += 2;
        
        // Add a smaller weight for being close to the day of the year
        if (Math.abs(drawDayOfYear - targetFeatures.dayOfYear) < 15) {
            weight += 1;
        }
        
        for (const num of numbersInDraw) {
            if(num) {
                for (let i = 0; i < weight; i++) {
                    weightedPool.push(num);
                }
            }
        }
    });

    // Fallback if the pool is empty
    if (weightedPool.length < 6) {
        const prediction = new Set<number>();
        while (prediction.size < 6) {
            prediction.add(Math.floor(Math.random() * 59) + 1); // Assuming numbers 1-59
        }
        return Array.from(prediction).sort((a, b) => a - b);
    }
    
    // Pick 6 unique numbers from the weighted pool
    const prediction = new Set<number>();
    while (prediction.size < 6) {
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        prediction.add(weightedPool[randomIndex]);
    }

    return Array.from(prediction).sort((a, b) => a - b);
};

// Export the helpers so the UI can use them
export const featureHelpers = {
    getSeason,
    getMoonPhase,
    parseDate,
    getDayOfYear,
    getLifePathNumber,
    getYear,
};

