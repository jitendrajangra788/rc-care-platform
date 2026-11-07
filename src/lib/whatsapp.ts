/** Build wa.me deep links (WhatsApp Cloud API can replace later). */
export function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export const waTemplates = {
  bookingAssigned: (patient: string, shift: string) =>
    `Namaste, Roshan Care desk se. Aapko ${patient} ki duty assign hui hai (${shift}). App me Attendance → Morning present lagana mat bhoolna.`,
  morningDone: (patient: string, staff: string) =>
    `Update: ${staff} ne ${patient} ke liye morning present + photo complete kar diya hai.`,
  eveningDone: (patient: string, staff: string, amount: number) =>
    `Duty complete: ${staff} ne ${patient} evening present lagaya. Shift pay ₹${amount} earned.`,
  sos: (patient: string, msg: string) =>
    `SOS ALERT · ${patient}\n${msg}\nPlease respond on Roshan Care desk immediately.`,
  invoiceDue: (patient: string, amount: number, due: string) =>
    `Roshan Care invoice reminder for ${patient}: ₹${amount} due by ${due}. Pay via UPI or contact care desk.`,
  medicineDue: (patient: string, med: string, time: string) =>
    `Medicine reminder · ${patient}: ${med} at ${time}. Log after giving in Medicine Chart.`,
};
