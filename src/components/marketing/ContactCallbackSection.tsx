import { CallbackForm } from "@/components/marketing/CallbackForm";

export function ContactCallbackSection() {
  return (
    <section className="bg-[#f3f4f6]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-9 sm:px-5 md:grid-cols-[1fr_1.05fr] md:items-center md:gap-10 md:px-8 md:py-12 lg:gap-14">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted sm:text-[11px]">
            Contact us today
          </p>
          <h2 className="font-display mt-2 text-[clamp(1.55rem,4vw,2.35rem)] leading-[1.1] tracking-[-0.03em] text-heading">
            Need a nurse or care today?
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
            Tell us the service and shift. We call you back with a clear plan.
          </p>
          <a
            href="tel:+917073231360"
            className="mt-5 inline-block font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-none tracking-[-0.04em] text-heading transition hover:text-primary"
          >
            70732 31360
          </a>
          <p className="mt-2 text-xs text-muted sm:text-sm">Bhilwara · Ambulance 24×7</p>
        </div>

        <CallbackForm />
      </div>
    </section>
  );
}
