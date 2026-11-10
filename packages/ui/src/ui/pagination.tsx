import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";
import { Button, type ButtonProps } from "./button";

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

export function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = ButtonProps & { isActive?: boolean };

export function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <Button
      type="button"
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={className}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, children, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink size="sm" variant="outline" className={cn("gap-1 px-2.5", className)} {...props}>
      <ChevronLeft className="size-4" aria-hidden />
      {children}
    </PaginationLink>
  );
}

export function PaginationNext({ className, children, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink size="sm" variant="outline" className={cn("gap-1 px-2.5", className)} {...props}>
      {children}
      <ChevronRight className="size-4" aria-hidden />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden data-slot="pagination-ellipsis" className={cn("flex size-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="size-4" />
    </span>
  );
}
