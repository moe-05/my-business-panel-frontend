type BadgeVariant =
  | "accent"
  | "green"
  | "yellow"
  | "red"
  | "gray"
  | "blue"
  | "success"
  | "secondary";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  accent: "bg-accent-100 text-accent-700 border border-accent-600",
  green: "bg-emerald-100 text-emerald-700 border border-emerald-600",
  yellow: "bg-amber-100 text-amber-700 border border-amber-600",
  red: "bg-red-100 text-red-600 border border-red-600",
  gray: "bg-gray-100 text-gray-600 border border-gray-600",
  blue: "bg-blue-100 text-blue-700 border border-blue-600",
  success: "bg-emerald-100 text-emerald-700 border border-emerald-600",
  secondary: "bg-gray-100 text-gray-700 border border-gray-600",
};

export function Badge({
  children,
  variant = "gray",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium min-w-20 ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ roleId }: { roleId: number }) {
  const config: Record<number, { label: string; variant: BadgeVariant }> = {
    4: { label: "Superusuario", variant: "accent" },
    3: { label: "Administrador", variant: "blue" },
    2: { label: "Gerente", variant: "yellow" },
    1: { label: "Empleado", variant: "gray" },
  };
  const { label, variant } = config[roleId] ?? {
    label: `Rol ${roleId}`,
    variant: "gray",
  };
  return <Badge variant={variant}>{label}</Badge>;
}

export function SubscriptionBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "green" : "red"}>
      {active ? "Activa" : "Inactiva"}
    </Badge>
  );
}
