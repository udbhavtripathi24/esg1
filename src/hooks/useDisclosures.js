import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { griApi } from '../api/gri.js'
import { sasbApi } from '../api/sasb.js'

/** GRI and SASB share one workflow; `fw` is 'gri' or 'sasb'. */
const APIS = { gri: griApi, sasb: sasbApi }
const own = (companyId) => companyId || 'own'

export function useDisclosureWorkspace(fw, fy, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: [fw, 'workspace', own(companyId), fy || 'default'],
    queryFn: () => APIS[fw].getWorkspace(fy, companyId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

function useFwMutation(fw, fn) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: [fw] }) })
}

export const useSaveAnswer = (fw, companyId) =>
  useFwMutation(fw, ({ key, body }) => APIS[fw].saveAnswer(key, body, companyId))
export const useSetOwner = (fw, companyId) =>
  useFwMutation(fw, ({ key, body }) => APIS[fw].setOwner(key, body, companyId))
export const useSubmitAnswers = (fw, companyId) =>
  useFwMutation(fw, ({ fy, keys }) => APIS[fw].submitAnswers(fy, keys, companyId))
export const useReviewAnswers = (fw, companyId) =>
  useFwMutation(fw, ({ fy, keys, decision, note }) => APIS[fw].reviewAnswers(fy, keys, decision, note, companyId))
export const useAdoptBrsr = (fw, companyId) =>
  useFwMutation(fw, ({ fy, keys }) => APIS[fw].adoptBrsr(fy, keys, companyId))
