import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Lock, X } from "lucide-react";

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("page-x pt-8", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-end justify-between gap-3">
          {title ? <h2 className="eyebrow">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  return (
    <As className={cn("border border-hairline bg-surface/60 p-4", className)}>{children}</As>
  );
}

export function Row({
  label,
  value,
  mono = true,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2 hairline-b", className)}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={cn("text-right text-[14px]", mono && "num")}>{value}</span>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  full,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "destructive";
  full?: boolean;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[3px] px-5 text-[15px] font-medium transition-colors duration-150 disabled:opacity-40",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "border border-hairline bg-transparent hover:bg-surface",
        variant === "quiet" && "px-0 text-muted-foreground underline underline-offset-4",
        variant === "destructive" && "border border-destructive/40 text-destructive",
        full && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  children,
  variant = "primary",
  full,
  params,
  search,
  className,
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  full?: boolean;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  className?: string;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      params={params as never}
      search={search as never}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[3px] px-5 text-[15px] font-medium transition-colors duration-150",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "border border-hairline hover:bg-surface",
        variant === "quiet" && "px-0 text-muted-foreground underline underline-offset-4",
        full && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block py-3 hairline-b">
      <span className="eyebrow block">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full min-h-[44px] border-0 border-b border-hairline bg-transparent num text-[17px] outline-none focus:border-primary";

export const selectClass =
  "w-full min-h-[44px] border-0 border-b border-hairline bg-transparent text-[16px] outline-none focus:border-primary";

export function Choice({
  selected,
  onClick,
  title,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  detail?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full min-h-[52px] items-center justify-between gap-4 border px-4 py-3 text-left text-[15px] transition-colors duration-150",
        selected ? "border-primary bg-primary/5" : "border-hairline hover:bg-surface",
      )}
    >
      <span>
        {title}
        {detail && <span className="block text-[12px] text-muted-foreground">{detail}</span>}
      </span>
      <span
        className={cn(
          "size-[14px] shrink-0 border",
          selected ? "border-primary bg-primary" : "border-hairline",
        )}
        aria-hidden
      />
    </button>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-hairline p-6">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LockedCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="border border-hairline">
      {children && (
        <div className="pointer-events-none max-h-44 overflow-hidden opacity-35">{children}</div>
      )}
      <div className="hairline-t p-4">
        <p className="flex items-center gap-2 text-[14px] font-medium">
          <Lock className="size-[14px]" strokeWidth={1.5} /> {title}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
        <LinkButton to="/paywall" variant="secondary" className="mt-4 min-h-[44px]">
          See Pro
        </LinkButton>
      </div>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-label={title}>
      <button
        aria-label="Dismiss"
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
      />
      <div className="rise relative max-h-[92vh] w-full overflow-y-auto border-t border-hairline bg-background pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-background page-x py-4 hairline-b">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2">
            <X className="size-[18px]" strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] leading-relaxed text-muted-foreground">{children}</p>
  );
}

export function StatusTag({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "warning" | "critical";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block border px-2 py-[2px] text-[11px] uppercase tracking-[0.1em]",
        tone === "neutral" && "border-hairline text-muted-foreground",
        tone === "accent" && "border-primary text-primary",
        tone === "warning" && "border-warning text-warning-foreground",
        tone === "critical" && "border-destructive text-destructive",
      )}
    >
      {children}
    </span>
  );
}
