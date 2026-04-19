"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "./stepper";
import { WizardProvider, useWizard } from "./wizard-provider";
import { StepPostcode } from "./step-postcode";
import { StepWaste } from "./step-waste";
import { StepSkip } from "./step-skip";
import { StepReview } from "./step-review";

function WizardInner() {
  const { state } = useWizard();
  return (
    <Card
      className="w-full border-border/60 bg-card/95 shadow-lg shadow-primary/5 backdrop-blur-sm"
      data-testid="wizard"
    >
      <CardHeader className="gap-4 border-b border-border/60 pb-5">
        <CardTitle className="text-lg tracking-tight sm:text-xl">
          Book a skip
        </CardTitle>
        <Stepper current={state.step} />
      </CardHeader>
      <CardContent className="pt-6" data-testid={`wizard-step-${state.step}`}>
        {state.step === 1 && <StepPostcode />}
        {state.step === 2 && <StepWaste />}
        {state.step === 3 && <StepSkip />}
        {state.step === 4 && <StepReview />}
      </CardContent>
    </Card>
  );
}

export function BookingWizard() {
  return (
    <WizardProvider>
      <WizardInner />
    </WizardProvider>
  );
}
