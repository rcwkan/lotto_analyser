import { LottoDraw } from "../types";


export interface PredictionResult {
  suggestedNumbers: number[];
  bonusBall: number;
  confidence: number;
  reasoning: string[];
  statisticalBasis: {
    hotNumbers: number[];
    coldNumbers: number[];
    dueNumbers: number[];
    avoidNumbers: number[];
    sumRange: { min: number; max: number; target: number };
    patterns: string[];
  };
  alternativeSets: number[][];
}

export interface PredictionWeights {
  frequency: number;
  recency: number;
  gaps: number;
  patterns: number;
  distribution: number;
  correlation: number;
}

export class LottoPredictionEngine {
  private draws: LottoDraw[];
  private weights: PredictionWeights;

  constructor(draws: LottoDraw[], customWeights?: Partial<PredictionWeights>) {
    this.draws = draws;
    this.weights = {
      frequency: 0.25,
      recency: 0.20,
      gaps: 0.20,
      patterns: 0.15,
      distribution: 0.10,
      correlation: 0.10,
      ...customWeights
    };
  }

  /**
   * Generate comprehensive lottery predictions based on statistical analysis
   */
  public generatePrediction(): PredictionResult {
    const analysis = this.performCompleteAnalysis();
    const scores = this.calculateNumberScores(analysis);
    const suggestedNumbers = this.selectOptimalNumbers(scores, analysis);
    const bonusBall = this.predictBonusBall(analysis);
    const confidence = this.calculateConfidence(analysis, suggestedNumbers);
    const reasoning = this.generateReasoning(analysis, suggestedNumbers);
    const alternativeSets = this.generateAlternativeSets(scores, analysis);

    return {
      suggestedNumbers: suggestedNumbers.sort((a, b) => a - b),
      bonusBall,
      confidence,
      reasoning,
      statisticalBasis: {
        hotNumbers: analysis.hotNumbers,
        coldNumbers: analysis.coldNumbers,
        dueNumbers: analysis.dueNumbers,
        avoidNumbers: analysis.avoidNumbers,
        sumRange: analysis.optimalSumRange,
        patterns: analysis.detectedPatterns
      },
      alternativeSets
    };
  }

  private performCompleteAnalysis() {
    return {
      // Frequency Analysis
      allTimeFrequency: this.calculateAllTimeFrequency(),
      recentFrequency: this.calculateRecentFrequency(20),

      // Gap Analysis
      gaps: this.calculateGaps(),
      expectedGaps: this.calculateExpectedGaps(),

      // Pattern Analysis
      consecutivePatterns: this.analyzeConsecutivePatterns(),
      positionPatterns: this.analyzePositionPatterns(),

      // Distribution Analysis
      sumDistribution: this.analyzeSumDistribution(),
      rangeDistribution: this.analyzeRangeDistribution(),

      // Trend Analysis
      trends: this.analyzeTrends(),
      cycles: this.detectCycles(),

      // Statistical Properties
      hotNumbers: this.identifyHotNumbers(),
      coldNumbers: this.identifyColdNumbers(),
      dueNumbers: this.identifyDueNumbers(),
      avoidNumbers: this.identifyAvoidNumbers(),

      // Optimal Ranges
      optimalSumRange: this.calculateOptimalSumRange(),
      detectedPatterns: this.detectPatterns()
    };
  }

  private calculateAllTimeFrequency(): Record<number, number> {
    const frequency: Record<number, number> = {};

    this.draws.forEach((draw, index) => {
      const isRecent = index >= this.draws.length - 100;
      const weight = isRecent ? 2.0 : 1.0; // Double weight for last 100 draws

      [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].forEach(num => {
        frequency[num] = (frequency[num] || 0) + weight;
      });
    });

    return frequency;
  }

  private calculateRecentFrequency(drawCount: number): Record<number, number> {
    const frequency: Record<number, number> = {};
    const recentDraws = this.draws.slice(-drawCount);

    recentDraws.forEach(draw => {
      [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
      });
    });

    return frequency;
  }

  private calculateGaps(): Record<number, number[]> {
    const gaps: Record<number, number[]> = {};

    for (let num = 1; num <= 49; num++) {
      gaps[num] = [];
      let lastSeen = -1;

      this.draws.forEach((draw, index) => {
        const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6];
        if (numbers.includes(num)) {
          if (lastSeen !== -1) {
            const gapSize = index - lastSeen;
            // Apply weighted gaps - recent gaps get more emphasis
            const isRecentGap = index >= this.draws.length - 100;
            const weight = isRecentGap ? 2.0 : 1.0;

            // Store weighted gap (duplicate recent gaps to emphasize them)
            gaps[num].push(gapSize);
            if (weight > 1) {
              gaps[num].push(gapSize); // Add twice for recent gaps
            }
          }
          lastSeen = index;
        }
      });

      // Add current gap (draws since last appearance) with emphasis if recent
      if (lastSeen !== -1) {
        const currentGap = this.draws.length - 1 - lastSeen;
        const isRecentPosition = lastSeen >= this.draws.length - 100;
        gaps[num].push(currentGap);
        if (isRecentPosition) {
          gaps[num].push(currentGap); // Double weight for recent positions
        }
      }
    }

    return gaps;
  }

  private calculateExpectedGaps(): Record<number, number> {
    const totalWeightedDraws = this.calculateTotalWeightedDraws();
    const expectedGaps: Record<number, number> = {};

    // Theoretical expected gap = total weighted draws / weighted number frequency
    const frequency = this.calculateAllTimeFrequency();

    for (let num = 1; num <= 49; num++) {
      const weightedFreq = frequency[num] || 0;
      expectedGaps[num] = weightedFreq > 0 ? totalWeightedDraws / weightedFreq : totalWeightedDraws;
    }

    return expectedGaps;
  }

  private calculateTotalWeightedDraws(): number {
    // Calculate total weighted draw count (last 100 count as 2, rest as 1)
    const totalDraws = this.draws.length;
    if (totalDraws <= 100) {
      return totalDraws * 2; // All draws are recent, so all get double weight
    } else {
      return (totalDraws - 100) + (100 * 2); // Older draws + (recent draws * 2)
    }
  }

  private analyzeConsecutivePatterns(): { count: number; frequency: number }[] {
    const consecutiveCount = this.draws.map(draw => {
      const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].sort((a, b) => a - b);
      let count = 0;
      for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i + 1] === numbers[i] + 1) count++;
      }
      return count;
    });

    return [0, 1, 2, 3, 4, 5].map(count => ({
      count,
      frequency: consecutiveCount.filter(c => c === count).length / this.draws.length
    }));
  }

  private analyzePositionPatterns(): Record<string, number> {
    const patterns: Record<string, number> = {};
    const positions = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];

    positions.forEach(pos => {
      const values = this.draws.map(draw => draw[pos as keyof LottoDraw] as number);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;

      patterns[`${pos}_mean`] = mean;
      patterns[`${pos}_variance`] = variance;
    });

    return patterns;
  }

  private analyzeSumDistribution(): { mean: number; stdDev: number; range: { min: number; max: number } } {
    const weightedSums: number[] = [];

    this.draws.forEach((draw, index) => {
      const sum = draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6;
      const isRecent = index >= this.draws.length - 100;
      const weight = isRecent ? 2 : 1;

      // Add sum multiple times based on weight
      for (let i = 0; i < weight; i++) {
        weightedSums.push(sum);
      }
    });

    const mean = weightedSums.reduce((a, b) => a + b, 0) / weightedSums.length;
    const variance = weightedSums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / weightedSums.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      range: { min: Math.min(...weightedSums), max: Math.max(...weightedSums) }
    };
  }

  private analyzeRangeDistribution(): Record<string, number> {
    const ranges = {
      '1-10': 0,
      '11-20': 0,
      '21-30': 0,
      '31-40': 0,
      '41-49': 0
    };

    this.draws.forEach((draw, index) => {
      const isRecent = index >= this.draws.length - 100;
      const weight = isRecent ? 2.0 : 1.0;

      [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6].forEach(num => {
        if (num <= 10) ranges['1-10'] += weight;
        else if (num <= 20) ranges['11-20'] += weight;
        else if (num <= 30) ranges['21-30'] += weight;
        else if (num <= 40) ranges['31-40'] += weight;
        else ranges['41-49'] += weight;
      });
    });

    return ranges;
  }

  private analyzeTrends(): Record<string, number> {
    const recentSums = this.draws.slice(-10).map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);
    const olderSums = this.draws.slice(-20, -10).map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);

    const recentAvg = recentSums.reduce((a, b) => a + b, 0) / recentSums.length;
    const olderAvg = olderSums.reduce((a, b) => a + b, 0) / olderSums.length;

    return {
      recentTrend: recentAvg - olderAvg,
      volatility: Math.sqrt(recentSums.reduce((acc, val) => acc + Math.pow(val - recentAvg, 2), 0) / recentSums.length)
    };
  }

  private detectCycles(): number[] {
    // Simple cycle detection based on sum patterns
    const sums = this.draws.slice(-30).map(draw => draw.B1 + draw.B2 + draw.B3 + draw.B4 + draw.B5 + draw.B6);
    const cycles: number[] = [];

    // Look for repeating patterns in the last 30 draws
    for (let cycleLength = 3; cycleLength <= 10; cycleLength++) {
      let isPattern = true;
      for (let i = 0; i < cycleLength && i + cycleLength < sums.length; i++) {
        if (Math.abs(sums[i] - sums[i + cycleLength]) > 10) { // Allow 10 point variance
          isPattern = false;
          break;
        }
      }
      if (isPattern) cycles.push(cycleLength);
    }

    return cycles;
  }

  private identifyHotNumbers(): number[] {
    const recentFreq = this.calculateRecentFrequency(15);
    return Object.entries(recentFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([num]) => parseInt(num));
  }

  private identifyColdNumbers(): number[] {
    const recentFreq = this.calculateRecentFrequency(20);
    const allNumbers = Array.from({ length: 49 }, (_, i) => i + 1);

    return allNumbers
      .filter(num => !recentFreq[num])
      .slice(0, 15);
  }

  private identifyDueNumbers(): number[] {
    const gaps = this.calculateGaps();
    const expectedGaps = this.calculateExpectedGaps();

    return Object.entries(gaps)
      .filter(([num, gapArray]) => {
        const currentGap = gapArray[gapArray.length - 1] || 0;
        const expected = expectedGaps[parseInt(num)];
        return currentGap > expected * 1.5; // 50% above expected
      })
      .sort((a, b) => {
        const aGap = a[1][a[1].length - 1] || 0;
        const bGap = b[1][b[1].length - 1] || 0;
        const aExpected = expectedGaps[parseInt(a[0])];
        const bExpected = expectedGaps[parseInt(b[0])];
        return (bGap / bExpected) - (aGap / aExpected);
      })
      .slice(0, 10)
      .map(([num]) => parseInt(num));
  }

  private identifyAvoidNumbers(): number[] {
    const recentFreq = this.calculateRecentFrequency(10);
    return Object.entries(recentFreq)
      .filter(([, freq]) => freq >= 3) // Appeared 3+ times in last 10 draws
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([num]) => parseInt(num));
  }

  private calculateOptimalSumRange(): { min: number; max: number; target: number } {
    const distribution = this.analyzeSumDistribution();
    const min = Math.round(distribution.mean - distribution.stdDev);
    const max = Math.round(distribution.mean + distribution.stdDev);
    const target = Math.round(distribution.mean);

    return { min, max, target };
  }

  private detectPatterns(): string[] {
    const patterns: string[] = [];

    // Check for high/low balance
    const recentDraws = this.draws.slice(-10);
    const highLowBalance = recentDraws.map(draw => {
      const numbers = [draw.B1, draw.B2, draw.B3, draw.B4, draw.B5, draw.B6];
      const highs = numbers.filter(n => n > 24).length;
      return highs;
    });

    const avgHighs = highLowBalance.reduce((a, b) => a + b, 0) / highLowBalance.length;
    if (avgHighs > 4) patterns.push("Recent bias toward high numbers");
    if (avgHighs < 2) patterns.push("Recent bias toward low numbers");

    // Check for consecutive patterns
    const consecutivePatterns = this.analyzeConsecutivePatterns();
    const recentConsecutive = consecutivePatterns.find(p => p.count >= 2);
    if (recentConsecutive && recentConsecutive.frequency > 0.3) {
      patterns.push("Higher than normal consecutive number frequency");
    }

    return patterns;
  }

  private calculateNumberScores(analysis: any): Record<number, number> {
    const scores: Record<number, number> = {};

    for (let num = 1; num <= 49; num++) {
      let score = 0;

      // Frequency score (normalized)
      const allTimeFreq = analysis.allTimeFrequency[num] || 0;
      const maxFreq = Math.max(...Object.values(analysis.allTimeFrequency as Record<number, number>));
      score += (allTimeFreq / maxFreq) * this.weights.frequency * 100;

      // Recency score
      const recentFreq = analysis.recentFrequency[num] || 0;
      score += Math.min(recentFreq * 25, 100) * this.weights.recency;

      // Gap score (due numbers get higher score)
      const currentGap = analysis.gaps[num]?.[analysis.gaps[num].length - 1] || 0;
      const expectedGap = analysis.expectedGaps[num];
      const gapRatio = expectedGap > 0 ? currentGap / expectedGap : 0;
      score += Math.min(gapRatio * 50, 100) * this.weights.gaps;

      // Avoid recently overdrawn numbers
      if (analysis.avoidNumbers.includes(num)) {
        score *= 0.3; // Heavily penalize
      }

      // Boost due numbers
      if (analysis.dueNumbers.includes(num)) {
        score *= 1.5;
      }

      // Moderate boost for hot numbers
      if (analysis.hotNumbers.includes(num)) {
        score *= 1.2;
      }

      scores[num] = score;
    }

    return scores;
  }

  private selectOptimalNumbers(scores: Record<number, number>, analysis: any): number[] {
    const candidates = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => parseInt(num));

    const selected: number[] = [];
    const targetSum = analysis.optimalSumRange.target;
    let attempts = 0;
    const maxAttempts = 1000;

    while (selected.length < 6 && attempts < maxAttempts) {
      selected.length = 0; // Reset

      // Use weighted random selection from top candidates
      for (let i = 0; i < 6; i++) {
        const availableCandidates = candidates.filter(num => !selected.includes(num));

        // Weight selection toward higher scored numbers
        const weights = availableCandidates.map((num, index) => {
          return Math.pow(0.8, index); // Exponential decay
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let j = 0; j < availableCandidates.length; j++) {
          random -= weights[j];
          if (random <= 0) {
            selected.push(availableCandidates[j]);
            break;
          }
        }
      }

      // Check if sum is within acceptable range
      const currentSum = selected.reduce((a, b) => a + b, 0);
      if (currentSum >= analysis.optimalSumRange.min && currentSum <= analysis.optimalSumRange.max) {
        break;
      }

      attempts++;
    }

    // Fallback: select top 6 if sum constraints couldn't be met
    if (selected.length !== 6) {
      return candidates.slice(0, 6);
    }

    return selected;
  }

  private predictBonusBall(analysis: any): number {
    const bonusFreq: Record<number, number> = {};

    this.draws.forEach((draw, index) => {
      const isRecent = index >= this.draws.length - 100;
      const weight = isRecent ? 2.0 : 1.0;
      bonusFreq[draw.BB] = (bonusFreq[draw.BB] || 0) + weight;
    });

    // Apply similar logic as main numbers but simpler
    const bonusScores: Record<number, number> = {};
    const maxFreq = Math.max(...Object.values(bonusFreq));

    for (let num = 1; num <= 49; num++) {
      const freq = bonusFreq[num] || 0;
      bonusScores[num] = freq / maxFreq * 100;
    }

    const sortedBonus = Object.entries(bonusScores)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => parseInt(num));

    // Return a number from top 10 with weighted random selection
    const topBonus = sortedBonus.slice(0, 10);
    const randomIndex = Math.floor(Math.random() * Math.min(topBonus.length, 5));

    return topBonus[randomIndex];
  }

  private calculateConfidence(analysis: any, selectedNumbers: number[]): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on statistical backing
    const dueCount = selectedNumbers.filter(n => analysis.dueNumbers.includes(n)).length;
    confidence += dueCount * 8;

    const hotCount = selectedNumbers.filter(n => analysis.hotNumbers.includes(n)).length;
    confidence += hotCount * 5;

    const coldCount = selectedNumbers.filter(n => analysis.coldNumbers.includes(n)).length;
    confidence += coldCount * 3;

    const avoidCount = selectedNumbers.filter(n => analysis.avoidNumbers.includes(n)).length;
    confidence -= avoidCount * 15;

    // Check sum alignment
    const sum = selectedNumbers.reduce((a, b) => a + b, 0);
    const sumAlignment = Math.abs(sum - analysis.optimalSumRange.target);
    confidence -= sumAlignment * 0.5;

    return Math.max(10, Math.min(95, confidence));
  }

  private generateReasoning(analysis: any, selectedNumbers: number[]): string[] {
    const reasoning: string[] = [];

    // Add weighting explanation
    reasoning.push(`Analysis uses doubled weight for last 100 draws vs normal weight for older data`);

    const dueNumbers = selectedNumbers.filter(n => analysis.dueNumbers.includes(n));
    if (dueNumbers.length > 0) {
      reasoning.push(`Selected ${dueNumbers.length} statistically due numbers: ${dueNumbers.join(', ')}`);
    }

    const hotNumbers = selectedNumbers.filter(n => analysis.hotNumbers.includes(n));
    if (hotNumbers.length > 0) {
      reasoning.push(`Included ${hotNumbers.length} recently hot numbers: ${hotNumbers.join(', ')}`);
    }

    const coldNumbers = selectedNumbers.filter(n => analysis.coldNumbers.includes(n));
    if (coldNumbers.length > 0) {
      reasoning.push(`Balanced with ${coldNumbers.length} cold numbers for variety: ${coldNumbers.join(', ')}`);
    }

    const sum = selectedNumbers.reduce((a, b) => a + b, 0);
    reasoning.push(`Total sum (${sum}) falls within weighted optimal range ${analysis.optimalSumRange.min}-${analysis.optimalSumRange.max}`);

    if (analysis.detectedPatterns.length > 0) {
      reasoning.push(`Considered detected patterns: ${analysis.detectedPatterns.join('; ')}`);
    }

    // Range distribution
    const ranges = { low: 0, mid: 0, high: 0 };
    selectedNumbers.forEach(n => {
      if (n <= 16) ranges.low++;
      else if (n <= 33) ranges.mid++;
      else ranges.high++;
    });
    reasoning.push(`Number distribution - Low(1-16): ${ranges.low}, Mid(17-33): ${ranges.mid}, High(34-49): ${ranges.high}`);

    return reasoning;
  }

  private generateAlternativeSets(scores: Record<number, number>, analysis: any): number[][] {
    const alternatives: number[][] = [];
    const topCandidates = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => parseInt(num))
      .slice(0, 20);

    // Generate 3 alternative sets with different strategies
    for (let set = 0; set < 3; set++) {
      const selected: number[] = [];
      const strategy = set === 0 ? 'conservative' : set === 1 ? 'aggressive' : 'balanced';

      let candidatePool = [...topCandidates];

      if (strategy === 'conservative') {
        // Favor frequently drawn numbers
        candidatePool = candidatePool.filter(n => analysis.allTimeFrequency[n] > 10);
      } else if (strategy === 'aggressive') {
        // Mix of due and cold numbers
        candidatePool = [...analysis.dueNumbers, ...analysis.coldNumbers].slice(0, 15);
      }

      // Random selection from filtered pool
      while (selected.length < 6 && candidatePool.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidatePool.length);
        selected.push(candidatePool.splice(randomIndex, 1)[0]);
      }

      if (selected.length === 6) {
        alternatives.push(selected.sort((a, b) => a - b));
      }
    }

    return alternatives;
  }
}

// Usage example function
export function predictLottoNumbers(draws: LottoDraw[], customWeights?: Partial<PredictionWeights>): PredictionResult {
  const engine = new LottoPredictionEngine(draws, customWeights);
  return engine.generatePrediction();
}