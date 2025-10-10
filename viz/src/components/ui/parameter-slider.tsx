import { useState } from 'react';

interface ParameterSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  description?: string;
  onChange?: (value: number) => void;
}

export function ParameterSlider({
  label,
  min,
  max,
  step = 1,
  defaultValue,
  unit = "",
  description,
  onChange
}: ParameterSliderProps) {
  const [value, setValue] = useState(defaultValue || min);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-4">
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <label className="font-medium text-foreground">{label}</label>
          <span className="font-bold text-blue-600">
            {value}{unit}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}
