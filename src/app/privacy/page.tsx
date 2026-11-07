import { SiteFooter } from "@/components/marketing/SiteFooter";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Privacy policy"
        subtitle="How Roshan Care handles family, staff, and patient information for home nursing operations in Bhilwara."
      />
      <Section className="max-w-3xl">
        <div className="soft-panel space-y-8 p-6 md:p-10">
          <section className="space-y-3 text-[15px] leading-relaxed text-muted">
            <h2 className="font-display text-2xl text-heading">Information we collect</h2>
            <p>
              We collect account details (name, phone, email), care booking information, attendance
              GPS/photo records for duty verification, medication and care notes for clinical
              continuity, and billing records linked to your bookings.
            </p>
          </section>
          <section className="space-y-3 text-[15px] leading-relaxed text-muted">
            <h2 className="font-display text-2xl text-heading">How we use it</h2>
            <p>
              Data is used to assign staff, verify on-site presence, share family updates, process
              payroll, and respond to emergencies. We do not sell personal data.
            </p>
          </section>
          <section className="space-y-3 text-[15px] leading-relaxed text-muted">
            <h2 className="font-display text-2xl text-heading">Contact</h2>
            <p>
              For privacy requests, contact the care desk at{" "}
              <a className="font-semibold text-primary" href="tel:+917073231360">
                +91 70732 31360
              </a>{" "}
              or visit the contact page.
            </p>
          </section>
        </div>
      </Section>
      <SiteFooter />
    </>
  );
}
