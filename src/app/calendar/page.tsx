"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay, isWithinInterval, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import type { Appointment, AppointmentCategory, AppointmentStatus, Task } from "@/lib/types";
import { PlusCircle, Edit, Trash2, Clock, User, Tag, Calendar as CalendarIcon, Kanban, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const appointmentCategories: Record<AppointmentCategory, { label: string; colorClass: string }> = {
  meeting: { label: 'Meeting', colorClass: 'border-chart-1' },
  deadline: { label: 'Deadline', colorClass: 'border-chart-5' },
  work: { label: 'Work', colorClass: 'border-chart-4' },
  personal: { label: 'Personal', colorClass: 'border-chart-3' },
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
}: {
  appointment?: Appointment;
  onFinished: () => void;
}) {
  const { addAppointment, updateAppointment, employees } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment?.title || "",
      description: appointment?.description || "",
      dateRange: appointment ? { from: appointment.startDate, to: appointment.endDate } : undefined,
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
        startDate: values.dateRange!.from,
        endDate: values.dateRange!.to || values.dateRange!.from,
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
                    <Calendar
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


export default function CalendarPage() {
  const { appointments, deleteAppointment, employees, tasks } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const { toast } = useToast();

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

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
  
  const eventsForSelectedDay = useMemo(() => {
    return allEvents
      .filter((event) => isWithinInterval(selectedDate, { start: startOfDay(event.startDate), end: endOfDay(event.endDate) }))
      .filter(event => {
        if (event.type === 'appointment') {
            const app = event.original as Appointment;
            const categoryMatch = filters.category === 'all' || app.category === filters.category;
            const statusMatch = filters.status === 'all' || app.status === statusMatch;
            return categoryMatch && statusMatch;
        }
        return true; // Tasks are not filtered by these dropdowns for now
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [allEvents, selectedDate, filters]);
  
  const handleDelete = (id: string) => {
    if(window.confirm("Are you sure you want to delete this appointment?")) {
        deleteAppointment(id);
        toast({ title: "Success", description: "Appointment deleted." });
    }
  }

  const handleFilterChange = (filterName: string, value: string) => {
      setFilters(prev => ({...prev, [filterName]: value}));
  }
  
  const bookedDays = useMemo(() => {
    const dates: Date[] = [];
    allEvents.forEach(event => {
      dates.push(...eachDayOfInterval({ start: event.startDate, end: event.endDate }));
    });
    return dates;
  }, [allEvents]);

  const formatDateRange = (start: Date, end: Date) => {
      if (isSameDay(start, end)) {
          return format(start, "MMM d");
      }
      return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
  }

  return (
    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>{format(selectedDate, "MMMM d, yyyy")}</CardTitle>
              <CardDescription>
                {eventsForSelectedDay.length} event(s) scheduled
              </CardDescription>
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
                <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="outline"><PlusCircle className="h-4 w-4"/></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Event</DialogTitle>
                        </DialogHeader>
                        <AppointmentForm onFinished={() => setIsAddFormOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pr-2">
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-4">
            {eventsForSelectedDay.length > 0 ? (
              eventsForSelectedDay.map((event) => {
                const assignedUserName = event.assignedTo ? employeeMap.get(event.assignedTo) : undefined;
                
                if (event.type === 'appointment') {
                    const app = event.original as Appointment;
                    const categoryInfo = appointmentCategories[app.category];
                    const statusInfo = appointmentStatuses[app.status];

                    return (
                        <div key={app.id} className={cn("relative flex items-start gap-4 rounded-lg border p-4 border-l-4 transition-all hover:shadow-md", categoryInfo.colorClass)}>
                             <CalendarIcon className="h-5 w-5 mt-1 text-muted-foreground" />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold leading-snug">{app.title}</p>
                                    <div className="flex gap-1 absolute top-2 right-2">
                                        <Dialog open={editingAppointment?.id === app.id} onOpenChange={(isOpen) => !isOpen && setEditingAppointment(undefined)}>
                                            <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingAppointment(app)}><Edit className="h-4 w-4" /></Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Event</DialogTitle>
                                            </DialogHeader>
                                            <AppointmentForm appointment={app} onFinished={() => setEditingAppointment(undefined)} />
                                            </DialogContent>
                                        </Dialog>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(app.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                </div>
                                 <p className="text-sm text-muted-foreground flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                    {formatDateRange(app.startDate, app.endDate)}
                                </p>
                                
                                {app.description && <p className="text-sm text-muted-foreground">{app.description}</p>}
                                
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        {assignedUserName ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarFallback>{getInitials(assignedUserName)}</AvatarFallback></Avatar>
                                                <span className="text-xs text-muted-foreground">{assignedUserName}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarFallback><User className="h-4 w-4 text-muted-foreground" /></AvatarFallback></Avatar>
                                                <span className="text-xs text-muted-foreground">Unassigned</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="secondary" className="flex items-center gap-2">
                                            <Tag className="h-3 w-3" />
                                            <span>{categoryInfo.label}</span>
                                        </Badge>
                                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className={cn("h-2.5 w-2.5 rounded-full", statusInfo.colorClass)} />
                                            <span>{statusInfo.label}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                } else { // event.type === 'task'
                    const task = event.original as Task;
                    return (
                        <div key={task.id} className="relative flex items-start gap-4 rounded-lg border p-4 border-l-4 border-primary transition-all hover:shadow-md">
                            <Kanban className="h-5 w-5 mt-1 text-muted-foreground" />
                            <div className="flex-1 space-y-2">
                                <p className="font-semibold leading-snug">{task.title}</p>
                                <p className="text-sm text-muted-foreground flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                    {formatDateRange(event.startDate, event.endDate)}
                                </p>
                                {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                         {assignedUserName ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarFallback>{getInitials(assignedUserName)}</AvatarFallback></Avatar>
                                                <span className="text-xs text-muted-foreground">{assignedUserName}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarFallback><User className="h-4 w-4 text-muted-foreground" /></AvatarFallback></Avatar>
                                                <span className="text-xs text-muted-foreground">Unassigned</span>
                                            </div>
                                        )}
                                    </div>
                                    {task.priority && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Flag className="h-3 w-3"/>
                                            {task.priority}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No events scheduled for this day, or none match your filters.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="lg:col-span-1">
      <Card className="h-fit">
        <CardContent className="p-0">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="w-full"
                modifiers={{ booked: bookedDays }}
                modifiersStyles={{ booked: { border: '2px solid hsl(var(--primary))', borderRadius: 'var(--radius)' } }}
            />
        </CardContent>
      </Card>
      </div>

    </div>
  );
}
