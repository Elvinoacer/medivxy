import {
  Activity,
  Apple,
  Baby,
  BriefcaseMedical,
  Citrus,
  Droplets,
  FileText,
  FlaskConical,
  Hand,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Package,
  Phone,
  Pill,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Smile,
  Sparkles,
  Sun,
  Tablets,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Activity,
  Apple,
  Baby,
  BriefcaseMedical,
  Citrus,
  Droplets,
  FileText,
  FlaskConical,
  Hand,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Package,
  Phone,
  Pill,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Smile,
  Sparkles,
  Sun,
  Tablets,
  Thermometer,
  Wind,
};

const CATEGORY_STYLES: Record<string, string> = {
  Medicines: "bg-primary/10 text-primary",
  Wellness: "bg-honey-soft/60 text-honey",
  "Baby Care": "bg-accent text-accent-foreground",
  "Personal Care": "bg-mint text-mint-foreground",
  "Medical Supplies": "bg-secondary text-secondary-foreground",
};

export function ProductIcon({
  name,
  category,
  className,
}: {
  name: string;
  category?: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Pill;
  return (
    <span
      role="img"
      aria-label={`${name.replace(/([A-Z])/g, " $1").trim()} icon`}
      className={cn(
        "flex size-12 items-center justify-center rounded-2xl",
        category ? CATEGORY_STYLES[category] ?? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary",
        className
      )}
    >
      <Icon aria-hidden="true" className="size-6" />
    </span>
  );
}
