import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/surveys.js'

const keys = {
  list: (companyId) => ['surveys', 'list', companyId || 'own'],
  templates: (companyId) => ['surveys', 'templates', companyId || 'own'],
  one: (id) => ['surveys', 'one', id],
  audience: (id) => ['surveys', 'audience', id],
  results: (id, group) => ['surveys', 'results', id, group || 'all'],
  responses: (id) => ['surveys', 'responses', id],
  response: (id, rid) => ['surveys', 'response', id, rid],
  mine: ['surveys', 'mine'],
}

export function useSurveyList(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: keys.list(companyId), queryFn: () => api.listSurveys(companyId), enabled })
}

export function useTemplates(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: keys.templates(companyId), queryFn: () => api.listTemplates(companyId), enabled })
}

export function useTemplate(id, companyId) {
  return useQuery({ queryKey: ['surveys', 'template', id], queryFn: () => api.getTemplate(id, companyId),
    enabled: !!id, staleTime: 5 * 60_000 })
}

export function useSurvey(id) {
  return useQuery({ queryKey: keys.one(id), queryFn: () => api.getSurvey(id), enabled: !!id,
    refetchOnWindowFocus: false })
}

export function useAudience(id, { enabled = true } = {}) {
  return useQuery({ queryKey: keys.audience(id), queryFn: () => api.getAudience(id), enabled: !!id && enabled })
}

export function useResults(id, group, { enabled = true } = {}) {
  return useQuery({ queryKey: keys.results(id, group), queryFn: () => api.getResults(id, group),
    enabled: !!id && enabled })
}

export function useResponses(id, { enabled = true } = {}) {
  return useQuery({ queryKey: keys.responses(id), queryFn: () => api.listResponses(id), enabled: !!id && enabled })
}

export function useResponse(id, rid) {
  return useQuery({ queryKey: keys.response(id, rid), queryFn: () => api.getResponse(id, rid), enabled: !!id && !!rid })
}

export function useMySurveys({ enabled = true } = {}) {
  return useQuery({ queryKey: keys.mine, queryFn: api.mySurveys, enabled })
}

function useInvalidate() {
  const qc = useQueryClient()
  return (id) => {
    qc.invalidateQueries({ queryKey: ['surveys', 'list'] })
    if (id) {
      qc.invalidateQueries({ queryKey: keys.audience(id) })
      qc.invalidateQueries({ queryKey: ['surveys', 'results', id] })
    }
  }
}

export function useCreateSurvey() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: api.createSurvey, onSuccess: () => inv() })
}

/** Saves and writes the server's copy straight into the cache (revision included). */
export function useUpdateSurvey(id) {
  const qc = useQueryClient()
  const inv = useInvalidate()
  return useMutation({
    mutationFn: (body) => api.updateSurvey(id, body),
    onSuccess: (data) => { qc.setQueryData(keys.one(id), data); inv(id) },
  })
}

export function useSurveyAction(id) {
  const qc = useQueryClient()
  const inv = useInvalidate()
  return useMutation({
    mutationFn: ({ action, body }) => api.surveyAction(id, action, body),
    onSuccess: (data, { action }) => {
      if (action !== 'duplicate' && action !== 'save-as-template') qc.setQueryData(keys.one(id), data)
      if (action === 'save-as-template') qc.invalidateQueries({ queryKey: ['surveys', 'templates'] })
      inv(id)
      qc.invalidateQueries({ queryKey: keys.mine })
    },
  })
}

export function useDeleteSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteSurvey,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveys', 'list'] }); qc.invalidateQueries({ queryKey: ['surveys', 'templates'] }) },
  })
}

export function usePublicLink(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ enabled, regenerate }) => api.setPublicLink(id, enabled, regenerate),
    onSuccess: (data) => { qc.setQueryData(keys.one(id), data); qc.invalidateQueries({ queryKey: ['surveys', 'list'] }) },
  })
}

function useAudienceMutation(id, fn) {
  const inv = useInvalidate()
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => { inv(id); qc.invalidateQueries({ queryKey: keys.one(id) }) } })
}

export const useAddInvites = (id) => useAudienceMutation(id, (body) => api.addInvites(id, body))
export const useRemoveInvite = (id) => useAudienceMutation(id, (inviteId) => api.removeInvite(id, inviteId))
export const useRenewLinks = (id) => useAudienceMutation(id, (inviteIds) => api.renewLinks(id, inviteIds))
export const useRemind = (id) => useAudienceMutation(id, () => api.remind(id))
