import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_PORTFOLIO_API_KEY;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

export interface DailyInsight {
  insight: string;
  timestamp: string;
  category: string;
  url: string | null;
  description: string | null;
  tickers: string;
  image_url: string | null;
}

export interface SecurityNews {
  date: string;
  headline: string;
  source: string;
  url: string;
  summary: string;
  image_url: string;
  api_source: string;
  language: string | null;
  author: string | null;
  has_paywall: boolean | null;
  category: string | null;
  relevance: number | null;
  sentiment: string | null;
  tickers: string;
}

export interface SecurityDetails {
  security_details: {
    ticker: string;
    series_type: string;
    volatility: number;
    sharpe_ratio: number;
    beta: number;
    listed_exchange: string;
    issue_type: string;
    price: number;
    revenue_per_share: number;
    earnings_per_share: number;
    dividend_per_share: number;
    trading_volume_10_day: number;
    trading_volume_30_day: number;
    put_call_ratio: number;
    enterprise_value: number;
    revenue: number;
    revenue_per_employee: number;
    profit_margin: number;
    debt_to_equity: number;
    growth_factor: number;
    inflation_factor: number;
    liquidity_factor: number;
    commodities_factor: number;
    credit_factor: number;
    interest_rates_factor: number;
    next_earnings_date_factor: number | null;
    next_dividend_date: string | null;
    ex_dividend_date: string | null;
    related_securities: string[];
    news: SecurityNews[];
    ai_sentiment: string | null;
    description: string;
    sector: string;
    industry: string;
    website: string;
    employees: number;
    market_cap: number;
    investing_method: string | null;
    diversified: boolean | null;
    expense_ratio: number | null;
    asset_class: string | null;
    sector_exposures: Record<string, number> | null;
    country_exposures: Record<string, number> | null;
    holding_exposures: Record<string, number> | null;
    more_info: string;
  };
}

export interface PortfolioInsight {
  insight: string;
  timestamp: string;
  category: string;
  url: string | null;
  description: string | null;
  tickers: string;
  image_url: string | null;
}

export interface PortfolioAssessment {
  assessment: string;
}

export interface PortfolioPerformance {
  returns: number;
  risk: number;
  sharpe_ratio: number;
}

export interface PortfolioScore {
  portfolio_score: number;
  score_remark: string;
  percentile_rank: number;
  risk_match_score: number | null;
  sharpe_ratio_score: number;
  downside_protection_score: number;
}

export interface SecurityHistory {
  date: string;
  val: number;
}

export interface SecurityPerformance {
  expected_return: number;
  volatility: number;
}

export interface ForecastData {
  date: string;
  val: number;
  high: number;
  low: number;
}

export interface MacroSeries {
  series_id: number;
  series_name: string;
  country: string;
}

export const portfolioAPI = {
  getDailyInsights: async (): Promise<{ insights: DailyInsight[] }> => {
    const response = await api.get(`/get_daily_insights?api_key=${API_KEY}`);
    return response.data;
  },

//   getPortfolioInsights: async (portfolio: Record<string, number>): Promise<{ insights: PortfolioInsight[] }> => {
//   const response = await api.get('/get_portfolio_insights', {
//     params: {
//       portfolio_dict: JSON.stringify(portfolio),
//       api_key: API_KEY,
//     },
//   });
//   return response.data;
// },

  getPortfolioAssessment: async (portfolio: Record<string, number>): Promise<PortfolioAssessment> => {
    const portfolioDict = JSON.stringify(portfolio);
    const response = await api.get(`/get_portfolio_assessment?portfolio_dict=${portfolioDict}&api_key=${API_KEY}`);
    return response.data;
  },

  getPortfolioPerformance: async (portfolio: Record<string, number>): Promise<PortfolioPerformance> => {
    const portfolioDict = JSON.stringify(portfolio);
    const response = await api.get(`/get_portfolio_performance_stats?portfolio_dict=${portfolioDict}&api_key=${API_KEY}`);
    return response.data;
  },

  getPortfolioScore: async (portfolio: Record<string, number>): Promise<PortfolioScore> => {
    const portfolioDict = JSON.stringify(portfolio);
    const response = await api.get(`/get_portfolio_score?portfolio_dict=${portfolioDict}&api_key=${API_KEY}`);
    return response.data;
  },

  getSecurityAnomalies: async (): Promise<Array<{ ticker?: string; description: string }>> => {
    const response = await api.get(`/security_anomalies?api_key=${API_KEY}`);
    return response.data;
  },

  getSecurityHistory: async (ticker: string): Promise<SecurityHistory[]> => {
    const response = await api.get(`/security_history?ticker=${ticker}&api_key=${API_KEY}`);
    return response.data;
  },

  getSecurityPerformance: async (ticker: string): Promise<SecurityPerformance> => {
    const response = await api.get(`/security_performance?ticker=${ticker}&api_key=${API_KEY}`);
    return response.data;
  },

  getSecurityDetails: async (ticker: string, includeNews = true): Promise<SecurityDetails> => {
    const response = await api.get(`/get_security_details?ticker=${ticker}&include_news_and_ai_sentiment=${includeNews}&api_key=${API_KEY}`);
    return response.data;
  },

  getMacroHistory: async (seriesId: string): Promise<SecurityHistory[]> => {
    const response = await api.get(`/history?series_id=${seriesId}&api_key=${API_KEY}`);
    return response.data;
  },

  getForecast: async (seriesId: string): Promise<ForecastData[]> => {
    const response = await api.get(`/forecast?series_id=${seriesId}&api_key=${API_KEY}`);
    return response.data;
  },

  getAllSeries: async (): Promise<MacroSeries[]> => {
    const response = await api.get(`/all_series?api_key=${API_KEY}`);
    return response.data;
  },
};