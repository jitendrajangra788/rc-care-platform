import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn("field", invalid && "field-error", className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn("field min-h-[6.5rem] resize-y", invalid && "field-error", className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn("field", invalid && "field-error", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-heading", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function FieldHint({
  className,
  error,
  children,
}: {
  className?: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 text-xs",
        error ? "text-danger" : "text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function FormField({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label ? <Label>{label}</Label> : null}
      {children}
      {error ? <FieldHint error>{error}</FieldHint> : null}
      {!error && hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}
