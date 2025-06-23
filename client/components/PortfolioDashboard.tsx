'use client';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Star,
  Plus,
  X,
  ExternalLink,
  Building,
  Globe,
  AlertTriangle,
  PieChart as PieChartIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DailyInsight,
  SecurityDetails,
  PortfolioPerformance,
  PortfolioScore,
  SecurityHistory,
  SecurityPerformance,
  portfolioAPI
} from '../app/api/portfolio-api';

interface Portfolio {
  [ticker: string]: number;
}
interface SecurityData {
  [ticker: string]: {
    details: SecurityDetails;
    history: SecurityHistory[];
    performance: SecurityPerformance;
  };
}
interface DataState {
  dailyInsights: DailyInsight[];
  performance: PortfolioPerformance | null;
  score: PortfolioScore | null;
  // assessment: PortfolioAssessment | null;
  securityData: SecurityData;
  anomalies: Array<{ ticker?: string; description: string }>;
  // macroSeries: MacroSeries[];
}
interface Allocation {
  name: string;
  value: number;
  percentage: number;
  amount: number;
}
const COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316'
];
const PortfolioDashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio>({});
  const [newTicker, setNewTicker] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [data, setData] = useState<DataState>({
    dailyInsights: [],
    performance: null,
    score: null,
    securityData: {},
    anomalies: [],
    // macroSeries: []
  });

  const addToPortfolio = () => {
    if (!newTicker.trim() || !newAmount || parseFloat(newAmount) <= 0) {
      toast.error('Please enter valid ticker and amount');
      return;
    }
    setPortfolio((prev) => ({
      ...prev,
      [newTicker.toUpperCase().trim()]: parseFloat(newAmount)
    }));
    setNewTicker('');
    setNewAmount('');
    toast.success(`Added ${newTicker.toUpperCase()} to portfolio`);
  };

  const removeFromPortfolio = (ticker: string) => {
    setPortfolio((prev) => {
      const updated = { ...prev };
      delete updated[ticker];
      return updated;
    });
    toast.success(`Removed ${ticker} from portfolio`);
  };

  const fetchPortfolioData = async () => {
    if (Object.keys(portfolio).length === 0) {
      // Clear portfolio-related data when empty
      setData((prev) => ({
        ...prev,
        performance: null,
        score: null,
        assessment: null,
        securityData: {}
      }));
      return;
    }
    setLoading(true);
    try {
      const [performance, score, assessment] = await Promise.all([
        portfolioAPI.getPortfolioPerformance(portfolio),
        portfolioAPI.getPortfolioScore(portfolio),
        portfolioAPI.getPortfolioAssessment(portfolio)
      ]);
      const securityData: SecurityData = {};
      for (const ticker of Object.keys(portfolio)) {
        try {
          const [details, history, perf] = await Promise.all([
            portfolioAPI.getSecurityDetails(ticker),
            portfolioAPI.getSecurityHistory(ticker),
            portfolioAPI.getSecurityPerformance(ticker)
          ]);
          securityData[ticker] = {
            details,
            history,
            performance: perf
          };
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          toast.error(`Failed to fetch data for ${ticker}`);
        }
      }
      setData((prev) => ({
        ...prev,
        performance,
        score,
        assessment,
        securityData
      }));
      toast.success('Portfolio data updated successfully');
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast.error('Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const [dailyInsights, anomalies, macroSeries] = await Promise.all([
        portfolioAPI.getDailyInsights(),
        portfolioAPI.getSecurityAnomalies(),
        portfolioAPI.getAllSeries()
      ]);
      setData((prev) => ({
        ...prev,
        dailyInsights: dailyInsights.insights,
        anomalies,
        macroSeries
      }));
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error('Failed to fetch market data');
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  // New: Analyze button handler
  const handleAnalyzeClick = async () => {
    if (Object.keys(portfolio).length === 0) {
      toast.error('Please add at least one security before analyzing');
      return;
    }
    await fetchPortfolioData();
  };

  const calculatePortfolioValue = (): number => {
    return Object.values(portfolio).reduce((total, amount) => total + amount, 0);
  };

  const getPortfolioAllocation = (): Allocation[] => {
    const totalValue = calculatePortfolioValue();
    return Object.entries(portfolio).map(([ticker, amount]) => ({
      name: ticker,
      value: amount,
      percentage: totalValue > 0 ? (amount / totalValue) * 100 : 0,
      amount
    }));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${formatNumber(value)}%`;
  };

  const getSentimentColor = (sentiment: string | null): string => {
    if (!sentiment) return 'bg-gray-500';
    const s = sentiment.toLowerCase();
    if (s.includes('positive') || s.includes('bullish')) return 'bg-green-500';
    if (s.includes('negative') || s.includes('bearish')) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getSentimentIcon = (sentiment: string | null) => {
    if (!sentiment) return <Activity className="w-4 h-4" />;
    const s = sentiment.toLowerCase();
    if (s.includes('positive') || s.includes('bullish'))
      return <TrendingUp className="w-4 h-4" />;
    if (s.includes('negative') || s.includes('bearish'))
      return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Image
              src="/valura.png"
              alt="Valura Logo"
              className="h-12 w-auto filter brightness-0"
            />
            <p className="text-slate-600 mt-1">
              Advanced Portfolio Analytics & Insights
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Portfolio Value</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(calculatePortfolioValue())}
            </p>
          </div>
        </div>
        {/* Portfolio Input */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Portfolio Builder
            </CardTitle>
            <CardDescription>
              Add securities to your portfolio with the amount invested
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4 flex-col md:flex-row">
              <div className="flex-1">
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., AAPL"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="amount">Amount Invested (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 1000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="mt-1"
                  min={0}
                  step="any"
                />
              </div>
              <div className="flex items-end flex-col md:flex-row gap-2">
                <Button
                  onClick={addToPortfolio}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Security
                </Button>
                <Button
                  onClick={handleAnalyzeClick}
                  disabled={loading || Object.keys(portfolio).length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Analyzing...' : 'Analyze Portfolio'}
                </Button>
              </div>
            </div>
            {Object.keys(portfolio).length > 0 && (
              <div className="space-y-2">
                <Label>Current Portfolio</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(portfolio).map(([ticker, amount]) => (
                    <Badge
                      key={ticker}
                      variant="secondary"
                      className="px-3 py-1 flex items-center"
                    >
                      {ticker}: {formatCurrency(amount)}
                      <button
                        aria-label={`Remove ${ticker} from portfolio`}
                        onClick={() => removeFromPortfolio(ticker)}
                        className="ml-2 hover:text-red-600 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        {Object.keys(portfolio).length > 0 && data.performance && data.score ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-200">
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-blue-200">
                Performance
              </TabsTrigger>
              <TabsTrigger value="holdings" className="data-[state=active]:bg-blue-200">
                Holdings
              </TabsTrigger>
              <TabsTrigger value="market" className="data-[state=active]:bg-blue-200">
                Market
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Portfolio Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Returns</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPercentage(data.performance.returns)}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Risk (Volatility)</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatNumber(data.performance.risk)}%
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Sharpe Ratio</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatNumber(data.performance.sharpe_ratio)}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Portfolio Score</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatNumber(data.score.portfolio_score)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {data.score.score_remark}
                        </p>
                      </div>
                      <Star className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Portfolio Allocation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Portfolio Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPortfolioAllocation()}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent! * 100).toFixed(0)}%`
                          }
                        >
                          {getPortfolioAllocation().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Value']}
                          labelFormatter={(label: string) => `${label}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Holdings Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getPortfolioAllocation().map((holding, index) => (
                        <div
                          key={holding.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium">{holding.name}</p>
                              <p className="text-sm text-slate-500">
                                {formatCurrency(holding.amount)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(holding.value)}</p>
                            <p className="text-sm text-slate-500">
                              {formatNumber(holding.percentage)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Portfolio Assessment */}
              {/* {data.assessment && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Portfolio Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 leading-relaxed">
                      {data.assessment.assessment}
                    </p>
                  </CardContent>
                </Card>
              )} */}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {data.score && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-slate-600">Overall Score</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {formatNumber(data.score.portfolio_score)}
                        </p>
                        <p className="text-sm text-slate-500">{data.score.score_remark}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-slate-600">Percentile Rank</p>
                        <p className="text-3xl font-bold text-green-600">
                          {formatNumber(data.score.percentile_rank)}
                        </p>
                        <p className="text-sm text-slate-500">vs Market</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-slate-600">Sharpe Score</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatNumber(data.score.sharpe_ratio_score)}
                        </p>
                        <p className="text-sm text-slate-500">Risk-Adjusted</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-slate-600">Downside Protection</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {formatNumber(data.score.downside_protection_score)}
                        </p>
                        <p className="text-sm text-slate-500">Protection Score</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(data.securityData).map(([ticker, secData]) =>
                  secData.history?.length ? (
                    <Card key={ticker} className="border-slate-200">
                      <CardHeader>
                        <CardTitle>{ticker} Price History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={secData.history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                              dataKey="date"
                              stroke="#64748b"
                              fontSize={12}
                              tickFormatter={(date: string) =>
                                new Date(date).toLocaleDateString()
                              }
                            />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                              formatter={(value: number) => [formatCurrency(value), 'Price']}
                              labelFormatter={(date: string) =>
                                new Date(date).toLocaleDateString()
                              }
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="val"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ) : null
                )}
              </div>
            </TabsContent>

            <TabsContent value="holdings" className="space-y-6">
              <div className="grid gap-6">
                {Object.entries(data.securityData).map(([ticker, secData]) =>
                  secData.details ? (
                    <Card key={ticker} className="border-slate-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {ticker}
                              {secData.details.security_details.ai_sentiment && (
                                <Badge
                                  className={`${getSentimentColor(
                                    secData.details.security_details.ai_sentiment
                                  )} text-white inline-flex items-center space-x-1 px-2 py-0.5 rounded`}
                                >
                                  {getSentimentIcon(
                                    secData.details.security_details.ai_sentiment
                                  )}
                                  <span>{secData.details.security_details.ai_sentiment}</span>
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {secData.details.security_details.sector} •{' '}
                              {secData.details.security_details.industry}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {formatCurrency(secData.details.security_details.price)}
                            </p>
                            <p className="text-sm text-slate-500">Current Price</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <p className="text-slate-700">
                          {secData.details.security_details.description}
                        </p>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-sm text-slate-600">Market Cap</p>
                            <p className="font-semibold">
                              {formatCurrency(secData.details.security_details.market_cap)}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-sm text-slate-600">Beta</p>
                            <p className="font-semibold">
                              {formatNumber(secData.details.security_details.beta)}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-sm text-slate-600">Volatility</p>
                            <p className="font-semibold">
                              {formatNumber(secData.details.security_details.volatility)}%
                            </p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-sm text-slate-600">Sharpe Ratio</p>
                            <p className="font-semibold">
                              {formatNumber(secData.details.security_details.sharpe_ratio)}
                            </p>
                          </div>
                        </div>
                        {/* Financial Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-600">Revenue</p>
                            <p className="font-semibold text-blue-900">
                              {formatCurrency(secData.details.security_details.revenue)}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-600">EPS</p>
                            <p className="font-semibold text-green-900">
                              {formatCurrency(secData.details.security_details.earnings_per_share)}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-sm text-purple-600">Profit Margin</p>
                            <p className="font-semibold text-purple-900">
                              {formatPercentage(secData.details.security_details.profit_margin)}
                            </p>
                          </div>
                        </div>
                        {/* Company Info */}
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {secData.details.security_details.employees?.toLocaleString() ?? 'N/A'} employees
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            {secData.details.security_details.listed_exchange}
                          </div>
                          {secData.details.security_details.website && (
                            <a
                              href={secData.details.security_details.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-blue-600"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Website
                            </a>
                          )}
                        </div>
                        {/* News */}
                        {secData.details.security_details.news &&
                          secData.details.security_details.news.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">Recent News</h4>
                              <div className="space-y-3">
                                {secData.details.security_details.news
                                  .slice(0, 3)
                                  .map((news, index) => (
                                    <div
                                      key={index}
                                      className="border-l-4 border-blue-500 pl-4"
                                    >
                                      <h5 className="font-medium">{news.headline}</h5>
                                      <p className="text-sm text-slate-600 mt-1">
                                        {news.summary}
                                      </p>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                                        <span>{news.source}</span>
                                        <span>
                                          {new Date(news.date).toLocaleDateString()}
                                        </span>
                                        {news.sentiment && (
                                          <Badge variant="outline" className="text-xs">
                                            {news.sentiment}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  ) : null
                )}
              </div>
            </TabsContent>

            <TabsContent value="market" className="space-y-6">
              {/* Daily Market Insights */}
              {data.dailyInsights.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Daily Market Insights</CardTitle>
                    <CardDescription>Latest market analysis and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.dailyInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-green-500 pl-4 py-2"
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline">{insight.category}</Badge>
                            <span className="text-sm text-slate-500">
                              {new Date(insight.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-medium">{insight.insight}</p>
                          {insight.description && (
                            <p className="text-sm text-slate-600 mt-1">
                              {insight.description}
                            </p>
                          )}
                          {insight.tickers && (
                            <p className="text-xs text-slate-500 mt-2">
                              Related: {insight.tickers}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Security Anomalies */}
              {data.anomalies.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Security Anomalies
                    </CardTitle>
                    <CardDescription>
                      Unusual market activity and patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.anomalies.map((anomaly, index) => (
                        <div
                          key={index}
                          className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-orange-900">
                                {anomaly.ticker || 'Market Anomaly'}
                              </p>
                              <p className="text-sm text-orange-700">
                                {anomaly.description}
                              </p>
                            </div>
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Macro Economic Series */}
              {/* {data.macroSeries.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle>Macro Economic Indicators</CardTitle>
                    <CardDescription>
                      Available economic data series for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.macroSeries.slice(0, 12).map((series, index) => (
                        <div
                          key={series.series_id}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">
                                {series.series_name}
                              </p>
                              <p className="text-sm text-slate-600">{series.country}</p>
                            </div>
                            <Badge variant="outline">{series.series_id}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )} */}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="text-center py-12">
              <PieChartIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Start Building Your Portfolio
              </h3>
              <p className="text-slate-600 mb-6">
                Add securities to your portfolio to access advanced analytics and insights
              </p>
              {/* Daily Market Insights for non-portfolio users */}
              {data.dailyInsights.length > 0 && (
                <div className="mt-8 max-w-2xl mx-auto text-left space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Today Market Insights
                  </h4>
                  {data.dailyInsights.slice(0, 3).map((insight, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline">{insight.category}</Badge>
                        <span className="text-sm text-slate-500">
                          {new Date(insight.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium">{insight.insight}</p>
                      {insight.description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {insight.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {loading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-slate-900">Loading portfolio data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioDashboard;