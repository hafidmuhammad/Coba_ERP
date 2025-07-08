"use client";

import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/app-context';
import type { Task, Employee } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, MoreHorizontal, Edit, Trash2, CalendarIcon, User, Flag, Filter, Search } from 'lucide-react';
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
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

const priorities = [
    { value: 'low', label: 'Low', icon: Flag },
    { value: 'medium', label: 'Medium', icon: Flag },
    { value: 'high', label: 'High', icon: Flag },
    { value: 'urgent', label: 'Urgent', icon: Flag },
];

const getPriorityClassName = (priority: Task['priority']) => {
    switch (priority) {
        case 'urgent': return 'bg-red-500 border-red-500 text-white';
        case 'high': return 'bg-orange-500 border-orange-500 text-white';
        case 'medium': return 'bg-blue-500 border-blue-500 text-white';
        case 'low': return 'bg-gray-500 border-gray-500 text-white';
        default: return 'bg-muted text-muted-foreground';
    }
};

const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().optional(),
});

function TaskForm({ task, onFinished }: { task?: Task, onFinished: () => void }) {
  const { addTask, updateTask, employees } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      priority: task?.priority || 'medium',
      assignedTo: task?.assignedTo || "",
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
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Draft Q4 report" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Add more details..."/></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel>
                <Popover><PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
              </FormItem>
            )} />
            <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </FormItem>
            )} />
        </div>
        <FormField control={form.control} name="assignedTo" render={({ field }) => (
            <FormItem><FormLabel>Assigned To</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                </Select>
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

function TaskCard({ task, onEdit, onDelete, isOverlay, employeeMap }: { task: Task; onEdit?: (task: Task) => void; onDelete?: (id: string) => void; isOverlay?: boolean, employeeMap: Map<string, Employee> }) {
  const assignedUser = task.assignedTo ? employeeMap.get(task.assignedTo) : undefined;
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className={cn("mb-4 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow", isOverlay && "shadow-xl ring-2 ring-primary")}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <p className="font-semibold text-sm leading-snug pr-2">{task.title}</p>
          <DropdownMenu><DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger><DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(task.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
          </DropdownMenuContent></DropdownMenu>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mt-1 mb-2 whitespace-pre-wrap">{task.description}</p>}
        <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-2">
                {task.priority && <Badge className={cn("text-xs", getPriorityClassName(task.priority))}>{task.priority}</Badge>}
                {task.dueDate && <div className="flex items-center text-xs text-muted-foreground"><CalendarIcon className="h-3 w-3 mr-1" /><span>{format(new Date(task.dueDate), "MMM d")}</span></div>}
            </div>
            {assignedUser && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6"><AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback></Avatar>
                        </TooltipTrigger>
                        <TooltipContent><p>{assignedUser.name}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function SortableTaskItem({ task, onEdit, onDelete, employeeMap, filters }: { task: Task; onEdit: (task: Task) => void; onDelete: (id: string) => void; employeeMap: Map<string, Employee>, filters: any }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    
    const isVisible = useMemo(() => {
        const searchTermMatch = !filters.searchTerm || task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) || task.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
        const priorityMatch = !filters.priority || task.priority === filters.priority;
        const assignedToMatch = !filters.assignedTo || task.assignedTo === filters.assignedTo;
        return searchTermMatch && priorityMatch && assignedToMatch;
    }, [task, filters]);


    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(!isVisible && "hidden")}>
            <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} employeeMap={employeeMap} />
        </div>
    );
}

function KanbanColumn({ column, tasks, onEdit, onDelete, employeeMap, filters }: { column: KanbanColumn, tasks: Task[], onEdit: (task: Task) => void; onDelete: (id: string) => void; employeeMap: Map<string, Employee>, filters: any }) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'column' } });
  
  return (
    <div className="bg-muted/50 rounded-lg flex flex-col max-h-full">
        <div className="p-3 border-b border-border sticky top-0 bg-muted/60 backdrop-blur-sm z-10">
            <h2 className="font-semibold flex items-center justify-between">
                <span>{column.title}</span>
                <span className="text-sm font-normal bg-primary/10 text-primary rounded-full px-2 py-0.5">{tasks.length}</span>
            </h2>
        </div>
        <SortableContext id={column.id} items={tasks.map(t => t.id)}>
            <div ref={setNodeRef} className="p-2 pt-4 flex-1 overflow-y-auto">
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <SortableTaskItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} employeeMap={employeeMap} filters={filters} />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground p-4 text-center">No tasks in this column.</div>
                )}
            </div>
        </SortableContext>
    </div>
  );
}


export default function KanbanPage() {
  const { tasks, deleteTask, setAllTasks, employees } = useAppContext(); 
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({ searchTerm: '', priority: '', assignedTo: '' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

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
        } else {
            // If a task has an invalid columnId, put it in 'todo'
            grouped['todo'].push(task);
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
    
    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setAllTasks((currentTasks) => {
        const activeIndex = currentTasks.findIndex((t) => t.id === activeId);
        let overIndex = currentTasks.findIndex((t) => t.id === overId);
        
        const activeTask = currentTasks[activeIndex];
        
        // Dropped on a column
        if(columns.some(c => c.id === overId)) {
            const overColumnId = overId as KanbanColumnId;
            if (activeTask.columnId !== overColumnId) {
                const updatedTasks = [...currentTasks];
                updatedTasks[activeIndex] = { ...activeTask, columnId: overColumnId };
                return arrayMove(updatedTasks, activeIndex, updatedTasks.length - 1);
            }
            return currentTasks;
        }

        // Dropped on a task
        const overTask = currentTasks[overIndex];
        if (!overTask) return currentTasks;

        if (activeTask.columnId !== overTask.columnId) {
            const updatedTasks = [...currentTasks];
            updatedTasks[activeIndex] = { ...activeTask, columnId: overTask.columnId };
            return arrayMove(updatedTasks, activeIndex, overIndex);
        }

        return arrayMove(currentTasks, activeIndex, overIndex);
    });
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();


  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold">Kanban Board</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add Task</Button></DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader><TaskForm onFinished={() => setIsAddDialogOpen(false)} /></DialogContent>
            </Dialog>
        </div>

        <Card className="mb-4 p-3 flex-shrink-0">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tasks..." className="pl-9" value={filters.searchTerm} onChange={e => handleFilterChange('searchTerm', e.target.value)} />
                </div>
                <Select value={filters.priority} onValueChange={value => handleFilterChange('priority', value)}>
                    <SelectTrigger className="w-full md:w-[180px]"><div className="flex items-center gap-2"><Flag className="h-4 w-4" /><span>Priority</span></div></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Priorities</SelectItem>
                        {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.assignedTo} onValueChange={value => handleFilterChange('assignedTo', value)}>
                    <SelectTrigger className="w-full md:w-[180px]"><div className="flex items-center gap-2"><User className="h-4 w-4" /><span>Assignee</span></div></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Assignees</SelectItem>
                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Button variant="ghost" onClick={() => setFilters({ searchTerm: '', priority: '', assignedTo: '' })}>Clear</Button>
            </div>
        </Card>

        <Dialog open={!!editingTask} onOpenChange={(isOpen) => !isOpen && setEditingTask(undefined)}>
            <DialogContent><DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader><TaskForm task={editingTask} onFinished={() => setEditingTask(undefined)} /></DialogContent>
        </Dialog>

        <div className="flex-1 min-h-0">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start h-full">
                    {columns.map(column => (
                        <KanbanColumn 
                            key={column.id} 
                            column={column} 
                            tasks={tasksByColumn[column.id] || []} 
                            onEdit={setEditingTask} 
                            onDelete={handleDelete}
                            employeeMap={employeeMap}
                            filters={filters}
                        />
                    ))}
                </div>
                 <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} isOverlay employeeMap={employeeMap} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    </div>
  );
}
