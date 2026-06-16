import { Link, type LinkProps } from 'react-router-dom'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'

export function GuardedLink({ to, onClick, ...props }: LinkProps) {
  const { isDirty, requestNavigation } = useUnsavedChanges()

  return (
    <Link
      {...props}
      to={to}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || !isDirty) {
          return
        }

        event.preventDefault()
        const target = typeof to === 'string' ? to : `${to.pathname ?? ''}${to.search ?? ''}`
        requestNavigation(target)
      }}
    />
  )
}
