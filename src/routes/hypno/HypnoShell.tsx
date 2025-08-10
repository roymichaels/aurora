import { useNavigate } from "react-router-dom";
import HypnosisRunner from "@/nodes/HypnosisRunner";
import { getNodeById } from "@/data/roadmap";

export default function HypnoShell() {
  const nav = useNavigate();
  const node = getNodeById("hypno-calm-60");
  if (!node) return <div className="p-6">Session unavailable.</div>;
  return <HypnosisRunner node={node} onExit={() => nav("/app")}/>;
}
