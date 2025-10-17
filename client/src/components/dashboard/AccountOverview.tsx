import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Wallet, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface AccountOverviewProps {
  data?: {
    portfolioValue: number;
    todayPL: number;
    todayPLPercent: number;
    monthlyPL: number;
    monthlyPLPercent: number;
    cashAvailable: number;
  } | null;
}

export function AccountOverview({ data }: AccountOverviewProps) {
  // Provide default values when data is not available
  const portfolioValue = data?.portfolioValue ?? 0;
  const todayPL = data?.todayPL ?? 0;
  const todayPLPercent = data?.todayPLPercent ?? 0;
  const monthlyPL = data?.monthlyPL ?? 0;
  const monthlyPLPercent = data?.monthlyPLPercent ?? 0;
  const cashAvailable = data?.cashAvailable ?? 0;

  const monthlyTarget = 9;
  const targetProgress = (monthlyPLPercent / monthlyTarget) * 100;

  // Show message when account is not connected
  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Alpaca Account Not Connected</AlertTitle>
        <AlertDescription>
          Please connect your Alpaca account to view your portfolio data and start trading.
          <Link to="/settings">
            <Button variant="link" className="px-0 pl-1">
              Go to Settings
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${portfolioValue.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's P&L</CardTitle>
          {todayPL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(todayPL).toLocaleString()}
          </div>
          <p className={`text-xs ${todayPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {todayPL >= 0 ? '+' : ''}{todayPLPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly P&L</CardTitle>
          {monthlyPL >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${monthlyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(monthlyPL).toLocaleString()}
          </div>
          <p className={`text-xs ${monthlyPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {monthlyPL >= 0 ? '+' : ''}{monthlyPLPercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthlyPLPercent.toFixed(1)}%</div>
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
          <div className="text-2xl font-bold">${cashAvailable.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}