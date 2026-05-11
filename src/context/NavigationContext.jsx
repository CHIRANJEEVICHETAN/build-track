import { createContext, useContext, useMemo } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children, goToPage }) {
  const value = useMemo(() => ({ goToPage }), [goToPage])
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigatePage() {
  const ctx = useContext(NavigationContext)
  if (!ctx) {
    throw new Error('useNavigatePage must be used within NavigationProvider')
  }
  return ctx.goToPage
}
