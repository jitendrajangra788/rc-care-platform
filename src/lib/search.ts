export type SearchHit = {
  id: string;
  type: "patient" | "booking" | "staff" | "lead" | "invoice";
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};
