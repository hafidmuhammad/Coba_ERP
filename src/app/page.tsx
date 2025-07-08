"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Package,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { format } from "date-fns";

export default function DashboardPage() {
  const { revenue, expenses, products, employees } = useAppContext();

  // --- Data for Stat Cards ---
  const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const productCount = products.length;
  const totalInventoryValue = products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const employeeCount = employees.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // --- Data for Charts ---
  const monthlyRevenue = revenue.reduce((acc, item) => {
    const month = format(item.date, "yyyy-MM");
    acc[month] = (acc[month] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyExpenses = expenses.reduce((acc, item) => {
    const month = format(item.date, "yyyy-MM");
    acc[month] = (acc[month] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const allMonths = [
    ...new Set([...Object.keys(monthlyRevenue), ...Object.keys(monthlyExpenses)]),
  ].sort();

  const profitChartData = allMonths.map((monthStr) => {
    const rev = monthlyRevenue[monthStr] || 0;
    const exp = monthlyExpenses[monthStr] || 0;
    return {
      month: format(new Date(`${monthStr}-02`), "MMM yy"),
      revenue: rev,
      expenses: exp,
      profit: rev - exp,
    };
  });

  const profitChartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-5))",
    },
    profit: {
      label: "Profit",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const salesChartData = allMonths.map((monthStr) => ({
    month: format(new Date(`${monthStr}-02`), 'MMM yy'),
    sales: monthlyRevenue[monthStr] || 0,
  }));

  const salesChartConfig = {
    sales: {
      label: 'Sales',
      color: 'hsl(var(--chart-3))',
    },
  } satisfies ChartConfig;


  // --- Data for Employee Chart ---
  const employeeCountByPosition = employees.reduce((acc, employee) => {
    acc[employee.position] = (acc[employee.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const employeeChartData = Object.entries(employeeCountByPosition).map(
    ([position, count]) => ({
      name: position,
      employees: count,
    })
  );

  const employeeChartConfig = {
    employees: {
      label: "Employees",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              All revenue records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              All expense records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profit)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue minus expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              {productCount} different products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeCount}</div>
            <p className="text-xs text-muted-foreground">
              Total employees
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profit Analysis</CardTitle>
            <CardDescription>Monthly revenue, expenses, and profit.</CardDescription>
          </CardHeader>
          <CardContent>
            {profitChartData.length > 1 ? (
              <ChartContainer config={profitChartConfig} className="min-h-[250px] w-full">
                <LineChart
                  accessibilityLayer
                  data={profitChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `$${Number(value) / 1000}k`
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={true}
                    content={<ChartTooltipContent
                        indicator="dot"
                        formatter={(value) => formatCurrency(value as number)}
                    />}
                  />
                  <Line
                    dataKey="revenue"
                    type="monotone"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="expenses"
                    type="monotone"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                    dot={false}
                  />
                   <Line
                    dataKey="profit"
                    type="monotone"
                    stroke="var(--color-profit)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    Not enough data to display chart.
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Distribution</CardTitle>
            <CardDescription>Number of employees by position.</CardDescription>
          </CardHeader>
          <CardContent>
            {employeeChartData.length > 0 ? (
            <ChartContainer config={employeeChartConfig} className="min-h-[250px] w-full">
              <BarChart accessibilityLayer data={employeeChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel indicator="dot"/>}
                />
                <Bar
                  dataKey="employees"
                  fill="var(--color-employees)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
             ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    No employee data to display.
                </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly sales performance.</CardDescription>
          </CardHeader>
          <CardContent>
            {salesChartData.length > 1 ? (
              <ChartContainer config={salesChartConfig} className="min-h-[250px] w-full">
                <BarChart accessibilityLayer data={salesChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `$${Number(value) / 1000}k`
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        formatter={(value) => formatCurrency(value as number)}
                        hideLabel 
                        indicator="dot"
                    />}
                  />
                  <Bar
                    dataKey="sales"
                    fill="var(--color-sales)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Not enough data to display chart.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
