import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ className = "" }) {
  return <Loader2 className={`animate-spin text-teal-400 ${className}`} size={40} />;
}
