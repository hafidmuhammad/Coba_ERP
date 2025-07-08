"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Revenue, Expense, Appointment, Product, Employee, Task } from "@/lib/types";

// Mock Data
const initialRevenue: Revenue[] = [
  { id: "rev1", date: new Date(2023, 10, 15), amount: 1200, customer: "Client A", description: "Web Design Project" },
  { id: "rev2", date: new Date(2023, 10, 20), amount: 750, customer: "Client B", description: "Consulting Services" },
  { id: "rev3", date: new Date(2023, 11, 5), amount: 2500, customer: "Client C", description: "E-commerce Site" },
];

const initialExpenses: Expense[] = [
  { id: "exp1", date: new Date(2023, 10, 1), amount: 50, vendor: "Software Inc.", description: "Monthly Subscription" },
  { id: "exp2", date: new Date(2023, 10, 18), amount: 300, vendor: "Office Supplies Co.", description: "New Equipment" },
  { id: "exp3", date: new Date(2023, 11, 8), amount: 150, vendor: "Cloud Services", description: "Hosting Bill" },
];

const initialAppointments: Appointment[] = [
  { id: "app1", date: new Date(), startTime: "10:00", duration: 60, title: "Project Kick-off with Client A", participants: "John Doe, Jane Smith" },
  { id: "app2", date: new Date(), startTime: "14:00", duration: 30, title: "Team Stand-up", participants: "Development Team" },
];

const initialProducts: Product[] = [
  { id: "prod1", name: "Standard Web Package", description: "Basic website design and development.", price: 1500, quantity: 10 },
  { id: "prod2", name: "E-commerce Solution", description: "Full online store with payment gateway.", price: 4000, quantity: 5 },
  { id: "prod3", name: "Monthly Maintenance", description: "Site updates and support.", price: 200, quantity: 50 },
];

const initialEmployees: Employee[] = [
  { id: "emp1", name: "John Doe", position: "Software Engineer", email: "john.doe@example.com", phone: "123-456-7890", salary: 80000 },
  { id: "emp2", name: "Jane Smith", position: "Project Manager", email: "jane.smith@example.com", phone: "098-765-4321", salary: 95000 },
];

const initialTasks: Task[] = [
  { id: 'task1', columnId: 'todo', title: 'Draft Q3 promotional material', description: 'Focus on new port services.', assignedDate: new Date() },
  { id: 'task2', columnId: 'todo', title: 'Schedule social media posts for next week' },
  { id: 'task3', columnId: 'inprogress', title: 'Develop new CRM integration feature', assignedDate: new Date() },
  { id: 'task4', columnId: 'inprogress', title: 'Onboard new logistics partner' },
  { id: 'task5', columnId: 'inreview', title: 'Review Q2 financial report' },
  { id: 'task6', columnId: 'done', title: 'Finalize employee handbook update', assignedDate: new Date() },
];

interface AppContextType {
  revenue: Revenue[];
  expenses: Expense[];
  appointments: Appointment[];
  products: Product[];
  employees: Employee[];
  tasks: Task[];
  addRevenue: (item: Omit<Revenue, "id">) => void;
  addExpense: (item: Omit<Expense, "id">) => void;
  addAppointment: (item: Omit<Appointment, "id">) => void;
  updateAppointment: (item: Appointment) => void;
  deleteAppointment: (id: string) => void;
  addProduct: (item: Omit<Product, "id">) => void;
  updateProduct: (item: Product) => void;
  deleteProduct: (id: string) => void;
  addEmployee: (item: Omit<Employee, "id">) => void;
  updateEmployee: (item: Employee) => void;
  deleteEmployee: (id: string) => void;
  addTask: (item: Omit<Task, "id">) => void;
  updateTask: (item: Task) => void;
  deleteTask: (id: string) => void;
  setAllTasks: (tasks: Task[] | ((tasks: Task[]) => Task[])) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [revenue, setRevenue] = useState<Revenue[]>(initialRevenue);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addRevenue = (item: Omit<Revenue, "id">) => {
    setRevenue((prev) => [...prev, { ...item, id: `rev${Date.now()}` }]);
  };

  const addExpense = (item: Omit<Expense, "id">) => {
    setExpenses((prev) => [...prev, { ...item, id: `exp${Date.now()}` }]);
  };

  const addAppointment = (item: Omit<Appointment, "id">) => {
    setAppointments((prev) => [...prev, { ...item, id: `app${Date.now()}` }]);
  };

  const updateAppointment = (updatedItem: Appointment) => {
    setAppointments((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter(item => item.id !== id));
  };

  const addProduct = (item: Omit<Product, "id">) => {
    setProducts((prev) => [...prev, { ...item, id: `prod${Date.now()}` }]);
  };

  const updateProduct = (updatedItem: Product) => {
    setProducts((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter(item => item.id !== id));
  };

  const addEmployee = (item: Omit<Employee, "id">) => {
    setEmployees((prev) => [...prev, { ...item, id: `emp${Date.now()}` }]);
  };

  const updateEmployee = (updatedItem: Employee) => {
    setEmployees((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter(item => item.id !== id));
  };

  const addTask = (item: Omit<Task, "id">) => {
    setTasks((prev) => [...prev, { ...item, id: `task${Date.now()}` }]);
  };

  const updateTask = (updatedItem: Task) => {
    setTasks((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter(item => item.id !== id));
  };
  
  const setAllTasks = (newTasks: Task[] | ((tasks: Task[]) => Task[])) => {
    setTasks(newTasks);
  };

  return (
    <AppContext.Provider
      value={{
        revenue,
        expenses,
        appointments,
        products,
        employees,
        tasks,
        addRevenue,
        addExpense,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addProduct,
        updateProduct,
        deleteProduct,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTask,
        updateTask,
        deleteTask,
        setAllTasks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
