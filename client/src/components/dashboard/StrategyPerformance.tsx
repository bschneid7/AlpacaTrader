import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Clock, AlertTriangle } from 'lucide-react';

interface StrategyPerformanceProps {
  data: {
    winRate: number;
    avgTradeDuration: string;
    riskExposure: number;
  };
}

export function StrategyPerformance({ data }: StrategyPerformanceProps) {
  const getRiskColor = (risk: number) => {
    if (risk < 50) return 'text-green-600';
    if (risk < 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Award className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.winRate.toFixed(1)}%</div>
          <Progress value={data.winRate} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">Percentage of profitable trades</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Trade Duration</CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.avgTradeDuration}</div>
          <p className="text-xs text-muted-foreground mt-1">Average holding period</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Exposure</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${getRiskColor(data.riskExposure)}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getRiskColor(data.riskExposure)}`}>
            {data.riskExposure}%
          </div>
          <Progress value={data.riskExposure} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-1">Current portfolio risk level</p>
        </CardContent>
      </Card>
    </div>
  );
}