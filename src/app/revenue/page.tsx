"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppContext } from "@/contexts/app-context";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  amount: z.coerce
    .number({ required_error: "Amount is required." })
    .positive({ message: "Amount must be positive." }),
  customer: z.string().min(2, {
    message: "Customer name must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
});

export default function RevenuePage() {
  const { revenue, addRevenue } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addRevenue(values);
    toast({
      title: "Success",
      description: "Revenue record added successfully.",
    });
    form.reset({ amount: undefined, customer: '', description: '' });
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1200.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Client A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Web Design Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Add Record
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Revenue History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...revenue].reverse().map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{format(item.date, "PP")}</TableCell>
                  <TableCell>{item.customer}</TableCell>
                  <TableCell className="text-right">
                    {item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
