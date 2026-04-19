import Link from "next/link";
import { Sparkles, Truck } from "lucide-react";

import { BookingWizard } from "@/components/booking/booking-wizard";
import { BackgroundMesh } from "@/components/background-mesh";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <BackgroundMesh />
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="group flex items-center gap-2"
            data-testid="brand-link"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30 transition-transform group-hover:-rotate-3">
              <Truck className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight sm:text-base">
                SkipWise
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Booking
              </span>
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3 w-3" aria-hidden />
            QA Assessment Demo
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Instant quote · 4-step checkout
          </span>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Book a skip in{" "}
            <span className="text-primary">four easy steps</span>
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
            Enter your postcode, tell us about your waste, pick a skip size, and confirm.
            Transparent pricing, VAT included in the final total.
          </p>
        </div>
        <BookingWizard />
      </main>

      <footer className="border-t border-border/60 bg-background/80">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <span>
            Deterministic demo — try{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              SW1A 1AA
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              EC1A 1BB
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              M1 1AE
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              BS1 4DJ
            </code>
            .
          </span>
          <span className="text-muted-foreground/80">
            Built with Next.js · Tailwind · shadcn/ui
          </span>
        </div>
      </footer>
    </div>
  );
}
