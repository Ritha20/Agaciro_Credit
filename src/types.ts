export type Language = "en" | "rw" | "sw";

export type CreditTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface ScoreFactor {
  id: string;
  name: string;
  nameRw: string;
  nameSw: string;
  value: number; // e.g., 85
  maxValue: number; // e.g., 100
  weight: number; // e.g., 0.25
  description: string;
  descriptionRw: string;
  descriptionSw: string;
}

export interface Endorsement {
  id: string;
  vouchName: string;
  role: string;
  cooperative: string;
  vouchedAt: string;
  status: "Active" | "Pending" | "Rejected";
}

export interface BlockchainRecord {
  blockIndex: number;
  hash: string;
  prevHash: string;
  action: string;
  scoreAfter: number;
  timestamp: string;
}

export interface LenderMatch {
  bankName: string;
  approvalProbability: number;
  interestRate: string;
  maxAmount: string;
  status: string;
  dynamicPitch: string;
}

export interface MacroNews {
  headline: string;
  timestamp: string;
  sentimentScore: number; // -1.0 to 1.0
  volatilityImpact: "Low" | "Medium" | "High";
  description: string;
}

export type PredictionModel = "LSTM Network" | "Random Forest Classifier" | "Kalman State-Space Filter" | "Hybrid Transformer Pipelines";

export interface BotConfig {
  pair: string;
  leverage: number; // e.g., 10 (1:10)
  stopLossPct: number; // e.g., 1%
  riskPerTradePct: number; // e.g., 2%
  predictionModel: PredictionModel;
  indicators: string[]; // e.g., ["RSI", "MACD", "EMA"]
}

export interface Trade {
  id: string;
  timestamp: string;
  type: "BUY" | "SELL";
  price: number;
  pctProfit: number;
  balance: number;
  reason: string;
}

export interface BacktestStats {
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  startBalance: number;
  endBalance: number;
  tradesCount: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}
