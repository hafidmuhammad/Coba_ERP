"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfQuarter,
  endOfQuarter,
  addQuarters,
  subQuarters,
  getQuarter,
  isWithinInterval,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, AppointmentCategory, AppointmentStatus, Task, Employee } from "@/lib/types";
import { PlusCircle, Edit, Trash2, Clock, User, Tag, Calendar as CalendarIcon, Kanban, Flag, ChevronLeft, ChevronRight, Briefcase, UserCheck, CheckCircle, CircleDot, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const appointmentCategories: Record<AppointmentCategory, { label: string; colorClass: string, bgClass: string, icon: React.ElementType }> = {
  meeting: { label: 'Meeting', colorClass: 'border-chart-1', bgClass: 'bg-chart-1/20', icon: Users },
  deadline: { label: 'Deadline', colorClass: 'border-chart-5', bgClass: 'bg-chart-5/20', icon: Flag },
  work: { label: 'Work', colorClass: 'border-chart-4', bgClass: 'bg-chart-4/20', icon: Briefcase },
  personal: { label: 'Personal', colorClass: 'border-chart-3', bgClass: 'bg-chart-3/20', icon: UserCheck },
};

const appointmentStatuses: Record<AppointmentStatus, { label: string; colorClass: string, icon: React.ElementType }> = {
    planned: { label: 'Planned', colorClass: 'text-muted-foreground', icon: Clock },
    ongoing: { label: 'Ongoing', colorClass: 'text-blue-500', icon: CircleDot },
    completed: { label: 'Completed', colorClass: 'text-green-500', icon: CheckCircle },
    cancelled: { label: 'Cancelled', colorClass: 'text-red-500 line-through', icon: Trash2 },
};

const appointmentSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  dateRange: z.custom<DateRange>(val => val && typeof val === 'object' && 'from' in val && val.from instanceof Date, "Date range is required"),
  assignedTo: z.string().optional(),
  category: z.enum(['meeting', 'deadline', 'work', 'personal']).default('meeting'),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).default('planned'),
}).refine(data => {
    if (data.dateRange?.from && data.dateRange?.to) {
        return data.dateRange.to >= data.dateRange.from;
    }
    return true;
}, { message: "End date must be after start date.", path: ["dateRange"] });

type CalendarEvent = {
    id: string;
    startDate: Date;
    endDate: Date;
    title: string;
    description?: string;
    assignedTo?: string;
    type: 'appointment' | 'task';
    original: Appointment | Task;
}

function AppointmentForm({
  appointment,
  onFinished,
  initialDateRange,
}: {
  appointment?: Appointment;
  onFinished: () => void;
  initialDateRange?: DateRange;
}) {
  const { addAppointment, updateAppointment, employees } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment?.title || "",
      description: appointment?.description || "",
      dateRange: appointment ? { from: appointment.startDate, to: appointment.endDate } : initialDateRange,
      assignedTo: appointment?.assignedTo || "unassigned",
      category: appointment?.category || 'meeting',
      status: appointment?.status || 'planned',
    },
  });

  const onSubmit = (values: z.infer<typeof appointmentSchema>) => {
    const finalValues = { 
        ...values, 
        assignedTo: values.assignedTo === 'unassigned' ? undefined : values.assignedTo 
    };
    
    const appointmentData = { 
        ...finalValues, 
        startDate: values.dateRange!.from!,
        endDate: values.dateRange!.to || values.dateRange!.from!,
    };
    delete (appointmentData as any).dateRange;

    if (appointment) {
      updateAppointment({ ...appointment, ...appointmentData });
      toast({ title: "Success", description: "Appointment updated." });
    } else {
      addAppointment(appointmentData);
      toast({ title: "Success", description: "Appointment added." });
    }
    onFinished();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea placeholder="Add more details..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
         <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date Range</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={field.value}
                      onSelect={field.onChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {Object.entries(appointmentCategories).map(([key, value]) => 
                                <SelectItem key={key} value={key as AppointmentCategory}>{value.label}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {Object.entries(appointmentStatuses).map(([key, value]) => 
                                <SelectItem key={key} value={key as AppointmentStatus}>{value.label}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
        </div>
         <FormField control={form.control} name="assignedTo" render={({ field }) => (
            <FormItem><FormLabel>Assigned To</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue="unassigned">
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </FormItem>
        )} />
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EventPill({ event, onEdit }: { event: CalendarEvent, onEdit: (app: Appointment) => void; }) {
    if (event.type === 'appointment') {
        const app = event.original as Appointment;
        const categoryInfo = appointmentCategories[app.category];
        return (
            <DialogTrigger asChild>
                <button 
                  onClick={() => onEdit(app)}
                  className={cn(
                      "w-full text-left p-1.5 rounded-md text-xs mb-1 truncate",
                      categoryInfo.bgClass,
                      categoryInfo.colorClass.replace('border-', 'text-')
                  )}
                >
                    <span className="font-semibold">{app.title}</span>
                </button>
            </DialogTrigger>
        )
    }
    const task = event.original as Task;
    return (
        <div className="w-full text-left p-1.5 rounded-md text-xs mb-1 truncate bg-purple-500/20 text-purple-700 dark:text-purple-300">
            <Kanban className="inline-block h-3 w-3 mr-1"/>
            <span className="font-semibold">{task.title}</span>
        </div>
    )
}

function EventListItem({ event, onEdit, employeeMap }: { event: CalendarEvent, onEdit: (app: Appointment) => void; employeeMap: Map<string, Employee> }) {
  const assignedTo = event.assignedTo ? employeeMap.get(event.assignedTo) : null;
  const isAppointment = event.type === 'appointment';
  const item = event.original as (Appointment | Task);
  const categoryInfo = isAppointment ? appointmentCategories[(item as Appointment).category] : null;
  const statusInfo = isAppointment ? appointmentStatuses[(item as Appointment).status] : null;
  const Icon = categoryInfo?.icon || Kanban;
  
  const formatDateRange = (start: Date, end: Date) => {
    if (isSameDay(start, end)) return format(start, "MMM d, yyyy");
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  return (
    <Card className={cn(
        "mb-3",
        isAppointment && categoryInfo?.bgClass
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5", categoryInfo ? categoryInfo.colorClass.replace('border-', 'text-') : 'text-purple-500')} />
                <div>
                    <p className={cn("font-semibold", statusInfo?.label === 'Cancelled' && 'line-through')}>{event.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDateRange(event.startDate, event.endDate)}</p>
                </div>
            </div>
            {isAppointment && <Badge variant="outline" className={cn(statusInfo?.colorClass)}>{statusInfo?.label}</Badge>}
            {!isAppointment && <Badge variant="secondary">Task</Badge>}
        </div>
        <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
                {assignedTo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6"><AvatarFallback>{assignedTo.name.charAt(0)}</AvatarFallback></Avatar>
                        <span>{assignedTo.name}</span>
                    </div>
                )}
            </div>
            {isAppointment && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(event.original as Appointment)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}


export default function CalendarPage() {
  const { appointments, employees, tasks } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [initialDateForForm, setInitialDateForForm] = useState<DateRange | undefined>(undefined);
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const allEvents: CalendarEvent[] = useMemo(() => {
    const fromAppointments: CalendarEvent[] = appointments.map(app => ({
      id: app.id,
      startDate: app.startDate,
      endDate: app.endDate,
      title: app.title,
      description: app.description,
      assignedTo: app.assignedTo,
      type: 'appointment',
      original: app,
    }));

    const fromTasks: CalendarEvent[] = tasks
      .filter(task => task.endDate)
      .map(task => ({
        id: task.id,
        startDate: task.startDate || task.endDate!,
        endDate: task.endDate!,
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        type: 'task',
        original: task,
      }));

    return [...fromAppointments, ...fromTasks];
  }, [appointments, tasks]);
  
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
        if (event.type === 'appointment') {
            const app = event.original as Appointment;
            const categoryMatch = filters.category === 'all' || app.category === filters.category;
            const statusMatch = filters.status === 'all' || app.status === filters.status;
            return categoryMatch && statusMatch;
        }
        return true; // Tasks are always shown for now
    })
  }, [allEvents, filters]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach(event => {
        const daysInEvent = eachDayOfInterval({ start: startOfDay(event.startDate), end: endOfDay(event.endDate) });
        daysInEvent.forEach(day => {
            const key = format(day, "yyyy-MM-dd");
            const existing = grouped.get(key) || [];
            if (!existing.some(e => e.id === event.id)) {
                grouped.set(key, [...existing, event]);
            }
        });
    });
    return grouped;
  }, [filteredEvents]);
  
  const eventsForQuarter = useMemo(() => {
    const quarterStart = startOfQuarter(currentMonth);
    const quarterEnd = endOfQuarter(currentMonth);
    return filteredEvents
        .filter(event => isWithinInterval(event.startDate, { start: quarterStart, end: quarterEnd }) || isWithinInterval(event.endDate, { start: quarterStart, end: quarterEnd }))
        .sort((a,b) => a.startDate.getTime() - b.startDate.getTime());
  }, [filteredEvents, currentMonth]);


  const daysForGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);


  const handleFilterChange = (filterName: string, value: string) => {
      setFilters(prev => ({...prev, [filterName]: value}));
  }
  
  const handleOpenForm = (appointment?: Appointment, date?: Date) => {
    setEditingAppointment(appointment);
    setInitialDateForForm(date ? { from: date, to: date } : undefined);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAppointment(undefined);
    setInitialDateForForm(undefined);
  }

  const handleNav = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
        setCurrentMonth(current => direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1));
    } else {
        setCurrentMonth(current => direction === 'prev' ? subQuarters(current, 1) : addQuarters(current, 1));
    }
  };

  const weekdays = useMemo(() => {
      const firstDay = startOfWeek(new Date());
      return Array.from({length: 7}, (_, i) => format(new Date(firstDay.setDate(firstDay.getDate() + (i === 0 ? 0 : 1))), 'E'))
  }, []);
  
  const title = viewMode === 'month'
    ? format(currentMonth, "MMMM yyyy")
    : `Q${getQuarter(currentMonth)} ${format(currentMonth, "yyyy")}`;

  return (
    <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
        <Card className="h-[calc(100vh-8rem)] flex flex-col">
            <CardHeader className="flex-none">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleNav('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                        <CardTitle className="text-xl sm:text-2xl w-40 text-center">{title}</CardTitle>
                        <Button variant="outline" size="icon" onClick={() => handleNav('next')}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>Today</Button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'month' | 'quarter')} className="w-full sm:w-auto">
                           <TabsList className="grid w-full grid-cols-2">
                               <TabsTrigger value="month">Month</TabsTrigger>
                               <TabsTrigger value="quarter">Quarter</TabsTrigger>
                           </TabsList>
                        </Tabs>
                        <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Filter by category..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.entries(appointmentCategories).map(([key, {label}]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {Object.entries(appointmentStatuses).map(([key, {label}]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => handleOpenForm(undefined, new Date())} className="w-full sm:w-auto"><PlusCircle className="mr-0 sm:mr-2 h-4 w-4"/><span className="hidden sm:inline">Add Event</span></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 md:p-2 lg:p-4 overflow-hidden">
                {viewMode === 'month' && (
                    <>
                        <div className="grid grid-cols-7 border-b">
                            {weekdays.map(day => (
                                <div key={day} className="text-center font-semibold text-muted-foreground p-2 text-sm">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-auto">
                            {daysForGrid.map(day => {
                                const dayKey = format(day, "yyyy-MM-dd");
                                const eventsForDay = eventsByDate.get(dayKey)?.sort((a,b) => a.startDate.getTime() - b.startDate.getTime()) || [];
                                return (
                                    <div key={dayKey} className={cn("relative border-b border-r p-2 flex flex-col", { 'bg-muted/30': !isSameMonth(day, currentMonth) })}>
                                        <DialogTrigger asChild>
                                            <button
                                                onClick={() => handleOpenForm(undefined, day)}
                                                className={cn("h-8 w-8 flex items-center justify-center rounded-full text-sm self-end mb-1", 
                                                isToday(day) ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent"
                                            )}>
                                                {format(day, 'd')}
                                            </button>
                                        </DialogTrigger>
                                        <div className="flex-1 overflow-y-auto -mx-2 px-2">
                                            {eventsForDay.slice(0, 3).map(event => (
                                                <EventPill key={event.id} event={event} onEdit={(app) => handleOpenForm(app)} />
                                            ))}
                                            {eventsForDay.length > 3 && (
                                                <p className="text-xs text-muted-foreground text-center mt-1">+ {eventsForDay.length - 3} more</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
                {viewMode === 'quarter' && (
                    <ScrollArea className="h-full">
                        <div className="p-4">
                        {eventsForQuarter.length > 0 ? (
                           eventsForQuarter.map(event => (
                                <EventListItem 
                                    key={event.id} 
                                    event={event} 
                                    onEdit={(app) => handleOpenForm(app)}
                                    employeeMap={employeeMap} 
                                />
                           ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <CalendarIcon className="h-16 w-16 mb-4" />
                                <h3 className="text-xl font-semibold">No Events This Quarter</h3>
                                <p>There are no events scheduled for the selected quarter.</p>
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingAppointment ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                </DialogHeader>
                <AppointmentForm 
                    appointment={editingAppointment} 
                    onFinished={handleCloseForm} 
                    initialDateRange={initialDateForForm} 
                />
            </DialogContent>

        </Card>
    </Dialog>
  );
}
