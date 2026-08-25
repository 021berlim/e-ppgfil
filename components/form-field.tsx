'use client'

import type React from 'react'
import { Children, isValidElement } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const inputBase =
  'w-full min-w-0 max-w-full rounded-xl border border-input bg-card px-4 h-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/12 box-border'

export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0 w-full', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-foreground leading-snug truncate">
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>}
      </label>
      <div className="w-full min-w-0">{children}</div>
      {hint && !error && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      {error && (
        <p className="text-xs font-bold text-destructive leading-relaxed" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function TextInput(props: React.ComponentProps<'input'>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

export function TextArea(props: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full min-w-0 max-w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/12 box-border min-h-28 resize-y',
        props.className,
      )}
    />
  )
}

export function Select({
  children,
  value,
  defaultValue,
  onChange,
  id,
  name,
  disabled,
  required,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: React.ComponentProps<'select'>) {
  const opcoes = Children.toArray(children)
    .filter(isValidElement)
    .map((elemento) => {
      const opcao = elemento as React.ReactElement<React.ComponentProps<'option'>>
      return {
        value: String(opcao.props.value ?? ''),
        label: opcao.props.children,
        disabled: opcao.props.disabled ?? false,
      }
    })

  function handleValueChange(novoValor: string | null) {
    if (!onChange) return
    const target = { value: novoValor ?? '', name: name ?? '', id: id ?? '' }
    onChange({ target, currentTarget: target } as unknown as React.ChangeEvent<HTMLSelectElement>)
  }

  return (
    <BaseSelect.Root
      value={value === undefined ? undefined : String(value)}
      defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
      onValueChange={handleValueChange}
      name={name}
      disabled={disabled}
      required={required}
      items={opcoes.map((opcao) => ({ value: opcao.value, label: opcao.label }))}
    >
      <BaseSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={cn(
          inputBase,
          'flex cursor-pointer items-center justify-between gap-2.5 bg-card text-left shadow-xs box-border data-[popup-open]:border-primary data-[popup-open]:ring-4 data-[popup-open]:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-55',
          className,
        )}
      >
        <BaseSelect.Value className="min-w-0 flex-1 truncate block text-left text-sm font-semibold text-foreground" />
        <BaseSelect.Icon className="shrink-0 text-primary transition-transform duration-150 data-[popup-open]:rotate-180">
          <ChevronDown className="size-4" aria-hidden="true" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={6}
          align="start"
          className="z-[110]"
          alignItemWithTrigger={false}
        >
          <BaseSelect.Popup className="w-[var(--anchor-width)] min-w-[min(100vw-2rem,22rem)] max-w-[calc(100vw-2rem)] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-border bg-card p-1.5 text-foreground shadow-xl transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <BaseSelect.List className="max-h-64 overflow-y-auto overscroll-contain">
              {opcoes.map((opcao) => (
                <BaseSelect.Item
                  key={opcao.value}
                  value={opcao.value}
                  disabled={opcao.disabled}
                  className="flex cursor-pointer select-none items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 data-[highlighted]:bg-secondary data-[selected]:font-bold data-[selected]:text-primary"
                >
                  <BaseSelect.ItemText className="min-w-0 flex-1 truncate">
                    {opcao.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="shrink-0 text-primary">
                    <Check className="size-4" aria-hidden="true" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
