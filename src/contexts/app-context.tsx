"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Revenue, Expense, Appointment, Product, Employee, Task, Customer } from "@/lib/types";

// Mock Data
const initialRevenue: Revenue[] = [
  { id: "rev1", date: new Date("2023-11-15"), amount: 1200, customer: "CV Makmur Jaya", description: "Web Design Project" },
  { id: "rev2", date: new Date("2023-11-20"), amount: 750, customer: "Budi Santoso", description: "Consulting Services" },
  { id: "rev3", date: new Date("2023-12-05"), amount: 2500, customer: "PT Aman Sentosa", description: "E-commerce Site" },
  { id: "rev4", date: new Date("2024-01-20"), amount: 1800, customer: "CV Makmur Jaya", description: "SEO Optimization" },
  { id: "rev5", date: new Date("2024-02-10"), amount: 950, customer: "Toko Kelontong Berkah", description: "Logo Design" },
  { id: "rev6", date: new Date("2024-03-25"), amount: 3200, customer: "PT Aman Sentosa", description: "Full Branding Package" },
];

const initialExpenses: Expense[] = [
  { id: "exp1", date: new Date("2023-11-01"), amount: 50, vendor: "Software Inc.", description: "Monthly Subscription" },
  { id: "exp2", date: new Date("2023-11-18"), amount: 300, vendor: "Office Supplies Co.", description: "New Equipment" },
  { id: "exp3", date: new Date("2023-12-08"), amount: 150, vendor: "Cloud Services", description: "Hosting Bill" },
  { id: "exp4", date: new Date("2024-01-10"), amount: 1200, vendor: "Marketing Agency", description: "Ad Campaign" },
  { id: "exp5", date: new Date("2024-02-15"), amount: 75, vendor: "Software Inc.", description: "Plugin License" },
  { id: "exp6", date: new Date("2024-03-05"), amount: 500, vendor: "Legal Services", description: "Contract Review" },
];

const initialAppointments: Appointment[] = [
    // Q1
    { id: "app1", startDate: new Date("2024-01-15"), endDate: new Date("2024-01-15"), title: "Q1 2024 Kick-off Meeting", assignedTo: 'emp2', category: 'meeting', status: 'completed' },
    { id: "app2", startDate: new Date("2024-01-22"), endDate: new Date("2024-01-22"), title: "Client A - Project Check-in", assignedTo: 'emp2', category: 'meeting', status: 'completed' },
    { id: "app3", startDate: new Date("2024-02-10"), endDate: new Date("2024-02-12"), title: "Leadership Training", category: 'work', status: 'completed' },
    { id: "app4", startDate: new Date("2024-02-28"), endDate: new Date("2024-02-28"), title: "Doctor Appointment", assignedTo: 'emp1', category: 'personal', status: 'completed' },
    { id: "app5", startDate: new Date("2024-03-28"), endDate: new Date("2024-03-28"), title: "Q1 Performance Review Deadline", assignedTo: 'emp2', category: 'deadline', status: 'planned' },
    
    // Q2
    { id: "app6", startDate: new Date("2024-04-05"), endDate: new Date("2024-04-05"), title: "New Project Alpha Planning", assignedTo: 'emp1', category: 'meeting', status: 'planned' },
    { id: "app7", startDate: new Date("2024-04-18"), endDate: new Date("2024-04-18"), title: "Client B - Demo", assignedTo: 'emp1', category: 'meeting', status: 'planned' },
    { id: "app8", startDate: new Date("2024-05-20"), endDate: new Date("2024-05-24"), title: "Company Offsite Event", category: 'personal', status: 'planned' },
    { id: "app9", startDate: new Date("2024-06-15"), endDate: new Date("2024-06-15"), title: "Mid-year Financial Report", assignedTo: 'emp2', category: 'deadline', status: 'planned' },
    { id: "app10", startDate: new Date("2024-06-28"), endDate: new Date("2024-06-28"), title: "Team Lunch", category: 'personal', status: 'planned' },

    // Q3
    { id: "app11", startDate: new Date("2024-07-20"), endDate: new Date("2024-07-20"), title: "Project Kick-off with Client C", description: "Initial meeting to discuss project scope and deliverables.", assignedTo: 'emp2', category: 'meeting', status: 'completed' },
    { id: "app12", startDate: new Date("2024-07-22"), endDate: new Date("2024-07-24"), title: "Focus: CRM Development", description: "Focus block for CRM development.", assignedTo: 'emp1', category: 'work', status: 'ongoing' },
    { id: "app13", startDate: new Date("2024-08-01"), endDate: new Date("2024-08-02"), title: "Design Sprint", category: 'work', status: 'ongoing' },
    { id: "app14", startDate: new Date("2024-08-10"), endDate: new Date("2024-08-10"), title: "Marketing Strategy Session", category: 'meeting', status: 'planned' },
    { id: "app15", startDate: new Date("2024-09-25"), endDate: new Date("2024-09-25"), title: "Q3 Review Deadline", assignedTo: 'emp2', category: 'deadline', status: 'planned' },
    
    // Q4
    { id: "app16", startDate: new Date("2024-10-07"), endDate: new Date("2024-10-07"), title: "Q4 Planning", category: 'meeting', status: 'planned' },
    { id: "app17", startDate: new Date("2024-10-21"), endDate: new Date("2024-10-21"), title: "Interview - Senior Developer", assignedTo: 'emp2', category: 'meeting', status: 'planned' },
    { id: "app18", startDate: new Date("2024-11-15"), endDate: new Date("2024-11-20"), title: "Product Launch Prep", assignedTo: 'emp1', category: 'work', status: 'ongoing' },
    { id: "app19", startDate: new Date("2024-12-05"), endDate: new Date("2024-12-05"), title: "Dentist Appointment", category: 'personal', status: 'planned' },
    { id: "app20", startDate: new Date("2024-12-20"), endDate: new Date("2024-12-20"), title: "End of Year Party", category: 'personal', status: 'planned' },
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
    // Q1
    { id: 'task1', columnId: 'done', title: 'Finalize 2023 tax documents', endDate: new Date("2024-01-30"), priority: 'high', assignedTo: 'emp2' },
    { id: 'task2', columnId: 'done', title: 'Update employee handbooks', endDate: new Date("2024-02-20"), priority: 'medium' },
    { id: 'task3', columnId: 'done', title: 'Plan Q2 marketing campaigns', endDate: new Date("2024-03-15"), priority: 'high', assignedTo: 'emp2' },
    { id: 'task14', columnId: 'done', title: 'Setup new dev environment', startDate: new Date("2024-01-10"), endDate: new Date("2024-01-12"), priority: 'high', assignedTo: 'emp1' },

    // Q2
    { id: 'task4', columnId: 'inreview', title: 'Develop prototype for Project Alpha', endDate: new Date("2024-04-25"), priority: 'urgent', assignedTo: 'emp1' },
    { id: 'task5', columnId: 'inprogress', title: 'Hire new junior developer', endDate: new Date("2024-05-30"), priority: 'high' },
    { id: 'task6', columnId: 'todo', title: 'Research new cloud providers', endDate: new Date("2024-06-10"), priority: 'medium' },
    { id: 'task15', columnId: 'inprogress', title: 'Renew office lease', startDate: new Date("2024-06-01"), endDate: new Date("2024-06-30"), priority: 'urgent', assignedTo: 'emp2' },

    // Q3
    { id: 'task7', columnId: 'todo', title: 'Draft Q3 promotional material', description: 'Focus on new port services.', endDate: new Date("2024-07-23"), priority: 'high', assignedTo: 'emp2' },
    { id: 'task8', columnId: 'inprogress', title: 'Develop new CRM integration feature', startDate: new Date("2024-07-25"), endDate: new Date("2024-08-30"), priority: 'urgent', assignedTo: 'emp1' },
    { id: 'task9', columnId: 'done', title: 'Onboard new logistics partner', endDate: new Date("2024-08-15"), priority: 'high' },
    { id: 'task10', columnId: 'inreview', title: 'Review Q2 financial report', endDate: new Date("2024-07-28"), priority: 'medium', assignedTo: 'emp2'},
    { id: 'task16', columnId: 'todo', title: 'Organize team building activity', endDate: new Date("2024-09-15"), priority: 'low' },
    
    // Q4
    { id: 'task11', columnId: 'todo', title: 'Prepare for holiday sales season', startDate: new Date("2024-10-01"), endDate: new Date("2024-10-31"), priority: 'high' },
    { id: 'task12', columnId: 'inprogress', title: 'Finalize 2025 budget', endDate: new Date("2024-11-25"), priority: 'urgent', assignedTo: 'emp2' },
    { id: 'task13', columnId: 'todo', title: 'Plan end-of-year team assessment', endDate: new Date("2024-12-05"), priority: 'medium' },
    { id: 'task17', columnId: 'todo', title: 'Order new company swag', endDate: new Date("2024-11-10"), priority: 'low', assignedTo: 'emp2' },
];

const initialCustomers: Customer[] = [
    { id: 'cust1', name: 'CV Makmur Jaya', category: 'Perusahaan', type: 'B2B', email: 'makmur@jaya.com', phone: '021-123456', address: 'Jl. Industri No. 1, Jakarta', picName: 'Bapak Subagio' },
    { id: 'cust2', name: 'PT Aman Sentosa', category: 'Perusahaan', type: 'B2B', email: 'contact@amansentosa.co.id', phone: '031-987654', address: 'Jl. Raya Darmo 50, Surabaya', picName: 'Ibu Rina' },
    { id: 'cust3', name: 'Budi Santoso', category: 'Perorangan', type: 'B2C', email: 'budi.s@gmail.com', phone: '081234567890', address: 'Jl. Kenangan Indah 3, Bandung', picName: 'Budi Santoso' },
    { id: 'cust4', name: 'Toko Kelontong Berkah', category: 'Mitra', type: 'Reseller', email: 'berkah@tokokelontong.com', phone: '085678901234', address: 'Jl. Pasar Baru No. 12, Medan', picName: 'Pak Tono' },
    { id: 'cust5', name: 'Luxury Goods ID', category: 'VIP', type: 'B2C', email: 'vip.service@luxury.id', phone: '089987654321', address: 'Jl. Jenderal Sudirman Kav. 5, Jakarta', picName: 'Personal Shopper' },
];

interface AppContextType {
  revenue: Revenue[];
  expenses: Expense[];
  appointments: Appointment[];
  products: Product[];
  employees: Employee[];
  tasks: Task[];
  customers: Customer[];
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
  addCustomer: (item: Omit<Customer, "id">) => void;
  updateCustomer: (item: Customer) => void;
  deleteCustomer: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [revenue, setRevenue] = useState<Revenue[]>(initialRevenue);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

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
  
  const addCustomer = (item: Omit<Customer, "id">) => {
    setCustomers((prev) => [...prev, { ...item, id: `cust${Date.now()}` }]);
  };

  const updateCustomer = (updatedItem: Customer) => {
    setCustomers((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter(item => item.id !== id));
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
        customers,
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
        addCustomer,
        updateCustomer,
        deleteCustomer,
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
