type InputProps = React.ComponentProps<'input'>

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none ${className}`}
      {...props}
    />
  )
}
