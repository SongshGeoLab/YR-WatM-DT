import { useState, useEffect } from 'react';

interface ParameterSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number | null;
  unit?: string;
  description?: string;
  onChange?: (value: number | null) => void;
  disabled?: boolean;
  allowAny?: boolean; // New prop to enable "Any" option
}

export function ParameterSlider({
  label,
  min,
  max,
  step = 1,
  defaultValue,
  unit = "",
  description,
  onChange,
  disabled = false,
  allowAny = false
}: ParameterSliderProps) {
  const [value, setValue] = useState<number | null>(defaultValue ?? (allowAny ? null : min));
  const [isAny, setIsAny] = useState(defaultValue === null && allowAny);

  // Update internal state when defaultValue changes
  useEffect(() => {
    if (defaultValue !== undefined) {
      setValue(defaultValue);
      setIsAny(defaultValue === null && allowAny);
    }
  }, [defaultValue, allowAny]);

  const handleChange = (newValue: number) => {
    if (disabled) return;
    setValue(newValue);
    setIsAny(false);
    onChange?.(newValue);
  };

  const handleAnyToggle = () => {
    if (disabled || !allowAny) return;
    const newIsAny = !isAny;
    setIsAny(newIsAny);
    if (newIsAny) {
      onChange?.(null);
    } else {
      const fallbackValue = defaultValue ?? min;
      setValue(fallbackValue);
      onChange?.(fallbackValue);
    }
  };

  return (
    <div className="bg-card rounded-lg border-2 border-dashed border-border p-2">
      <div className="mb-1">
        <div className="flex justify-between items-center mb-1">
          <label className="font-medium text-foreground">{label}</label>
          <div className="flex items-center gap-2">
            {allowAny && (
              <button
                onClick={handleAnyToggle}
                disabled={disabled}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isAny
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Any
              </button>
            )}
            <span className="font-bold text-blue-600">
              {isAny ? 'Any' : `${value}${unit}`}
            </span>
          </div>
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
          value={isAny ? min : value || min}
          disabled={disabled || isAny}
          onChange={(e) => handleChange(Number(e.target.value))}
          className={`w-full h-2 bg-muted rounded-lg appearance-none ${
            disabled || isAny
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer'
          } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:${
            disabled || isAny ? 'bg-gray-400' : 'bg-blue-600'
          } [&::-webkit-slider-thumb]:${
            disabled || isAny ? 'cursor-not-allowed' : 'cursor-pointer'
          } [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:${
            disabled || isAny ? 'bg-gray-400' : 'bg-blue-600'
          } [&::-moz-range-thumb]:${
            disabled || isAny ? 'cursor-not-allowed' : 'cursor-pointer'
          } [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md`}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-0">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}
