import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Trade {
  time: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  pl: number;
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
            {trades.map((trade, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={trade.action === 'BUY' ? 'default' : 'secondary'}>
                    {trade.action}
                  </Badge>
                  <div>
                    <p className="font-semibold">{trade.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {trade.quantity} shares @ ${trade.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {trade.pl !== 0 && (
                    <p className={`font-semibold ${trade.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trade.pl >= 0 ? '+' : ''}${trade.pl.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(trade.time), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}