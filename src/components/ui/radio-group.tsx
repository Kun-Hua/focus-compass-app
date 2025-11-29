'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupContextValue {
  name?: string;
  selectedValue: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, disabled = false, children, ...props }, ref) => {
    // 內部狀態只在非受控模式下使用
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');

    // 決定目前的值：如果外部傳入了 value (受控模式)，則使用它；否則使用內部狀態。
    const selectedValue = value !== undefined ? value : internalValue;

    const handleChange = (newValue: string) => {
      // 如果不是受控元件，則更新內部狀態
      if (value === undefined) {
        setInternalValue(newValue);
      }
      // 觸發外部的 onValueChange 事件
      onValueChange?.(newValue);
    };

    const contextValue = React.useMemo<RadioGroupContextValue>(() => ({
      name: props.id || 'radio-group',
      selectedValue: selectedValue,
      onChange: handleChange,
      disabled,
    }), [props.id, selectedValue, handleChange, disabled]);

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn('grid gap-2', className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
    value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);

    if (!context) {
      throw new Error('RadioGroupItem must be used within a RadioGroup');
    }

    const { selectedValue, onChange, name, disabled } = context;

    return (
      <input
        ref={ref}
        type="radio"
        name={name}
        value={value}
        checked={selectedValue === value}
        onChange={() => onChange(value)}
        disabled={disabled || props.disabled}
        className={cn(
          'h-4 w-4 shrink-0 cursor-pointer rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
