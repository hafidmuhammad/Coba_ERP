"use client";

import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/app-context';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

type KanbanColumn = {
  id: 'todo' | 'inprogress' | 'inreview' | 'done';
  title: string;
};

const columns: KanbanColumn[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'inreview', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
});

function TaskForm({ onFinished }: { onFinished: () => void }) {
  const { addTask } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    addTask({ ...values, columnId: 'todo' });
    toast({ title: "Success", description: "Task added." });
    onFinished();
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Draft Q4 report" />
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
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Add more details about the task..."/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Placeholder for image upload */}
        <FormItem>
            <FormLabel>Attachments (coming soon)</FormLabel>
            <FormControl>
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md">
                    <p className="text-sm text-muted-foreground">Image upload functionality will be added here.</p>
                </div>
            </FormControl>
        </FormItem>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancel</Button>
          </DialogClose>
          <Button type="submit">Add Task</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


function TaskCard({ task }: { task: Task }) {
  const { updateTask } = useAppContext();

  const handleMove = (newColumnId: Task['columnId']) => {
    updateTask({ ...task, columnId: newColumnId });
  };

  return (
    <Card className="mb-4 bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm leading-snug">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map(col => (
                task.columnId !== col.id && (
                  <DropdownMenuItem key={col.id} onClick={() => handleMove(col.id)}>
                    {col.title}
                  </DropdownMenuItem>
                )
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{task.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function KanbanPage() {
  const { tasks } = useAppContext(); 
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach(col => grouped[col.id] = []);
    tasks.forEach(task => {
        if(grouped[task.columnId]) {
            grouped[task.columnId].push(task);
        }
    });
    return grouped;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Task</DialogTitle>
                    </DialogHeader>
                    <TaskForm onFinished={() => setIsAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {columns.map(column => (
                <div key={column.id} className="bg-muted/50 rounded-lg h-full flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-semibold flex items-center justify-between">
                            <span>{column.title}</span>
                            <span className="text-sm font-normal bg-primary/10 text-primary rounded-full px-2 py-0.5">
                                {tasksByColumn[column.id]?.length || 0}
                            </span>
                        </h2>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        {tasksByColumn[column.id]?.length > 0 ? (
                          tasksByColumn[column.id].map(task => (
                              <TaskCard key={task.id} task={task} />
                          ))
                        ) : (
                          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                            No tasks yet.
                          </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
