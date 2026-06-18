"use client";

import Link from "next/link";
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  XCircle,
} from "lucide-react";

import {
  BookingCard,
  type ClientBooking,
} from "@/app/client/bookings/booking-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type BookingTab = "upcoming" | "needs-action" | "completed" | "cancelled";

export type GroupedBookings = Record<BookingTab, ClientBooking[]>;

type BookingsTabsProps = {
  groups: GroupedBookings;
  paymentParam?: string;
  defaultTab: BookingTab;
};

function isPaymentProcessing(
  booking: ClientBooking,
  paymentParam?: string
): boolean {
  return (
    paymentParam === "success" &&
    booking.status === "accepted_pending_payment" &&
    booking.payment_status === "unpaid"
  );
}

function TabCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
      {count}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
      <Icon className="mx-auto mb-3 size-10 text-muted-foreground/40" />
      <p className="mb-1 font-semibold text-foreground">{title}</p>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

function BookingList({
  bookings,
  paymentParam,
}: {
  bookings: ClientBooking[];
  paymentParam?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          isPaymentProcessing={isPaymentProcessing(booking, paymentParam)}
        />
      ))}
    </div>
  );
}

const tabTriggerClassName =
  "rounded-full px-4 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground data-[active]:bg-gray-200 data-[active]:font-medium data-[active]:text-foreground data-[active]:shadow-sm";

export function BookingsTabs({
  groups,
  paymentParam,
  defaultTab,
}: BookingsTabsProps) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto rounded-full bg-muted p-1 sm:w-fit">
        <TabsTrigger value="upcoming" className={tabTriggerClassName}>
          Upcoming
          <TabCount count={groups.upcoming.length} />
        </TabsTrigger>
        <TabsTrigger value="needs-action" className={tabTriggerClassName}>
          Needs action
          <TabCount count={groups["needs-action"].length} />
        </TabsTrigger>
        <TabsTrigger value="completed" className={tabTriggerClassName}>
          Completed
          <TabCount count={groups.completed.length} />
        </TabsTrigger>
        <TabsTrigger value="cancelled" className={tabTriggerClassName}>
          Cancelled
          <TabCount count={groups.cancelled.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        {groups.upcoming.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming bookings"
            description="Find a cleaner and schedule your next cleaning."
            action={
              <Link href="/client/cleaners">
                <Button size="sm">Find a cleaner</Button>
              </Link>
            }
          />
        ) : (
          <BookingList bookings={groups.upcoming} paymentParam={paymentParam} />
        )}
      </TabsContent>

      <TabsContent value="needs-action">
        {groups["needs-action"].length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No bookings need your action"
            description="You're all caught up."
          />
        ) : (
          <BookingList
            bookings={groups["needs-action"]}
            paymentParam={paymentParam}
          />
        )}
      </TabsContent>

      <TabsContent value="completed">
        {groups.completed.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No completed bookings yet"
            description="Completed jobs will appear here."
          />
        ) : (
          <BookingList
            bookings={groups.completed}
            paymentParam={paymentParam}
          />
        )}
      </TabsContent>

      <TabsContent value="cancelled">
        {groups.cancelled.length === 0 ? (
          <EmptyState
            icon={XCircle}
            title="No cancelled bookings"
            description="Cancelled or declined bookings will appear here."
          />
        ) : (
          <BookingList
            bookings={groups.cancelled}
            paymentParam={paymentParam}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

export function GlobalEmptyState() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card py-24 text-center">
      <CalendarCheck className="mx-auto mb-3 size-10 text-muted-foreground/40" />
      <p className="text-xl font-semibold text-foreground">No bookings yet</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Find a cleaner to get started.
      </p>
      <Link href="/client/cleaners" className="mt-6 inline-block">
        <Button className="gap-1.5">
          Find a cleaner
          <ChevronRight className="size-4" />
        </Button>
      </Link>
    </section>
  );
}
