import { createContext, useContext, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { CalendarDays, FlaskConical, BookOpen, LineChart, Calculator, Settings, Sparkles, ScanLine } from "lucide-react";
import { Button } from "@/components/kit";
import { CalculatorModal } from "@/components/CalculatorModal";
import { VialLabelModal } from "@/components/VialLabelModal";

const TABS = [
  { to: "/", label: "Today", icon: CalendarDays },
  { to: "/protocols", label: "Protocols", icon: FlaskConical },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/library", label: "Library", icon: BookOpen },
] as const;

const CalculatorContext = createContext<(() => void) | null>(null);
const LabelContext = createContext<(() => void) | null>(null);

export function useOpenCalculator() {
  return useContext(CalculatorContext);
}

export function useOpenLabelScanner() {
  return useContext(LabelContext);
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  return (
    <CalculatorContext.Provider value={() => setOpen(true)}>
      <LabelContext.Provider value={() => setLabelOpen(true)}>
        {children}
        <CalculatorModal open={open} onClose={() => setOpen(false)} />
        <VialLabelModal open={labelOpen} onClose={() => setLabelOpen(false)} />
      </LabelContext.Provider>
    </CalculatorContext.Provider>
  );
}

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-[520px]">
        {TABS.map((t) => {
          const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to} className="flex-1">
              <Link
                to={t.to}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[10px] tracking-wide",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-[20px]" strokeWidth={1.25} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Screen({
  title,
  eyebrow,
  right,
  children,
  hideTabs,
  back,
}: {
  title?: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  hideTabs?: boolean;
  back?: { to: string; label: string };
}) {
  return (
    <div className="mx-auto min-h-screen max-w-[520px] bg-background">
      <div className="pt-[env(safe-area-inset-top)]">
        {(title || back) && (
          <header className="page-x pt-6 pb-4">
            {back && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                to={back.to as any}
                className="mb-3 inline-block text-[13px] text-muted-foreground"
              >
                ← {back.label}
              </Link>
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
                {title && <h1 className="text-[28px] font-semibold leading-tight">{title}</h1>}
              </div>
              {right && <div className="flex shrink-0 items-center gap-1 pt-1">{right}</div>}
            </div>
          </header>
        )}
        <main className={cn("pb-[120px]", hideTabs && "pb-[env(safe-area-inset-bottom)]")}>
          {children}
        </main>
      </div>
      {!hideTabs && <TabBar />}
    </div>
  );
}

export function HeaderActions() {
  const openCalculator = useOpenCalculator();
  const openLabelScanner = useOpenLabelScanner();
  return (
    <>
      <Link to="/assistant" aria-label="AI assistant" className="p-2">
        <Sparkles className="size-[19px]" strokeWidth={1.25} />
      </Link>
      <Button variant="quiet" aria-label="Calculator" title="Calculator" onClick={() => openCalculator?.()} className="min-h-0 p-2 no-underline">
        <Calculator className="size-[19px]" strokeWidth={1.25} />
      </Button>
      <Button variant="quiet" aria-label="Scan vial label" title="Scan vial label" onClick={() => openLabelScanner?.()} className="min-h-0 p-2 no-underline">
        <ScanLine className="size-[19px]" strokeWidth={1.25} />
      </Button>
      <Link to="/settings" aria-label="Settings" className="p-2">
        <Settings className="size-[19px]" strokeWidth={1.25} />
      </Link>
    </>
  );
}
