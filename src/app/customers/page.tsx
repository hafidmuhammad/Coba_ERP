"use client";

import React, { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subDays,
  format,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAppContext } from "@/contexts/app-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Customer, CustomerCategory, CustomerType } from "@/lib/types";
import {
  PlusCircle,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Activity,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const customerSchema = z.object({
  name: z.string().min(2, "Nama lengkap / perusahaan wajib diisi."),
  category: z.enum(["Perorangan", "Perusahaan", "VIP", "Mitra"], {
    required_error: "Kategori wajib dipilih.",
  }),
  type: z.enum(["B2B", "B2C", "Reseller"], {
    required_error: "Tipe akun wajib dipilih.",
  }),
  email: z.string().email("Format email tidak valid."),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit."),
  address: z.string().min(5, "Alamat wajib diisi."),
  picName: z.string().min(2, "Nama PIC wajib diisi."),
});

const customerCategories: CustomerCategory[] = [
  "Perorangan",
  "Perusahaan",
  "VIP",
  "Mitra",
];
const customerTypes: CustomerType[] = ["B2B", "B2C", "Reseller"];

const SEGMENT_COLORS = {
    'Perusahaan': 'hsl(var(--chart-1))',
    'Perorangan': 'hsl(var(--chart-2))',
    'VIP': 'hsl(var(--chart-3))',
    'Mitra': 'hsl(var(--chart-4))',
};


function CustomerForm({
  customer,
  onFinished,
}: {
  customer?: Customer;
  onFinished: () => void;
}) {
  const { addCustomer, updateCustomer } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          ...customer,
        }
      : {
          name: "",
          category: "Perorangan",
          type: "B2C",
          email: "",
          phone: "",
          address: "",
          picName: "",
        },
  });

  const onSubmit = (values: z.infer<typeof customerSchema>) => {
    if (customer) {
      updateCustomer({ ...customer, ...values });
      toast({ title: "Sukses", description: "Data pelanggan diperbarui." });
    } else {
      addCustomer(values);
      toast({ title: "Sukses", description: "Pelanggan baru ditambahkan." });
    }
    onFinished();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap / Perusahaan</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Contoh: PT Sejahtera Abadi" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customerCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Akun</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customerTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  placeholder="contoh@bisnis.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl>
                <Input {...field} placeholder="08123456789" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Jl. Pahlawan No. 10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="picName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama PIC</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Budi" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Batal
            </Button>
          </DialogClose>
          <Button type="submit">Simpan Pelanggan</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function CustomersPage() {
  const { customers, revenue, deleteCustomer } = useAppContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const { toast } = useToast();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  const customerAnalytics = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);
    const thirtyDaysAgo = subDays(now, 30);

    const firstSeenMap = new Map<string, Date>();
    [...revenue]
        .sort((a,b) => a.date.getTime() - b.date.getTime())
        .forEach(r => {
            if (!firstSeenMap.has(r.customer)) {
                firstSeenMap.set(r.customer, r.date);
            }
        });
    
    let newThisMonth = 0;
    firstSeenMap.forEach(date => {
        if (isWithinInterval(date, { start: firstDayOfMonth, end: lastDayOfMonth })) {
            newThisMonth++;
        }
    });

    const activeCustomerSet = new Set<string>();
    revenue.forEach(r => {
        if (isWithinInterval(r.date, { start: thirtyDaysAgo, end: now })) {
            activeCustomerSet.add(r.customer);
        }
    });

    const customerGrowth = Array.from(firstSeenMap.entries())
        .reduce((acc, [, date]) => {
            const month = format(date, "yyyy-MM");
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

    const customerGrowthData = Object.entries(customerGrowth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
            month: format(new Date(`${month}-02`), "MMM yy"),
            "Pelanggan Baru": count
        }));

    const segmentationData = customers.reduce((acc, customer) => {
        acc[customer.category] = (acc[customer.category] || 0) + 1;
        return acc;
    }, {} as Record<CustomerCategory, number>);

    const segmentationChartData = Object.entries(segmentationData).map(([name, value]) => ({
        name,
        value,
        fill: SEGMENT_COLORS[name as CustomerCategory] || 'hsl(var(--muted))'
    }));

    const topCustomers = revenue.reduce((acc, r) => {
        acc[r.customer] = (acc[r.customer] || 0) + r.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCustomersData = Object.entries(topCustomers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, total]) => ({ name, total }));


    return {
      totalCustomers: customers.length,
      newThisMonth,
      activeLast30Days: activeCustomerSet.size,
      customerGrowthData,
      segmentationChartData,
      topCustomersData
    };
  }, [customers, revenue]);

  const growthChartConfig: ChartConfig = {
    "Pelanggan Baru": { label: "Pelanggan Baru", color: "hsl(var(--chart-1))" },
  };
  const segmentationChartConfig: ChartConfig = customerAnalytics.segmentationChartData.reduce((acc, cur) => {
      acc[cur.name] = { label: cur.name, color: cur.fill };
      return acc;
  }, {} as ChartConfig);
  const topCustomerChartConfig: ChartConfig = {
      total: { label: "Total Pembelian", color: "hsl(var(--chart-2))" }
  };

  const handleOpenDialog = (customer?: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingCustomer(undefined);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) {
      deleteCustomer(id);
      toast({ title: "Sukses", description: "Pelanggan telah dihapus." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Pelanggan</h2>
          <p className="text-muted-foreground">Analisis dan kelola data pelanggan Anda.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pelanggan
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{customerAnalytics.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Jumlah semua pelanggan terdaftar</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pelanggan Baru Bulan Ini</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+{customerAnalytics.newThisMonth}</div>
                <p className="text-xs text-muted-foreground">Berdasarkan tanggal transaksi pertama</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{customerAnalytics.activeLast30Days}</div>
                <p className="text-xs text-muted-foreground">Pelanggan dengan transaksi 30 hari terakhir</p>
            </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Pertumbuhan Pelanggan</CardTitle>
                <CardDescription>Jumlah pelanggan baru per bulan.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={growthChartConfig} className="min-h-[250px] w-full">
                    <LineChart data={customerAnalytics.customerGrowthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Line dataKey="Pelanggan Baru" type="monotone" stroke="var(--color-Pelanggan Baru)" strokeWidth={2} dot={true} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Segmentasi Pelanggan</CardTitle>
                <CardDescription>Distribusi pelanggan berdasarkan kategori.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
                 <ChartContainer config={segmentationChartConfig} className="min-h-[250px] w-full aspect-square">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={customerAnalytics.segmentationChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pelanggan</CardTitle>
            <CardDescription>
              Kelola semua data pelanggan Anda di satu tempat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>PIC</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{customer.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>{customer.picName}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Belum ada data pelanggan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editingCustomer}
            onFinished={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
