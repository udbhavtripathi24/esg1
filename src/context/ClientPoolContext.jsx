import { createContext, useContext, useState } from 'react'
import { clientPool as clientPoolSeed } from '../data/mockData'

const ClientPoolContext = createContext(null)

export function ClientPoolProvider({ children }) {
  const [clientPool, setClientPool] = useState(clientPoolSeed)

  function addClient(client) {
    setClientPool((prev) => [client, ...prev])
  }

  return (
    <ClientPoolContext.Provider value={{ clientPool, addClient }}>
      {children}
    </ClientPoolContext.Provider>
  )
}

export function useClientPool() {
  const ctx = useContext(ClientPoolContext)
  if (!ctx) throw new Error('useClientPool must be used within ClientPoolProvider')
  return ctx
}
