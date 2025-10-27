import { List, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventViewToggleProps {
  view: "list" | "calendar";
  onViewChange: (view: "list" | "calendar") => void;
}

export const EventViewToggle = ({ view, onViewChange }: EventViewToggleProps) => {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className="gap-2"
      >
        <List className="h-4 w-4" />
        Lista
      </Button>
      <Button
        variant={view === "calendar" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("calendar")}
        className="gap-2"
      >
        <Calendar className="h-4 w-4" />
        Calendário
      </Button>
    </div>
  );
};
