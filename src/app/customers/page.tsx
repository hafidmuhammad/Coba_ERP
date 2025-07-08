"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppContext } from "@/contexts/app-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CustomerData {
    name: string;
    totalRevenue: number;
    orderCount: number;
    lastPurchase: Date;
}

export default function CustomersPage() {
  const { revenue } = useAppContext();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US").format(date);
  }

  const customerData = useMemo(() => {
    const customerMap = new Map<string, CustomerData>();

    revenue.forEach(item => {
      const existing = customerMap.get(item.customer);
      if (existing) {
        existing.totalRevenue += item.amount;
        existing.orderCount += 1;
        if (item.date > existing.lastPurchase) {
          existing.lastPurchase = item.date;
        }
      } else {
        customerMap.set(item.customer, {
          name: item.customer,
          totalRevenue: item.amount,
          orderCount: 1,
          lastPurchase: item.date,
        });
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [revenue]);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
        <CardDescription>
          An overview of your customers based on revenue data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Last Purchase</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerData.length > 0 ? (
              customerData.map((customer) => (
                <TableRow key={customer.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell>{formatDate(customer.lastPurchase)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.totalRevenue)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No customer data found. Add revenue to see customers here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
