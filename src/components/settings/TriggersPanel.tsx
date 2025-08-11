import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TriggerDelivery } from "@/lib/triggers";

// Panel for configuring task trigger preferences.
export default function TriggersPanel() {
  const [delivery, setDelivery] = useLocalStorage<TriggerDelivery>("settings.triggerDelivery", "notification");

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Task Triggers</h2>
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <Label htmlFor="trigger-delivery">Default delivery</Label>
        <Select value={delivery} onValueChange={(v) => setDelivery(v as TriggerDelivery)}>
          <SelectTrigger id="trigger-delivery">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="notification">Browser notification</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        Overdue tasks will use this delivery method.
      </p>
    </div>
  );
}
