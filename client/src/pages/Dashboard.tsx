import { useEffect, useState } from 'react';
import { AccountOverview } from '@/components/dashboard/AccountOverview';
import { AutoTradingToggle } from '@/components/dashboard/AutoTradingToggle';
import { CurrentPositions } from '@/components/dashboard/CurrentPositions';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { StrategyPerformance } from '@/components/dashboard/StrategyPerformance';
import { useToast } from '@/hooks/useToast';
import {
  getAccountOverview,
  getCurrentPositions,
  getRecentTrades,
  getAutoTradingStatus,
  getStrategyPerformance,
} from '@/api/alpaca';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [accountRes, positionsRes, tradesRes, statusRes, performanceRes] = await Promise.all([
        getAccountOverview(),
        getCurrentPositions(),
        getRecentTrades(),
        getAutoTradingStatus(),
        getStrategyPerformance(),
      ]);

      setAccountData(accountRes);
      setPositions((positionsRes as any).positions);
      setTrades((tradesRes as any).trades);
      setAutoTradingEnabled((statusRes as any).enabled);
      setPerformance(performanceRes);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Dashboard: Fetching initial data');
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('Dashboard: Auto-refreshing data');
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your trading account and performance</p>
      </div>

      <AccountOverview data={accountData} />

      <AutoTradingToggle
        initialEnabled={autoTradingEnabled}
        onToggle={(enabled) => setAutoTradingEnabled(enabled)}
      />

      <CurrentPositions positions={positions} onPositionClosed={fetchData} />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentTrades trades={trades} />
        <div className="space-y-6">
          <StrategyPerformance data={performance} />
        </div>
      </div>
    </div>
  );
}