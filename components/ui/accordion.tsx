"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
interface AccordionTriggerProps extends React.ComponentProps<
  typeof AccordionPrimitive.Trigger
> {
  icon?: React.ReactNode;
  iconClassName?: string;
  hideDefaultIcon?: boolean;
}
function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("overflow-hidden rounded-xl bg-card shadow-sm", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  icon,
  iconClassName,
  hideDefaultIcon = false,
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60",
          className,
        )}
        {...props}
      >
        {children}

        {/* Dynamic Custom Icon Or Default Icon */}
        {icon ? (
          <div
            className={cn(
              " .icon shrink-0 transition-transform duration-200",
              iconClassName,
            )}
          >
            {icon}
          </div>
        ) : !hideDefaultIcon ? (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn(
              "default-icon size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              iconClassName,
            )}
          />
        ) : null}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("border-t border-border px-4 py-4", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
