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
  areIntervalsOverlapping,
  startOfDay,
  endOfDay,
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
import { useToast } from "@/hooks/use-toast";
import type { Appointment, AppointmentCategory, AppointmentStatus, Task } from "@/lib/types";
import { PlusCircle, Edit, Trash2, Clock, User, Tag, Calendar as CalendarIcon, Kanban, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const appointmentCategories: Record<AppointmentCategory, { label: string; colorClass: string, bgClass: string }> = {
  meeting: { label: 'Meeting', colorClass: 'border-chart-1', bgClass: 'bg-chart-1/20' },
  deadline: { label: 'Deadline', colorClass: 'border-chart-5', bgClass: 'bg-chart-5/20' },
  work: { label: 'Work', colorClass: 'border-chart-4', bgClass: 'bg-chart-4/20' },
  personal: { label: 'Personal', colorClass: 'border-chart-3', bgClass: 'bg-chart-3/20' },
};

const appointmentStatuses: Record<AppointmentStatus, { label: string; colorClass: string }> = {
    planned: { label: 'Planned', colorClass: 'bg-chart-2' },
    ongoing: { label: 'Ongoing', colorClass: 'bg-chart-4' },
    completed: { label: 'Completed', colorClass: 'bg-chart-3' },
    cancelled: { label: 'Cancelled', colorClass: 'bg-muted' },
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
    // Task
    const task = event.original as Task;
    return (
        <div className="w-full text-left p-1.5 rounded-md text-xs mb-1 truncate bg-primary/20 text-primary-foreground">
            <span className="font-semibold">{task.title}</span>
        </div>
    )
}

export default function CalendarPage() {
  const { appointments, deleteAppointment, employees, tasks, addAppointment, updateAppointment } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [initialDateForForm, setInitialDateForForm] = useState<DateRange | undefined>(undefined);
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const { toast } = useToast();

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
  
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    allEvents
        .filter(event => {
            if (event.type === 'appointment') {
                const app = event.original as Appointment;
                const categoryMatch = filters.category === 'all' || app.category === filters.category;
                const statusMatch = filters.status === 'all' || app.status === filters.status;
                return categoryMatch && statusMatch;
            }
            return true;
        })
        .forEach(event => {
            const daysInEvent = eachDayOfInterval({ start: startOfDay(event.startDate), end: endOfDay(event.endDate) });
            daysInEvent.forEach(day => {
                const key = format(day, "yyyy-MM-dd");
                const existing = grouped.get(key) || [];
                // Avoid duplicates
                if (!existing.some(e => e.id === event.id)) {
                    grouped.set(key, [...existing, event]);
                }
            });
    });
    return grouped;
  }, [allEvents, filters]);


  const daysForGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);


  const handleFilterChange = (filterName: string, value: string) => {
      setFilters(prev => ({...prev, [filterName]: value}));
  }
  
  const handleOpenForm = (appointment?: Appointment, date?: Date) => {
    if (appointment) {
        setEditingAppointment(appointment);
    } else {
        setEditingAppointment(undefined);
    }
    if (date) {
        setInitialDateForForm({ from: date, to: date });
    } else {
        setInitialDateForForm(undefined);
    }
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAppointment(undefined);
    setInitialDateForForm(undefined);
  }

  const weekdays = useMemo(() => {
      const firstDay = startOfWeek(new Date());
      return Array.from({length: 7}, (_, i) => format(new Date(firstDay.setDate(firstDay.getDate() + (i === 0 ? 0 : 1))), 'E'))
  }, []);

  return (
    <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
        <Card className="h-[calc(100vh-8rem)] flex flex-col">
            <CardHeader className="flex-none">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                    <CardTitle className="text-xl sm:text-2xl w-40 text-center">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>Today</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Filter by category..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {Object.entries(appointmentCategories).map(([key, {label}]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Filter by status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {Object.entries(appointmentStatuses).map(([key, {label}]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => handleOpenForm(undefined, new Date())}><PlusCircle className="mr-0 sm:mr-2 h-4 w-4"/><span className="hidden sm:inline">Add Event</span></Button>
                </div>
            </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 md:p-2 lg:p-4">
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
