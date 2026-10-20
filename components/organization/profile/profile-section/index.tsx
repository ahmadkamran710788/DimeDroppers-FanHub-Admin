import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import Button from "@/components/common/button";

interface ProfileSectionProps {
  icon: ReactNode;
  title: string;
  onEdit: () => void;
  children: ReactNode;
}

// Read-only card on the Profile page: icon + title, an Edit button, and the saved values.
export default function ProfileSection({ icon, title, onEdit, children }: ProfileSectionProps) {
  return (
    <section className="rounded-[8px] p-5 lg:p-6 flex flex-col gap-4 backdrop-blur-[48px] bg-surface-07">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="size-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white">
            {icon}
          </span>
          <h3 className="font-display font-black text-xl lg:text-2xl text-white leading-tight truncate">{title}</h3>
        </div>
        <Button
          variant="outline"
          label="Edit"
          icon={<Pencil className="size-4" />}
          onClick={onEdit}
          className="h-10 min-w-0 px-4 text-sm shrink-0"
        />
      </div>
      {children}
    </section>
  );
}
