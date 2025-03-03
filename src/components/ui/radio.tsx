import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  label: string;
  value: string;
}

export interface RadioGroupProps {
  options: string[];
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, options, name, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3", className)}
        {...props}
      >
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={handleChange}
              className="h-4 w-4 border border-input bg-transparent text-primary focus:ring-1 focus:ring-ring"
            />
            <span className="text-sm font-medium">{option}</span>
          </label>
        ))}
      </div>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

export { RadioGroup };