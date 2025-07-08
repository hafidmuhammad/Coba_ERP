
"use client";

import React, 'useMemo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import type { Task, Employee } from '@/lib/types';

interface KanbanAnalyticsProps {
    tasks: Task[];
    employees: Employee[];
}

const STATUS_COLORS = {
    'done': 'hsl(var(--chart-3))',
    'inreview': 'hsl(var(--chart-2))',
    'inprogress': 'hsl(var(--chart-4))',
    'todo': 'hsl(var(--muted))',
};

const PRIORITY_COLORS = {
    'urgent': 'hsl(var(--chart-5))',
    'high': 'hsl(var(--chart-4))',
    'medium': 'hsl(var(--chart-2))',
    'low': 'hsl(var(--chart-1))',
};

export function KanbanAnalytics({ tasks, employees }: KanbanAnalyticsProps) {
    const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

    // Data for Task Status Chart (Pie Chart)
    const statusData = useMemo(() => {
        const counts = { todo: 0, inprogress: 0, inreview: 0, done: 0 };
        tasks.forEach(task => {
            counts[task.columnId]++;
        });
        return [
            { name: 'To Do', value: counts.todo, fill: STATUS_COLORS.todo },
            { name: 'In Progress', value: counts.inprogress, fill: STATUS_COLORS.inprogress },
            { name: 'In Review', value: counts.inreview, fill: STATUS_COLORS.inreview },
            { name: 'Done', value: counts.done, fill: STATUS_COLORS.done },
        ].filter(d => d.value > 0);
    }, [tasks]);

    const statusChartConfig: ChartConfig = statusData.reduce((acc, cur) => {
        acc[cur.name] = { label: cur.name, color: cur.fill };
        return acc;
    }, {} as ChartConfig);


    // Data for Tasks per Assignee Chart (Bar Chart)
    const assigneeData = useMemo(() => {
        const counts: Record<string, number> = {};
        tasks.forEach(task => {
            if (task.assignedTo) {
                counts[task.assignedTo] = (counts[task.assignedTo] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([employeeId, taskCount]) => ({
            name: employeeMap.get(employeeId) || 'Unknown',
            tasks: taskCount,
        })).sort((a,b) => b.tasks - a.tasks);
    }, [tasks, employeeMap]);
    
    const assigneeChartConfig: ChartConfig = {
        tasks: {
            label: 'Tasks',
            color: 'hsl(var(--chart-1))',
        },
    };

    // Data for Priority Distribution (Pie Chart)
    const priorityData = useMemo(() => {
        const counts: { [key: string]: number } = { low: 0, medium: 0, high: 0, urgent: 0 };
        tasks.forEach(task => {
            if (task.priority) {
                counts[task.priority]++;
            }
        });
        return [
            { name: 'Urgent', value: counts.urgent, fill: PRIORITY_COLORS.urgent },
            { name: 'High', value: counts.high, fill: PRIORITY_COLORS.high },
            { name: 'Medium', value: counts.medium, fill: PRIORITY_COLORS.medium },
            { name: 'Low', value: counts.low, fill: PRIORITY_COLORS.low },
        ].filter(d => d.value > 0);
    }, [tasks]);

    const priorityChartConfig: ChartConfig = priorityData.reduce((acc, cur) => {
        acc[cur.name] = { label: cur.name, color: cur.fill };
        return acc;
    }, {} as ChartConfig);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Task Status</CardTitle>
                    <CardDescription>Distribution of tasks by completion status.</CardDescription>
                </CardHeader>
                <CardContent>
                    {statusData.length > 0 ? (
                        <ChartContainer config={statusChartConfig} className="min-h-[250px] w-full">
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return (
                                        <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fill="hsl(var(--foreground))" className="text-xs font-semibold">
                                            {value}
                                        </text>
                                    );
                                }}/>
                                 <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex h-[250px] items-center justify-center text-muted-foreground">No tasks to display.</div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Workload Distribution</CardTitle>
                    <CardDescription>Tasks assigned per team member.</CardDescription>
                </CardHeader>
                <CardContent>
                    {assigneeData.length > 0 ? (
                        <ChartContainer config={assigneeChartConfig} className="min-h-[250px] w-full">
                            <BarChart data={assigneeData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} interval={0} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="dot" />} />
                                <Bar dataKey="tasks" fill="var(--color-tasks)" radius={5} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex h-[250px] items-center justify-center text-muted-foreground">No assigned tasks.</div>
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-1 md:col-span-2">
                 <CardHeader>
                    <CardTitle>Priority Breakdown</CardTitle>
                    <CardDescription>How tasks are prioritized across the board.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                    {priorityData.length > 0 ? (
                        <ChartContainer config={priorityChartConfig} className="min-h-[250px] w-full aspect-square">
                           <PieChart>
                                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                                     {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                         <div className="flex h-[250px] items-center justify-center text-muted-foreground">No tasks with priorities.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
