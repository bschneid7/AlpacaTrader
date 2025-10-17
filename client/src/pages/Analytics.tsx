import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { getPortfolioHistory, getMonthlyReturns, getPerformanceMetrics, getTradeHistory } from '@/api/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import type { PortfolioDataPoint, MonthlyReturn, PerformanceMetrics, TradeHistoryItem } from '@/types/analytics';

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1M');
  const [portfolioData, setPortfolioData] = useState<PortfolioDataPoint[]>([]);
  const [monthlyReturns, setMonthlyReturns] = useState<MonthlyReturn[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [portfolioRes, monthlyRes, metricsRes, historyRes] = await Promise.all([
        getPortfolioHistory(timeframe),
        getMonthlyReturns(),
        getPerformanceMetrics(),
        getTradeHistory(),
      ]);

      setPortfolioData((portfolioRes as { data: PortfolioDataPoint[] }).data);
      setMonthlyReturns((monthlyRes as { data: MonthlyReturn[] }).data);
      setMetrics(metricsRes as PerformanceMetrics);
      setTradeHistory((historyRes as { trades: TradeHistoryItem[] }).trades);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [timeframe, toast]);

  useEffect(() => {
    console.log('Analytics: Fetching data');
    fetchData();
  }, [fetchData]);

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Symbol', 'Entry Price', 'Exit Price', 'Quantity', 'Duration', 'P&L ($)', 'P&L (%)'],
      ...tradeHistory.map((trade) => [
        trade.date,
        trade.symbol,
        trade.entryPrice,
        trade.exitPrice,
        trade.quantity,
        trade.duration,
        trade.pl,
        trade.plPercent,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade-history.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground">Detailed analysis of your trading performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${metrics?.totalReturn.toLocaleString()}</div>
            <p className="text-xs text-green-600">+{metrics?.totalReturnPercent.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.bestTrade.symbol}</div>
            <p className="text-xs text-green-600">+${metrics?.bestTrade.pl.toFixed(2)} ({metrics?.bestTrade.plPercent.toFixed(2)}%)</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Trade</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.worstTrade.symbol}</div>
            <p className="text-xs text-red-600">${metrics?.worstTrade.pl.toFixed(2)} ({metrics?.worstTrade.plPercent.toFixed(2)}%)</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.sharpeRatio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio Value Over Time</CardTitle>
              <CardDescription>Track your account growth</CardDescription>
            </div>
            <Tabs value={timeframe} onValueChange={setTimeframe}>
              <TabsList>
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="3M">3M</TabsTrigger>
                <TabsTrigger value="YTD">YTD</TabsTrigger>
                <TabsTrigger value="ALL">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Monthly Returns</CardTitle>
          <CardDescription>Performance by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="return"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Win</span>
              <span className="font-semibold text-green-600">+${metrics?.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Loss</span>
              <span className="font-semibold text-red-600">${metrics?.avgLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum Drawdown</span>
              <span className="font-semibold text-red-600">{metrics?.maxDrawdown.toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Complete record of all closed trades</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Exit</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tradeHistory.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell>{trade.date}</TableCell>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell className="text-right">${trade.entryPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${trade.exitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{trade.quantity}</TableCell>
                  <TableCell>{trade.duration}</TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${trade.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.pl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-semibold">${Math.abs(trade.pl).toFixed(2)}</span>
                      <span className="text-xs">({trade.plPercent >= 0 ? '+' : ''}{trade.plPercent.toFixed(2)}%)</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}