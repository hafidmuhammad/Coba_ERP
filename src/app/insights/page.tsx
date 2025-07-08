"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/contexts/app-context";
import { generateBusinessInsights, GenerateBusinessInsightsOutput } from "@/ai/flows/generate-business-insights";
import { Lightbulb, CheckCircle } from "lucide-react";

export default function InsightsPage() {
  const { revenue, expenses } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateBusinessInsightsOutput | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const revenueData = JSON.stringify(revenue, null, 2);
      const expenseData = JSON.stringify(expenses, null, 2);
      const insights = await generateBusinessInsights({ revenueData, expenseData });
      setResult(insights);
    } catch (error) {
      console.error("Failed to generate insights:", error);
      // Optionally, show an error toast
    } finally {
      setLoading(false);
    }
  };

  const hasData = revenue.length > 0 || expenses.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Insights</CardTitle>
          <CardDescription>
            Use AI to analyze your revenue and expense data for trends and recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={loading || !hasData}>
            {loading ? "Generating..." : "Generate Insights"}
          </Button>
          {!hasData && (
             <p className="text-sm text-muted-foreground mt-4">
                Please add some revenue or expense records to generate insights.
            </p>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </CardContent>
            </Card>
        </div>
      )}

      {result && (
        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in-50">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{result.insights}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{result.recommendations}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
