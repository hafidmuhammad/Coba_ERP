"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, AppointmentCategory, AppointmentStatus } from "@/lib/types";
import { PlusCircle, Edit, Trash2, Clock, User, Tag } from "lucide-react";
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
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  duration: z.coerce.number().positive("Duration must be a positive number."),
  assignedTo: z.string().optional(),
  category: z.enum(['meeting', 'deadline', 'work', 'personal']).default('meeting'),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).default('planned'),
});

function AppointmentForm({
  appointment,
  selectedDate,
  onFinished,
}: {
  appointment?: Appointment;
  selectedDate: Date;
  onFinished: () => void;
}) {
  const { addAppointment, updateAppointment, employees } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment?.title || "",
      description: appointment?.description || "",
      startTime: appointment?.startTime || "",
      duration: appointment?.duration || 60,
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
    const appointmentData = { ...finalValues, date: selectedDate };
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
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="startTime" render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl><Input type="time" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="duration" render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (min)</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
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
                <Select onValueChange={field.onChange} value={field.value}>
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
  const { appointments, deleteAppointment, employees } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const { toast } = useToast();

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const dailyAppointments = useMemo(() => {
    return appointments
      .filter((app) => isSameDay(app.date, selectedDate))
      .filter(app => filters.category === 'all' || app.category === filters.category)
      .filter(app => filters.status === 'all' || app.status === filters.status)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate, filters]);
  
  const handleDelete = (id: string) => {
    if(window.confirm("Are you sure you want to delete this appointment?")) {
        deleteAppointment(id);
        toast({ title: "Success", description: "Appointment deleted." });
    }
  }

  const handleFilterChange = (filterName: string, value: string) => {
      setFilters(prev => ({...prev, [filterName]: value}));
  }

  return (
    <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>{format(selectedDate, "MMMM d, yyyy")}</CardTitle>
              <CardDescription>
                {dailyAppointments.length} event(s) scheduled
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
                        <AppointmentForm selectedDate={selectedDate} onFinished={() => setIsAddFormOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pr-2">
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-4">
            {dailyAppointments.length > 0 ? (
              dailyAppointments.map((app) => {
                const categoryInfo = appointmentCategories[app.category];
                const statusInfo = appointmentStatuses[app.status];
                const assignedUserName = app.assignedTo ? employeeMap.get(app.assignedTo) : undefined;

                return (
                    <div key={app.id} className={cn("relative flex items-start gap-4 rounded-lg border p-4 border-l-4 transition-all hover:shadow-md", categoryInfo.colorClass)}>
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
                                        <AppointmentForm appointment={app} selectedDate={selectedDate} onFinished={() => setEditingAppointment(undefined)} />
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(app.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </div>
                             <p className="text-sm text-muted-foreground flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                {app.startTime} ({app.duration} min)
                            </p>
                            
                            {app.description && <p className="text-sm text-muted-foreground">{app.description}</p>}
                            
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    {assignedUserName ? (
                                        <>
                                            <Avatar className="h-6 w-6"><AvatarFallback>{getInitials(assignedUserName)}</AvatarFallback></Avatar>
                                            <span className="text-xs text-muted-foreground">{assignedUserName}</span>
                                        </>
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
                modifiers={{ booked: appointments.map(a => a.date) }}
                modifiersStyles={{ booked: { border: '2px solid hsl(var(--primary))', borderRadius: 'var(--radius)' } }}
            />
        </CardContent>
      </Card>
      </div>

    </div>
  );
}
