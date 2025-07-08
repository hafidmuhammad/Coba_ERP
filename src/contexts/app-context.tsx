"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Revenue, Expense, Appointment } from "@/lib/types";

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


interface AppContextType {
  revenue: Revenue[];
  expenses: Expense[];
  appointments: Appointment[];
  addRevenue: (item: Omit<Revenue, "id">) => void;
  addExpense: (item: Omit<Expense, "id">) => void;
  addAppointment: (item: Omit<Appointment, "id">) => void;
  updateAppointment: (item: Appointment) => void;
  deleteAppointment: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [revenue, setRevenue] = useState<Revenue[]>(initialRevenue);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

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

  return (
    <AppContext.Provider
      value={{
        revenue,
        expenses,
        appointments,
        addRevenue,
        addExpense,
        addAppointment,
        updateAppointment,
        deleteAppointment
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
