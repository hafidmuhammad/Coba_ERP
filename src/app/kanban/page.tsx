"use client";

import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/app-context';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Edit, Trash2, CalendarIcon, GripVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type KanbanColumnId = 'todo' | 'inprogress' | 'inreview' | 'done';

type KanbanColumn = {
  id: KanbanColumnId;
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
  assignedDate: z.date().optional(),
});

function TaskForm({ task, onFinished }: { task?: Task, onFinished: () => void }) {
  const { addTask, updateTask } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      assignedDate: task?.assignedDate ? new Date(task.assignedDate) : undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof taskSchema>) => {
    if (task) {
      updateTask({ ...task, ...values });
      toast({ title: "Success", description: "Task updated." });
    } else {
      addTask({ ...values, columnId: 'todo' });
      toast({ title: "Success", description: "Task added." });
    }
    onFinished();
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl><Input {...field} placeholder="e.g., Draft Q4 report" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl><Textarea {...field} placeholder="Add more details about the task..."/></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormItem>
            <FormLabel>Attachments (coming soon)</FormLabel>
            <FormControl>
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md">
                    <p className="text-sm text-muted-foreground">Image upload functionality will be added here.</p>
                </div>
            </FormControl>
        </FormItem>
        <FormField control={form.control} name="assignedDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Assigned Date (optional)</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover>
          </FormItem>
        )} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
          <Button type="submit">{task ? 'Save Task' : 'Add Task'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function TaskCard({ task, onEdit, onDelete, isOverlay }: { task: Task; onEdit?: (task: Task) => void; onDelete?: (id: string) => void; isOverlay?: boolean }) {
  return (
    <Card className={cn("mb-4 bg-card hover:shadow-lg transition-shadow", isOverlay && "shadow-2xl")}>
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold text-sm leading-snug">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <Edit className="mr-2 h-4 w-4" /><span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(task.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /><span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{task.description}</p>}
        {task.assignedDate &&
          <div className="flex items-center text-xs text-muted-foreground mt-3">
            <CalendarIcon className="h-3 w-3 mr-1.5" />
            <span>{format(new Date(task.assignedDate), "PPP")}</span>
          </div>
        }
      </CardContent>
    </Card>
  );
}

function SortableTaskItem({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: (id: string) => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
}

function KanbanColumn({ column, tasks, onEdit, onDelete }: { column: KanbanColumn, tasks: Task[], onEdit: (task: Task) => void; onDelete: (id: string) => void; }) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'column' } });
  
  return (
    <div className="bg-muted/50 rounded-lg flex flex-col max-h-full">
        <div className="p-4 border-b border-border sticky top-0 bg-muted/50 z-10">
            <h2 className="text-lg font-semibold flex items-center justify-between">
                <span>{column.title}</span>
                <span className="text-sm font-normal bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    {tasks.length}
                </span>
            </h2>
        </div>
        <SortableContext id={column.id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} className="p-4 flex-1 overflow-y-auto">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <SortableTaskItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                        No tasks yet.
                    </div>
                )}
            </div>
        </SortableContext>
    </div>
  );
}


export default function KanbanPage() {
  const { tasks, deleteTask, setAllTasks } = useAppContext(); 
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
        deleteTask(id);
        toast({ title: "Success", description: "Task deleted." });
    }
  };

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
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;
    
    setAllTasks((currentTasks) => {
      const activeIndex = currentTasks.findIndex(t => t.id === active.id);
      const overIndex = currentTasks.findIndex(t => t.id === over.id);
      
      if (overIndex === -1) { // Dropped on a column, not a task
         const overColumnId = over.id as KanbanColumnId;
         const activeTask = currentTasks[activeIndex];
         if (activeTask.columnId !== overColumnId) {
             const updatedTask = {...activeTask, columnId: overColumnId};
             let newTasks = [...currentTasks];
             newTasks[activeIndex] = updatedTask;
             // Move to end of column visually by moving in flat array
             return arrayMove(newTasks, activeIndex, newTasks.length -1);
         }
         return currentTasks;
      }
      
      const activeTask = currentTasks[activeIndex];
      const overTask = currentTasks[overIndex];
      
      if(activeTask.columnId !== overTask.columnId) {
          // Change column id and then move
          let newTasks = [...currentTasks];
          newTasks[activeIndex] = {...activeTask, columnId: overTask.columnId};
          return arrayMove(newTasks, activeIndex, overIndex);
      }
      
      // Just reorder in same column
      return arrayMove(currentTasks, activeIndex, overIndex);
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button>
                </DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader><TaskForm onFinished={() => setIsAddDialogOpen(false)} /></DialogContent>
            </Dialog>
        </div>

        <Dialog open={!!editingTask} onOpenChange={(isOpen) => !isOpen && setEditingTask(undefined)}>
            <DialogContent><DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader><TaskForm task={editingTask} onFinished={() => setEditingTask(undefined)} /></DialogContent>
        </Dialog>

        <div className="flex-1 min-h-0">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start h-full">
                    {columns.map(column => (
                        <KanbanColumn 
                            key={column.id} 
                            column={column} 
                            tasks={tasksByColumn[column.id] || []} 
                            onEdit={setEditingTask} 
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
                 <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    </div>
  );
}
