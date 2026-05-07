import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "../../lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center h-7",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 rounded-md flex items-center justify-center transition-colors absolute left-1"
        ),
        button_next: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 rounded-md flex items-center justify-center transition-colors absolute right-1"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md transition-all flex items-center justify-center w-full h-full"
        ),
        range_start: "bg-orange-600 text-white rounded-l-md",
        range_end: "bg-orange-600 text-white rounded-r-md",
        range_middle: "aria-selected:bg-orange-50 aria-selected:text-orange-900",
        selected: "bg-orange-600 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-600 focus:text-white",
        today: "bg-slate-100 text-slate-900 font-bold",
        outside: "day-outside text-slate-400 opacity-50 aria-selected:bg-orange-50/50 aria-selected:text-slate-400 aria-selected:opacity-30",
        disabled: "text-slate-400 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
