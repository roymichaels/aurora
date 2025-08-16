import React, { useEffect, useRef, useState } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ViewHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export default function ViewHeader({ title, description, className }: ViewHeaderProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [inDialog, setInDialog] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (el && el.closest('[role="dialog"]')) {
      setInDialog(true);
    }
  }, []);

  if (inDialog) {
    return (
      <DialogHeader className={className}>
        <DialogTitle ref={titleRef}>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
    );
  }

  return (
    <header className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
      <h1 ref={titleRef} className="text-lg font-semibold leading-none tracking-tight">
        {title}
      </h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}

