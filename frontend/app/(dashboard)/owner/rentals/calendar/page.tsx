"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function RentalsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const [rentalsRes, vehiclesRes, customersRes] = await Promise.all([
          apiClient.get('/rentals'),
          apiClient.get('/vehicles'),
          apiClient.get('/customers')
        ]);

        const vehicles = vehiclesRes.data.data.vehicles || vehiclesRes.data.data;
        const customers = customersRes.data.data.customers || customersRes.data.data;
        const rentals = rentalsRes.data.data.rentals || rentalsRes.data.data;

        const vehicleMap = new Map(vehicles.map((v: any) => [v.id, v]));
        const customerMap = new Map(customers.map((c: any) => [c.id, c]));

        const calendarEvents = rentals.map((rental: any) => {
          const vehicle = vehicleMap.get(rental.vehicleId);
          const customer = customerMap.get(rental.customerId);
          
          // Parse ISO strings returned by the backend
          const start = rental.pickupAt ? new Date(rental.pickupAt) : new Date();
          const end = rental.actualReturnAt 
            ? new Date(rental.actualReturnAt)
            : (rental.expectedReturnAt ? new Date(rental.expectedReturnAt) : new Date());

          return {
            id: rental.id,
            title: `${vehicle?.registrationNumber || 'Vehicle'} - ${customer?.fullName || 'Customer'}`,
            start,
            end,
            status: rental.status,
            rental
          };
        });

        setEvents(calendarEvents);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load calendar data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, [toast]);

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#6366f1'; // indigo-500
    if (event.status === 'ON_RENT') backgroundColor = '#10b981'; // emerald-500
    if (event.status === 'RESERVED') backgroundColor = '#f59e0b'; // amber-500
    if (event.status === 'COMPLETED') backgroundColor = '#64748b'; // slate-500
    if (event.status === 'CANCELLED') backgroundColor = '#ef4444'; // red-500

    return {
      style: {
        backgroundColor,
        borderRadius: '50%',
        width: '8px',
        height: '8px',
        display: 'inline-block',
        border: 'none',
        margin: '2px',
        padding: '0'
      }
    };
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };
    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };
    return (
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
          {toolbar.label}
        </h2>
        <div className="flex space-x-6 text-indigo-600 dark:text-indigo-500">
          <button onClick={goToBack} className="hover:text-indigo-400 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={goToNext} className="hover:text-indigo-400 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/owner/rentals" className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="w-6 h-6 mr-2 text-indigo-600" />
              Rentals Calendar
            </h1>
          </div>
        </div>
        <div className="flex gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full border-2 border-amber-500 mr-2"></span>Reserved</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full border-2 border-emerald-500 mr-2"></span>On Rent</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full border-2 border-slate-500 mr-2"></span>Completed</div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0b1120] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            eventPropGetter={eventStyleGetter}
            views={['month']}
            defaultView="month"
            components={{
              toolbar: CustomToolbar,
            }}
            formats={{
              monthHeaderFormat: 'MMMM yyyy',
              weekdayFormat: (date, culture, localizer) => localizer?.format(date, 'EEEE', culture)?.substring(0, 2) || '',
            }}
            popup
          />
        )}
      </div>
    </div>
  );
}
