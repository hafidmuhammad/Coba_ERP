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

export type AppointmentCategory = 'meeting' | 'deadline' | 'work' | 'personal';
export type AppointmentStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
  description?: string;
  assignedTo?: string; // Employee ID
  category: AppointmentCategory;
  status: AppointmentStatus;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  salary: number;
}

export interface Task {
  id:string;
  title: string;
  description?: string;
  columnId: 'todo' | 'inprogress' | 'inreview' | 'done';
  startDate?: Date;
  endDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // Employee ID
}

export interface Holiday {
  id: string;
  startDate: Date;
  endDate: Date;
  title: string;
  type: 'holiday';
}
