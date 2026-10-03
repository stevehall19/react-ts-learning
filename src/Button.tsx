type Variant = 'primary' | 'secondary' | 'ghost'

const variantStyles: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
}

type ButtonProps = React.ComponentProps<'button'> & {
  variant?: Variant
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant]
  return (
    <button
      className={`rounded-lg px-3 py-1.5 font-medium ${styles} ${className}`}
      {...props}
    />
  )
}
