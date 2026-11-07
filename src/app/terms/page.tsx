import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Terms of service"
        subtitle="Booking, staffing, attendance, and payment terms for Roshan Care home nursing services."
      />
      <Section className="max-w-3xl">
        <div className="soft-panel space-y-8 p-6 md:p-10">
          <section className="space-y-3 text-[15px] leading-relaxed text-muted">
            <h2 className="font-display text-2xl text-heading">Care bookings</h2>
            <p>
              Packages and rates are confirmed by the care desk before assignment. Shift length,
              care type, and site address must be accurate so staff can complete GPS attendance.
            </p>
          </section>
          <section className="space-y-3 text-[15px] leading-relaxed text-muted">
            <h2 className="font-display text-2xl text-heading">Staff duties</h2>
            <p>
              Assigned staff must mark morning and evening presence as required, follow clinical
              instructions, and log medicines/notes for family visibility. Site PIN and geofence
              rules may apply.
            </p>
          </section>
          <section className="space-y-3 text-[15px] leading-relaxed text-muted">
            <h2 className="font-display text-2xl text-heading">Payments</h2>
            <p>
              Invoices are payable as per due dates. UPI and desk-assisted payments may be offered.
              Staff salary is handled separately through payroll and is not a family portal function.
            </p>
          </section>
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
