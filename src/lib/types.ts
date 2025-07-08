export interface Revenue {
  id: string;
  date: Date;
  amount: number;
  customer: string;
  description: string;
}

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  vendor: string;
  description: string;
}

export interface Appointment {
  id: string;
  date: Date;
  startTime: string;
  duration: number; // in minutes
  title: string;
  participants?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}
