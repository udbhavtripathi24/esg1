import { useDisclosureWorkspace } from './useDisclosures.js'

/** GRI workspace (the shared disclosure workflow, see ./useDisclosures.js). */
export const useGriWorkspace = (fy, companyId, opts) => useDisclosureWorkspace('gri', fy, companyId, opts)
