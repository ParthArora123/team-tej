import {
  Activity,
  BadgeCheck,
  Building2,
  CalendarDays,
  Contact,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Music4,
  QrCode,
  ScanLine,
  Settings2,
  Sparkles,
  Star,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Optional live counter (e.g. pending approvals). */
  badgeKey?: "pendingApprovals";
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

/**
 * Navigation ordered by real operating frequency: daily operations first,
 * workshop management next, then communications, website content and finally
 * one-off configuration. Tab ids are unchanged — this is presentation only.
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Operations",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "approvals", label: "Registrations & payments", icon: Wallet, badgeKey: "pendingApprovals" },
      { id: "attendance", label: "Attendance scanner", icon: ScanLine },
      { id: "scan", label: "Ticket scan", icon: QrCode },
      { id: "students", label: "Participants", icon: Users },
    ],
  },
  {
    title: "Workshops",
    items: [
      { id: "workshops", label: "Workshops", icon: CalendarDays },
      { id: "workshop_hero", label: "Workshop hero", icon: Sparkles },
      { id: "zero_to_hero", label: "Zero to Hero media", icon: GraduationCap },
    ],
  },
  {
    title: "Communication",
    items: [
      { id: "messages", label: "Messages", icon: MessageSquare },
      { id: "whatsapp_template", label: "WhatsApp message", icon: Activity },
    ],
  },
  {
    title: "Website content",
    items: [
      { id: "home_sections", label: "Home sections", icon: LayoutDashboard },
      { id: "hero_portrait", label: "Hero photo", icon: ImageIcon },
      { id: "hero", label: "Hero carousel", icon: ImageIcon },
      { id: "featured", label: "Featured experience", icon: Star },
      { id: "gallery", label: "Gallery", icon: ImageIcon },
      { id: "styles", label: "Dance styles", icon: Music4 },
      { id: "choreographies", label: "Choreographies", icon: Music4 },
      { id: "founder", label: "Founder section", icon: UserRound },
      { id: "profiles", label: "Home profiles", icon: UserRound },
      { id: "celebrities", label: "Celebrities", icon: BadgeCheck },
      { id: "brands", label: "Brands", icon: Building2 },
      { id: "globe", label: "Globe", icon: Globe2 },
      { id: "about_page", label: "About page", icon: Contact },
      { id: "contact_info", label: "Contact info", icon: Contact },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "team", label: "Team roles", icon: Settings2 },
    ],
  },
];

export const adminNavItems = adminNavGroups.flatMap((g) => g.items);

export function adminNavLabel(id: string) {
  return adminNavItems.find((i) => i.id === id)?.label ?? id;
}

export function AdminNav({
  active,
  onSelect,
  counts,
}: {
  active: string;
  onSelect: (id: string) => void;
  counts?: { pendingApprovals?: number };
}) {
  return (
    <nav aria-label="Admin sections" className="space-y-6">
      {adminNavGroups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {group.title}
          </p>
          <ul className="mt-2 space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              const badge = item.badgeKey ? counts?.[item.badgeKey] : undefined;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "opacity-90" : "opacity-60"} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {typeof badge === "number" && badge > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-destructive/12 text-destructive"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
