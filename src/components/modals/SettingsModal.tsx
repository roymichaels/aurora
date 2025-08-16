// @ts-ignore
import SettingsPanel from "../../../frontend/components/SettingsPanel.jsx";
import { useUIStore } from "@/state/ui";

export default function SettingsModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  return <SettingsPanel open onClose={closeModal} />;
}

