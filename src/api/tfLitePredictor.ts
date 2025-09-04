import { loadTensorflowModel, TensorflowModel } from "react-native-fast-tflite";

interface ScalerParams {
    mean: number[];
    scale: number[];
}

interface TargetScalerParams {
    data_range: number[];
    data_min: number[];
}

interface PreprocessingParams {
    base_year: number;
    feature_scaler: ScalerParams;
    target_scaler: TargetScalerParams;
}

class SequenceLotteryPredictor {
    private model: TensorflowModel | null;
    private params: PreprocessingParams | null;

    constructor() {
        this.model = null;
        this.params = null;
    }

    async loadModel(): Promise<void> {


        const modelPath = require("../../assets/tflite/lotto_sequence_model.tflite");

        this.model = await loadTensorflowModel(modelPath);;
        this.params = require("../../assets/tflite/sequence_preprocessing_params.json");


    }

    private getMoonPhase(date: Date): number {
        const baseDate = new Date('2000-01-06');
        const daysSince = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const phase = Math.floor((daysSince % 29.53) / 7.38);
        return Math.min(phase, 3);
    }

    private getSeason(date: Date): number {
        const month = date.getMonth() + 1;
        if (month >= 3 && month <= 5) return 0; // Spring
        if (month >= 6 && month <= 8) return 1; // Summer  
        if (month >= 9 && month <= 11) return 2; // Fall
        return 3; // Winter
    }

    private preprocessFeatures(past10Results: number[][], predictionDate: string | Date): Float32Array {
        if (!this.params) {
            throw new Error('Model parameters not loaded. Call loadModel() first.');
        }

        // Flatten past 10 results (10 draws × 6 balls = 60 features)
        const pastResultsFlat: number[] = past10Results.flat();

        // Create date features
        const date = new Date(predictionDate);
        const year = date.getFullYear() - this.params.base_year;
        const season = this.getSeason(date);
        const weekDay = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert to 0=Monday
        const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const moonPhase = this.getMoonPhase(date);

        const dateFeatures: number[] = [year, season, weekDay, dayOfYear, moonPhase];

        // Combine all features
        const allFeatures: number[] = [...pastResultsFlat, ...dateFeatures];

        // Apply StandardScaler transformation
        const scaledFeatures: number[] = allFeatures.map((feature, i) =>
            (feature - this.params!.feature_scaler.mean[i]) / this.params!.feature_scaler.scale[i]
        );

        return new Float32Array(scaledFeatures);
    }

    private postprocessTargets(scaledPredictions: number[]): number[] {
        if (!this.params) {
            throw new Error('Model parameters not loaded. Call loadModel() first.');
        }

        // Inverse MinMaxScaler transformation
        const predictions: number[] = scaledPredictions.map((pred, i) =>
            pred * this.params!.target_scaler.data_range[i] + this.params!.target_scaler.data_min[i]
        );

        // Convert to valid lottery numbers
        let lotteryNumbers: number[] = predictions.map(x =>
            Math.max(1, Math.min(59, Math.round(x)))
        );

        // Remove duplicates and ensure 6 unique numbers
        lotteryNumbers = [...new Set(lotteryNumbers)];

        while (lotteryNumbers.length < 6) {
            const newNum = Math.floor(Math.random() * 59) + 1;
            if (!lotteryNumbers.includes(newNum)) {
                lotteryNumbers.push(newNum);
            }
        }

        return lotteryNumbers.slice(0, 6).sort((a, b) => a - b);
    }

    async predict(past10Results: number[][], predictionDate: string | Date): Promise<number[]> {
        if (!this.model) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        if (past10Results.length !== 10) {
            throw new Error('Exactly 10 past results required');
        }

        if (!past10Results.every(result => result.length >= 6)) {
            throw new Error('Each result must have at least 6 numbers');
        }

        const features = this.preprocessFeatures(past10Results, predictionDate);


        const prediction = this.model.runSync([features]);

        const pArray = prediction[0];
        const scaledPrediction: number[] = [];
        for (let i = 0; i< pArray.length; i++) {
            scaledPrediction.push(Number(pArray[i]));
        }
 
        const result = this.postprocessTargets(scaledPrediction);

        //features.dispose(); // Clean up tensor memory
        //prediction.dispose(); // Clean up prediction tensor memory

        return result;
    }
}

export default SequenceLotteryPredictor;

// Usage example function
export async function predictLottoNumbers(past10Results: number[][], predictionDate: Date): Promise<Number[]> {
    const engine = new SequenceLotteryPredictor();
    await engine.loadModel();

    const result: Number[] = await engine.predict(past10Results, predictionDate);

    return result;
}