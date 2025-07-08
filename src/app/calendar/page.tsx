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
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/lib/types";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

const appointmentSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  duration: z.coerce.number().positive("Duration must be a positive number."),
  participants: z.string().optional(),
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
  const { addAppointment, updateAppointment } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: appointment?.title || "",
      startTime: appointment?.startTime || "",
      duration: appointment?.duration || 60,
      participants: appointment?.participants || "",
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
        <FormField control={form.control} name="participants" render={({ field }) => (
          <FormItem>
            <FormLabel>Participants</FormLabel>
            <FormControl><Textarea placeholder="e.g., John Doe, Jane Smith" {...field} /></FormControl>
            <FormMessage />
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
  const { appointments, deleteAppointment } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const { toast } = useToast();

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
                {dailyAppointments.length} appointment(s)
              </CardDescription>
            </div>
            <Dialog open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" variant="outline"><PlusCircle className="h-4 w-4"/></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Appointment</DialogTitle>
                    </DialogHeader>
                    <AppointmentForm selectedDate={selectedDate} onFinished={() => setIsAddFormOpen(false)} />
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyAppointments.length > 0 ? (
              dailyAppointments.map((app) => (
                <div key={app.id} className="flex items-start gap-4 rounded-lg border p-3">
                    <div className="flex-1">
                        <p className="font-semibold">{app.title}</p>
                        <p className="text-sm text-muted-foreground">
                            {app.startTime} - {app.duration} min
                        </p>
                        {app.participants && <p className="text-xs text-muted-foreground mt-1">With: {app.participants}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Dialog open={editingAppointment?.id === app.id} onOpenChange={(isOpen) => !isOpen && setEditingAppointment(undefined)}>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingAppointment(app)}><Edit className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Appointment</DialogTitle>
                          </DialogHeader>
                           <AppointmentForm appointment={app} selectedDate={selectedDate} onFinished={() => setEditingAppointment(undefined)} />
                        </DialogContent>
                      </Dialog>
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(app.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No appointments for this day.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
