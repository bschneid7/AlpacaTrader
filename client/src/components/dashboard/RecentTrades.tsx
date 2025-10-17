import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Trade {
  id: string;
  time: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  profitLoss?: number;
  status: string;
}

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>Last 20 executed trades</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {trades.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No trades yet. Start trading to see your history.
              </div>
            ) : (
              trades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={trade.side.toUpperCase() === 'BUY' ? 'default' : 'secondary'}>
                      {trade.side.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-semibold">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {trade.quantity} shares @ ${trade.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {trade.profitLoss !== undefined && trade.profitLoss !== 0 && (
                      <p className={`font-semibold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(trade.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}