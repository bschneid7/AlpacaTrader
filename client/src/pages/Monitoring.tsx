import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/useToast';
import { getWatchlist, getActiveOrders, cancelOrder, getActivityLog, getAlerts } from '@/api/monitoring';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { WatchlistStock, ActiveOrder, ActivityLogItem, Alert } from '@/types/monitoring';

export function Monitoring() {
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [watchlistRes, ordersRes, activityRes, alertsRes] = await Promise.all([
        getWatchlist(),
        getActiveOrders(),
        getActivityLog({ limit: 20 }),
        getAlerts({ limit: 10 }),
      ]);

      setWatchlist((watchlistRes as { watchlist: WatchlistStock[] }).watchlist || []);
      setOrders((ordersRes as { orders: ActiveOrder[] }).orders || []);
      setActivityLog((activityRes as { activities: ActivityLogItem[] }).activities || []);
      setAlerts((alertsRes as { alerts: Alert[] }).alerts || []);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch monitoring data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    console.log('Monitoring: Fetching initial data');
    fetchData();

    const interval = setInterval(() => {
      console.log('Monitoring: Auto-refreshing data');
      fetchData();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;

    setCancelling(true);
    try {
      await cancelOrder(selectedOrderId);
      toast({
        title: 'Order Cancelled',
        description: `Order ${selectedOrderId} has been cancelled successfully`,
      });
      fetchData();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel order',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
      setSelectedOrderId(null);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getActivityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'outline' } } = {
      monitoring: { label: 'Monitoring', variant: 'secondary' },
      buy_signal: { label: 'Buy Signal Detected', variant: 'default' },
      analyzing: { label: 'Analyzing', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
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
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Monitoring</h1>
          <p className="text-muted-foreground">Live market data and algorithm activity</p>
        </div>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-600 animate-pulse" />
                <div>
                  <p className="font-semibold text-green-600">Market Open</p>
                  <p className="text-sm text-muted-foreground">Live data streaming</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
              <CardDescription>Stocks being analyzed by the algorithm</CardDescription>
            </CardHeader>
            <CardContent>
              {watchlist.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stocks in watchlist
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead>Signal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchlist.map((stock) => (
                      <TableRow key={stock.symbol}>
                        <TableCell className="font-medium">{stock.symbol}</TableCell>
                        <TableCell className="text-right">${stock.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end gap-1 ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(stock.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>Pending orders waiting to be filled</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active orders
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">{order.symbol}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{order.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {order.limitPrice ? `$${order.limitPrice.toFixed(2)}` : 'Market'}
                        </TableCell>
                        <TableCell className="text-right">{order.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrderId(order.orderId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Algorithm Activity Log</CardTitle>
            <CardDescription>Real-time feed of trading algorithm actions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {activityLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logged yet
                </div>
              ) : (
                <div className="space-y-2">
                  {activityLog.map((activity, index) => (
                    <div
                      key={activity._id || index}
                      className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                    >
                      {getActivityIcon(activity.severity)}
                      <div className="flex-1">
                        <p className="text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Alert Center</CardTitle>
            <CardDescription>Important notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No alerts
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className={`flex items-start gap-3 rounded-lg border p-4 ${getAlertColor(alert.type)}`}
                  >
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} disabled={cancelling} className="bg-red-600 hover:bg-red-700">
              {cancelling ? 'Cancelling...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}