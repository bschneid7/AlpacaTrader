import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AccountOverviewProps {
  data: {
    portfolioValue: number;
    todayPL: number;
    todayPLPercent: number;
    monthlyPL: number;
    monthlyPLPercent: number;
    cashAvailable: number;
  };
}

export function AccountOverview({ data }: AccountOverviewProps) {
  const monthlyTarget = 9;
  const targetProgress = (data.monthlyPLPercent / monthlyTarget) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${data.portfolioValue.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
          {data.todayPL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(data.todayPL).toLocaleString()}
          </div>
          <p className={`text-xs ${data.todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.todayPL >= 0 ? '+' : ''}{data.todayPLPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly P&L</CardTitle>
          {data.monthlyPL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.monthlyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(data.monthlyPL).toLocaleString()}
          </div>
          <p className={`text-xs ${data.monthlyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.monthlyPL >= 0 ? '+' : ''}{data.monthlyPLPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.monthlyPLPercent.toFixed(1)}%</div>
          <Progress value={targetProgress} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">Target: {monthlyTarget}%</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
          <Wallet className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${data.cashAvailable.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}