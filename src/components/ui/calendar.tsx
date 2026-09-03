"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayPicker, type DayButton } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full max-w-full bg-background p-1 sm:p-2", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: "w-full max-w-full",
        months: "flex flex-col w-full",
        month: "flex flex-col w-full gap-3",
        nav: "flex items-center justify-between w-full relative",
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 shrink-0"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 shrink-0"
        ),
        month_caption: "flex items-center justify-center h-8 w-full",
        dropdowns: "w-full flex items-center justify-center h-8 gap-1.5 text-sm font-medium",
        caption_label: "select-none font-medium text-sm",
        table: "w-full border-collapse",
        weekdays: "grid grid-cols-7 w-full",
        weekday:
          "text-muted-foreground text-[0.7rem] sm:text-[0.8rem] font-normal text-center select-none py-1",
        weeks: "flex flex-col w-full gap-1",
        week: "grid grid-cols-7 w-full",
        day: "relative p-0 text-center aspect-square min-w-0",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn("w-full max-w-full overflow-hidden", className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />
          }
          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />
          }
          return <ChevronDownIcon className={cn("size-4", className)} {...props} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      className={cn(
        "h-9 w-full min-w-0 p-0 font-normal aspect-square leading-none",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
