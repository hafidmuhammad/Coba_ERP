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
import type { Appointment, AppointmentCategory } from "@/lib/types";
import { PlusCircle, Edit, Trash2, Clock, User, Tag } from "lucide-react";
import { cn } from "@/lib/utils";


const appointmentCategories: Record<AppointmentCategory, { label: string; colorClass: string }> = {
  meeting: { label: 'Meeting', colorClass: 'border-chart-1' },
  deadline: { label: 'Deadline', colorClass: 'border-chart-5' },
  work: { label: 'Work', colorClass: 'border-chart-4' },
  personal: { label: 'Personal', colorClass: 'border-chart-3' },
};

const appointmentSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  duration: z.coerce.number().positive("Duration must be a positive number."),
  assignedTo: z.string().optional(),
  category: z.enum(['meeting', 'deadline', 'work', 'personal']).default('meeting'),
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
      assignedTo: appointment?.assignedTo || undefined,
      category: appointment?.category || 'meeting',
    },
  });

  const onSubmit = (values: z.infer<typeof appointmentSchema>) => {
    const appointmentData = { ...values, date: selectedDate };
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
                                <SelectItem key={key} value={key}>{value.label}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
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
        </div>
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
  const { toast } = useToast();

  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const dailyAppointments = useMemo(() => {
    return appointments
      .filter((app) => isSameDay(app.date, selectedDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate]);
  
  const handleDelete = (id: string) => {
    if(window.confirm("Are you sure you want to delete this appointment?")) {
        deleteAppointment(id);
        toast({ title: "Success", description: "Appointment deleted." });
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
      <Card>
        <CardHeader>
            <CardTitle>Team Scheduler</CardTitle>
            <CardDescription>Manage appointments and events for your team.</CardDescription>
        </CardHeader>
        <CardContent className="p-2">
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

      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{format(selectedDate, "MMMM d, yyyy")}</CardTitle>
              <CardDescription>
                {dailyAppointments.length} event(s)
              </CardDescription>
            </div>
            <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" variant="outline"><PlusCircle className="h-4 w-4"/></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Event</DialogTitle>
                    </DialogHeader>
                    <AppointmentForm selectedDate={selectedDate} onFinished={() => setIsAddFormOpen(false)} />
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyAppointments.length > 0 ? (
              dailyAppointments.map((app) => {
                const categoryInfo = appointmentCategories[app.category];
                const assignedUserName = app.assignedTo ? employeeMap.get(app.assignedTo) : undefined;

                return (
                    <div key={app.id} className={cn("relative flex items-start gap-3 rounded-lg border p-3 border-l-4", categoryInfo.colorClass)}>
                        <div className="flex-1 space-y-1">
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(app.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                {app.startTime} ({app.duration} min)
                            </p>
                            
                            {app.description && <p className="text-sm text-muted-foreground">{app.description}</p>}
                            
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    {assignedUserName && (
                                        <>
                                            <Avatar className="h-6 w-6"><AvatarFallback>{getInitials(assignedUserName)}</AvatarFallback></Avatar>
                                            <span className="text-xs text-muted-foreground">{assignedUserName}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Tag className="h-3 w-3" />
                                    <span>{categoryInfo.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events scheduled for this day.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
