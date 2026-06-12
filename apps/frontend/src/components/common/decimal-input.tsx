import { ComponentPropsWithoutRef, FocusEvent } from 'react'
import { Input } from '@/components/ui/input'

type DecimalInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'type' | 'step'>

export function DecimalInput({ onFocus, ...props }: DecimalInputProps) {
  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    if (event.currentTarget.value === '0' || event.currentTarget.value === '0.00') {
      event.currentTarget.value = ''
    }

    onFocus?.(event)
  }

  return <Input type="number" step="0.01" onFocus={handleFocus} {...props} />
}
