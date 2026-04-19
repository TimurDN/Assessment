import { BookingWizard } from "@/components/booking/booking-wizard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              S
            </div>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              SkipWise Booking
            </span>
          </div>
          <span className="text-xs text-muted-foreground sm:text-sm">
            QA Assessment Demo
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Book a skip in four steps
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your postcode, tell us about your waste, pick a skip size, and confirm.
          </p>
        </div>
        <BookingWizard />
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
          Deterministic demo — try{" "}
          <code className="rounded bg-muted px-1 py-0.5">SW1A 1AA</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">EC1A 1BB</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">M1 1AE</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">BS1 4DJ</code>.
        </div>
      </footer>
    </div>
  );
}
