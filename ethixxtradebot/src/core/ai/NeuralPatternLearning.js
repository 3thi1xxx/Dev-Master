#!/usr/bin/env node
/**
 * Neural Pattern Learning Engine
 * Uses TensorFlow.js to learn patterns from trading data
 * Predicts token success probability based on historical patterns
 */

import * as tf from '@tensorflow/tfjs-node';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

export class NeuralPatternLearning {
  constructor(options = {}) {
    this.config = {
      modelPath: options.modelPath || './models/token_predictor',
      batchSize: options.batchSize || 32,
      epochs: options.epochs || 100,
      learningRate: options.learningRate || 0.001,
      validationSplit: options.validationSplit || 0.2,
      featureSize: 20, // Number of input features
      hiddenLayers: [64, 32, 16], // Hidden layer sizes
      outputSize: 3, // DUD, MODERATE, WINNER
      minTrainingData: options.minTrainingData || 100
    };
    
    this.model = null;
    this.scaler = null;
    this.trainingData = [];
    this.isTraining = false;
    
    console.log('🧠 NEURAL PATTERN LEARNING ENGINE INITIALIZED');
    console.log('🤖 TensorFlow.js model for token success prediction');
    console.log(`📊 Architecture: ${this.config.featureSize} inputs → ${this.config.hiddenLayers.join('→')} → ${this.config.outputSize} outputs`);
  }
  
  /**
   * Initialize or load existing model
   */
  async initialize() {
    try {
      // Try to load existing model
      if (existsSync(this.config.modelPath + '/model.json')) {
        console.log('[NEURAL] 📖 Loading existing model...');
        this.model = await tf.loadLayersModel(`file://${this.config.modelPath}/model.json`);
        console.log('[NEURAL] ✅ Model loaded successfully');
        
        // Load scaler if it exists
        if (existsSync(this.config.modelPath + '/scaler.json')) {
          const scalerData = JSON.parse(readFileSync(this.config.modelPath + '/scaler.json', 'utf8'));
          this.scaler = scalerData;
          console.log('[NEURAL] 📊 Feature scaler loaded');
        }
      } else {
        console.log('[NEURAL] 🆕 Creating new model...');
        this.model = this.createModel();
        console.log('[NEURAL] ✅ New model created');
      }
      
      // Load training data if it exists
      if (existsSync('./training_data.json')) {
        const data = JSON.parse(readFileSync('./training_data.json', 'utf8'));
        this.trainingData = data;
        console.log(`[NEURAL] 📚 Loaded ${this.trainingData.length} training examples`);
      }
      
    } catch (error) {
      console.log(`[NEURAL] ⚠️ Initialization error: ${error.message}`);
      this.model = this.createModel();
    }
  }
  
  /**
   * Create neural network model
   */
  createModel() {
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      inputShape: [this.config.featureSize],
      units: this.config.hiddenLayers[0],
      activation: 'relu',
      name: 'input_layer'
    }));
    
    // Add dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.3 }));
    
    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: this.config.hiddenLayers[i],
        activation: 'relu',
        name: `hidden_layer_${i}`
      }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
    }
    
    // Output layer (softmax for classification: DUD, MODERATE, WINNER)
    model.add(tf.layers.dense({
      units: this.config.outputSize,
      activation: 'softmax',
      name: 'output_layer'
    }));
    
    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
  
  /**
   * Extract features from token data for neural network
   */
  extractFeatures(tokenData) {
    const features = [];
    
    try {
      // Price-based features (with safe defaults)
      features.push(Math.log(Math.max(tokenData.initialPrice || 0.001, 0.001))); // Log price
      features.push(tokenData.priceChange1h || 0); // 1h price change
      features.push(tokenData.priceChange6h || 0); // 6h price change
      features.push(tokenData.priceChange24h || 0); // 24h price change
      
      // Liquidity features
      features.push(Math.log(Math.max(tokenData.liquidity || 1000, 100))); // Log liquidity
      features.push(tokenData.liquidityChange || 0); // Liquidity change
      
      // Volume features
      features.push(Math.log(Math.max(tokenData.volume24h || 1000, 100))); // Log volume
      features.push(tokenData.volumeRatio || 1); // Volume vs liquidity ratio
      
      // Market cap features
      features.push(Math.log(Math.max(tokenData.marketCap || 10000, 1000))); // Log market cap
      features.push(tokenData.marketCapRank || 10000); // Market cap rank
      
      // Technical indicators (from AdvancedTechnicalAnalysis)
      features.push(tokenData.rsi || 50); // RSI
      features.push(tokenData.macd || 0); // MACD
      features.push(tokenData.bbPosition || 0.5); // Bollinger Band position
      features.push(tokenData.volumeSpike ? 1 : 0); // Volume spike binary
      
      // Social/Community features
      features.push(tokenData.hasTwitter ? 1 : 0); // Has Twitter
      features.push(tokenData.hasTelegram ? 1 : 0); // Has Telegram
      features.push(tokenData.hasWebsite ? 1 : 0); // Has Website
      features.push(tokenData.socialScore || 0); // Social media score
      
      // Time-based features
      features.push(tokenData.ageHours || 0); // Age in hours
      features.push(tokenData.launchHour || 12); // Hour of day launched
      
      // Ensure we have exactly the right number of features
      while (features.length < this.config.featureSize) {
        features.push(0);
      }
      
      return features.slice(0, this.config.featureSize);
      
    } catch (error) {
      console.log(`[NEURAL] ⚠️ Feature extraction error: ${error.message}`);
      // Return safe default features
      return new Array(this.config.featureSize).fill(0);
    }
  }
  
  /**
   * Classify token outcome for training
   */
  classifyOutcome(tokenData) {
    const priceMultiplier = tokenData.finalPrice / (tokenData.initialPrice || 0.001);
    
    // DUD: Lost more than 50% or less than 1.5x
    if (priceMultiplier < 1.5) return [1, 0, 0];
    
    // WINNER: More than 5x gain
    if (priceMultiplier > 5.0) return [0, 0, 1];
    
    // MODERATE: 1.5x to 5x gain
    return [0, 1, 0];
  }
  
  /**
   * Add training example
   */
  addTrainingExample(tokenData) {
    if (!tokenData.finalPrice || !tokenData.initialPrice) {
      console.log('[NEURAL] ⚠️ Skipping incomplete training example');
      return;
    }
    
    const features = this.extractFeatures(tokenData);
    const outcome = this.classifyOutcome(tokenData);
    
    this.trainingData.push({
      features: features,
      outcome: outcome,
      multiplier: tokenData.finalPrice / tokenData.initialPrice,
      symbol: tokenData.symbol,
      timestamp: Date.now()
    });
    
    console.log(`[NEURAL] 📚 Added training example: ${tokenData.symbol} (${(tokenData.finalPrice / tokenData.initialPrice).toFixed(2)}x)`);
    
    // Save training data
    this.saveTrainingData();
    
    // Auto-train if we have enough data
    if (this.trainingData.length >= this.config.minTrainingData && !this.isTraining) {
      this.scheduleTraining();
    }
  }
  
  /**
   * Schedule training to avoid blocking
   */
  scheduleTraining() {
    setTimeout(() => {
      this.trainModel();
    }, 5000); // Train after 5 seconds
  }
  
  /**
   * Train the neural network model
   */
  async trainModel() {
    if (this.isTraining || this.trainingData.length < this.config.minTrainingData) {
      return;
    }
    
    this.isTraining = true;
    console.log(`[NEURAL] 🚀 Starting training with ${this.trainingData.length} examples...`);
    
    try {
      // Prepare training data
      const { X, y } = this.prepareTrainingData();
      
      // Normalize features
      const normalizedX = this.normalizeFeatures(X);
      
      // Split into training and validation
      const splitIndex = Math.floor(X.shape[0] * (1 - this.config.validationSplit));
      
      const xTrain = normalizedX.slice([0, 0], [splitIndex, -1]);
      const yTrain = y.slice([0, 0], [splitIndex, -1]);
      const xVal = normalizedX.slice([splitIndex, 0], [-1, -1]);
      const yVal = y.slice([splitIndex, 0], [-1, -1]);
      
      console.log(`[NEURAL] 📊 Training set: ${xTrain.shape[0]} examples`);
      console.log(`[NEURAL] 📊 Validation set: ${xVal.shape[0]} examples`);
      
      // Train the model
      const history = await this.model.fit(xTrain, yTrain, {
        epochs: this.config.epochs,
        batchSize: this.config.batchSize,
        validationData: [xVal, yVal],
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`[NEURAL] Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, accuracy=${logs.acc.toFixed(4)}, val_accuracy=${logs.val_acc.toFixed(4)}`);
            }
          }
        }
      });
      
      // Get final metrics
      const finalLoss = history.history.loss[history.history.loss.length - 1];
      const finalAccuracy = history.history.acc[history.history.acc.length - 1];
      const finalValAccuracy = history.history.val_acc[history.history.val_acc.length - 1];
      
      console.log(`[NEURAL] ✅ Training complete!`);
      console.log(`[NEURAL] 📊 Final accuracy: ${(finalAccuracy * 100).toFixed(2)}%`);
      console.log(`[NEURAL] 📊 Validation accuracy: ${(finalValAccuracy * 100).toFixed(2)}%`);
      
      // Save the trained model
      await this.saveModel();
      
      // Clean up tensors
      X.dispose();
      y.dispose();
      normalizedX.dispose();
      xTrain.dispose();
      yTrain.dispose();
      xVal.dispose();
      yVal.dispose();
      
    } catch (error) {
      console.log(`[NEURAL] ❌ Training error: ${error.message}`);
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Prepare training data as tensors
   */
  prepareTrainingData() {
    const features = this.trainingData.map(d => d.features);
    const outcomes = this.trainingData.map(d => d.outcome);
    
    const X = tf.tensor2d(features);
    const y = tf.tensor2d(outcomes);
    
    return { X, y };
  }
  
  /**
   * Normalize features using min-max scaling
   */
  normalizeFeatures(X) {
    if (!this.scaler) {
      // Create scaler from training data
      const min = X.min(0);
      const max = X.max(0);
      const range = max.sub(min);
      
      this.scaler = {
        min: min.arraySync(),
        max: max.arraySync(),
        range: range.arraySync()
      };
      
      min.dispose();
      max.dispose();
      range.dispose();
    }
    
    // Apply normalization: (X - min) / (max - min)
    const minTensor = tf.tensor1d(this.scaler.min);
    const rangeTensor = tf.tensor1d(this.scaler.range);
    
    const normalized = X.sub(minTensor).div(rangeTensor.add(1e-8)); // Add small epsilon to avoid division by zero
    
    minTensor.dispose();
    rangeTensor.dispose();
    
    return normalized;
  }
  
  /**
   * Predict token outcome probability
   */
  async predictToken(tokenData) {
    if (!this.model) {
      return { error: 'Model not initialized' };
    }
    
    try {
      const features = this.extractFeatures(tokenData);
      const featureTensor = tf.tensor2d([features]);
      
      // Normalize features if scaler exists
      let normalizedFeatures = featureTensor;
      if (this.scaler) {
        const minTensor = tf.tensor1d(this.scaler.min);
        const rangeTensor = tf.tensor1d(this.scaler.range);
        normalizedFeatures = featureTensor.sub(minTensor).div(rangeTensor.add(1e-8));
        minTensor.dispose();
        rangeTensor.dispose();
      }
      
      // Make prediction
      const prediction = this.model.predict(normalizedFeatures);
      const probabilities = await prediction.data();
      
      // Clean up tensors
      featureTensor.dispose();
      normalizedFeatures.dispose();
      prediction.dispose();
      
      const result = {
        probabilities: {
          dud: probabilities[0],
          moderate: probabilities[1],
          winner: probabilities[2]
        },
        prediction: this.getPredictionLabel(probabilities),
        confidence: Math.max(...probabilities),
        features: features
      };
      
      console.log(`[NEURAL] 🔮 Prediction for ${tokenData.symbol}: ${result.prediction} (${(result.confidence * 100).toFixed(1)}%)`);
      
      return result;
    } catch (error) {
      console.log(`[NEURAL] ❌ Prediction error: ${error.message}`);
      return { error: error.message };
    }
  }
  
  /**
   * Get prediction label from probabilities
   */
  getPredictionLabel(probabilities) {
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const labels = ['DUD', 'MODERATE', 'WINNER'];
    return labels[maxIndex];
  }
  
  /**
   * Save the trained model
   */
  async saveModel() {
    try {
      await this.model.save(`file://${this.config.modelPath}`);
      
      // Save scaler separately
      if (this.scaler) {
        writeFileSync(`${this.config.modelPath}/scaler.json`, JSON.stringify(this.scaler, null, 2));
      }
      
      console.log(`[NEURAL] 💾 Model saved to ${this.config.modelPath}`);
    } catch (error) {
      console.log(`[NEURAL] ⚠️ Model save error: ${error.message}`);
    }
  }
  
  /**
   * Save training data
   */
  saveTrainingData() {
    try {
      writeFileSync('./training_data.json', JSON.stringify(this.trainingData, null, 2));
    } catch (error) {
      console.log(`[NEURAL] ⚠️ Training data save error: ${error.message}`);
    }
  }
  
  /**
   * Get model statistics
   */
  getModelStats() {
    return {
      trainingExamples: this.trainingData.length,
      isTraining: this.isTraining,
      modelLoaded: this.model !== null,
      scalerAvailable: this.scaler !== null,
      architecture: `${this.config.featureSize} → ${this.config.hiddenLayers.join(' → ')} → ${this.config.outputSize}`
    };
  }
  
  /**
   * Analyze feature importance (simplified)
   */
  analyzeFeatureImportance() {
    if (this.trainingData.length === 0) return {};
    
    // Calculate correlation between features and outcomes
    const featureImportance = {};
    const featureNames = [
      'log_price', 'price_1h', 'price_6h', 'price_24h',
      'log_liquidity', 'liquidity_change',
      'log_volume', 'volume_ratio',
      'log_marketcap', 'marketcap_rank',
      'rsi', 'macd', 'bb_position', 'volume_spike',
      'has_twitter', 'has_telegram', 'has_website', 'social_score',
      'age_hours', 'launch_hour'
    ];
    
    // Simplified importance calculation
    for (let i = 0; i < featureNames.length && i < this.config.featureSize; i++) {
      const feature = featureNames[i];
      const values = this.trainingData.map(d => d.features[i]);
      const multipliers = this.trainingData.map(d => d.multiplier);
      
      // Calculate correlation (simplified)
      const correlation = this.calculateCorrelation(values, multipliers);
      featureImportance[feature] = Math.abs(correlation);
    }
    
    return featureImportance;
  }
  
  /**
   * Simple correlation calculation
   */
  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}

export const neuralLearning = new NeuralPatternLearning(); 