import { CookingPot } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <CookingPot size={34} strokeWidth={1.5} />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
