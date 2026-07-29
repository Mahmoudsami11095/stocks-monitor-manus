import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState<'1w' | '1m' | '3m' | '1y'>('1m');
  const { data: summary, isLoading, error } = trpc.stock.getDashboardSummary.useQuery();
  const { data: priceHistory } = trpc.stock.getPriceHistory.useQuery(selectedRange);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Unable to load dashboard</p>
              <p className="text-sm text-red-700">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPositive = summary.priceChange >= 0;
  const recommendationColor = {
    buy: 'bg-green-100 text-green-800 border-green-300',
    sell: 'bg-red-100 text-red-800 border-red-300',
    hold: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-slate-900">MPCI Stock Monitor</h1>
            <div className="text-sm text-slate-500">
              Last updated: {new Date(summary.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
          <p className="text-slate-600">Real-time technical analysis and trading signals</p>
        </div>

        {/* Price Card */}
        <Card className="mb-8 border-0 shadow-lg bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">MPCI Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">{summary.currentPrice.toFixed(2)}</span>
                  <span className="text-blue-100">EGP</span>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-3 py-2 rounded-lg ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                )}
                <span className={`font-semibold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                  {isPositive ? '+' : ''}{summary.priceChange.toFixed(2)} ({summary.priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Day Range</p>
                <p className="text-lg font-semibold text-slate-900">
                  {summary.dayLow.toFixed(2)} - {summary.dayHigh.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">52W Range</p>
                <p className="text-lg font-semibold text-slate-900">
                  {summary.weekLow52.toFixed(2)} - {summary.weekHigh52.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Market Cap</p>
                <p className="text-lg font-semibold text-slate-900">{summary.marketCap}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">P/E Ratio</p>
                <p className="text-lg font-semibold text-slate-900">{summary.peRatio.toFixed(2)}x</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">EPS</p>
                <p className="text-lg font-semibold text-slate-900">{summary.eps.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation & Fair Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Recommendation Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Trading Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border-2 ${recommendationColor[summary.recommendation]}`}>
                <div className="flex items-center gap-2 mb-2">
                  {summary.recommendation === 'buy' && <CheckCircle className="h-5 w-5" />}
                  {summary.recommendation === 'sell' && <AlertCircle className="h-5 w-5" />}
                  {summary.recommendation === 'hold' && <AlertCircle className="h-5 w-5" />}
                  <span className="font-bold text-lg uppercase">{summary.recommendation}</span>
                </div>
                <p className="text-sm opacity-90">Based on technical indicators and valuation metrics</p>
              </div>
            </CardContent>
          </Card>

          {/* Fair Value Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Fair Value Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Intrinsic Value</span>
                  <span className="font-bold text-slate-900">
                    {summary.fairValueMin?.toFixed(2)} - {summary.fairValueMax?.toFixed(2)} EGP
                  </span>
                </div>
                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" 
                    style={{
                      left: `${Math.max(0, Math.min(100, ((summary.currentPrice - (summary.fairValueMin || 0)) / ((summary.fairValueMax || 0) - (summary.fairValueMin || 0))) * 100))}%`,
                      width: '2px',
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{summary.fairValueMin?.toFixed(0)}</span>
                  <span className="font-semibold text-slate-700">Current: {summary.currentPrice.toFixed(2)}</span>
                  <span>{summary.fairValueMax?.toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Indicators */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Technical Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">MA20</p>
                <p className="text-lg font-semibold text-slate-900">{summary.ma20?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">MA50</p>
                <p className="text-lg font-semibold text-slate-900">{summary.ma50?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">RSI</p>
                <p className="text-lg font-semibold text-slate-900">{summary.rsi?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Support</p>
                <p className="text-lg font-semibold text-slate-900">{summary.support?.toFixed(2) || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Resistance</p>
                <p className="text-lg font-semibold text-slate-900">{summary.resistance?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry/Exit Prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-green-600">Entry Price</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{summary.entryPrice?.toFixed(2) || 'N/A'} EGP</p>
              <p className="text-sm text-slate-600 mt-2">Suggested entry point based on technical levels</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-red-600">Exit Price</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{summary.exitPrice?.toFixed(2) || 'N/A'} EGP</p>
              <p className="text-sm text-slate-600 mt-2">Suggested exit point for profit/loss management</p>
            </CardContent>
          </Card>
        </div>

        {/* Price Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Price History</CardTitle>
              <Tabs value={selectedRange} onValueChange={(v) => setSelectedRange(v as any)}>
                <TabsList className="grid w-fit grid-cols-4">
                  <TabsTrigger value="1w">1W</TabsTrigger>
                  <TabsTrigger value="1m">1M</TabsTrigger>
                  <TabsTrigger value="3m">3M</TabsTrigger>
                  <TabsTrigger value="1y">1Y</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {priceHistory?.data && priceHistory.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceHistory.data}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value: any) => value.toFixed(2)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <p>No price history data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
