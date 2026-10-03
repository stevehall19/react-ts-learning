type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantStyles: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  ghost: 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700',
  danger:
    'text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700',
}

type ButtonProps = React.ComponentProps<'button'> & {
  variant?: Variant
}

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant]
  return (
    <button
      type={type}
      className={`rounded-lg px-3 py-1.5 font-medium ${styles} ${className}`}
      {...props}
    />
  )
}
