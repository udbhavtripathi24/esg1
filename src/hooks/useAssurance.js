/**
 * React Query hooks for assurance engagements. Every engagement mutation
 * returns the full, updated engagement, which replaces the cached copy, so
 * the screen always shows exactly what the backend stored.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/assurance.js'

const K = {
  list: ['assurance', 'list'],
  one: (id) => ['assurance', 'engagement', id],
}

export function useEngagements() {
  return useQuery({ queryKey: K.list, queryFn: api.listEngagements })
}

export function useEngagement(id) {
  return useQuery({ queryKey: K.one(id), queryFn: () => api.getEngagement(id), enabled: !!id })
}

export function useCandidates(id, enabled) {
  return useQuery({ queryKey: ['assurance', 'candidates', id], queryFn: () => api.getCandidates(id), enabled: !!id && enabled })
}

export function useAssurerSection(id, code) {
  return useQuery({
    queryKey: ['assurance', 'section', id, code],
    queryFn: () => api.getAssurerSection(id, code),
    enabled: !!id && !!code,
  })
}

/** A mutation whose result is the updated engagement. */
function useEngagementMutation(id, fn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (data?.public_id) qc.setQueryData(K.one(data.public_id), data)
      qc.invalidateQueries({ queryKey: K.list })
      qc.invalidateQueries({ queryKey: ['assurance', 'candidates', id] })
    },
  })
}

export function useCreateEngagement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createEngagement,
    onSuccess: (data) => {
      qc.setQueryData(K.one(data.public_id), data)
      qc.invalidateQueries({ queryKey: K.list })
    },
  })
}

export function useAssuranceActions(id) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: K.one(id) })
  return {
    withdraw: useEngagementMutation(id, (reason) => api.withdrawEngagement(id, reason)),
    addMember: useEngagementMutation(id, ({ userId, role }) => api.addMember(id, userId, role)),
    removeMember: useEngagementMutation(id, (userId) => api.removeMember(id, userId)),
    declare: useEngagementMutation(id, () => api.declareIndependence(id)),
    start: useEngagementMutation(id, () => api.startFieldwork(id)),
    prepare: useEngagementMutation(id, ({ code, procedures, conclusion }) => api.prepareItem(id, code, procedures, conclusion)),
    review: useEngagementMutation(id, ({ code, decision, note }) => api.reviewItem(id, code, decision, note)),
    raiseRequest: useEngagementMutation(id, (body) => api.raiseRequest(id, body)),
    respondRequest: useEngagementMutation(id, ({ rid, response }) => api.respondRequest(id, rid, response)),
    closeRequest: useEngagementMutation(id, ({ rid, decision, note }) => api.closeRequest(id, rid, decision, note)),
    raiseFinding: useEngagementMutation(id, (body) => api.raiseFinding(id, body)),
    respondFinding: useEngagementMutation(id, ({ fid, response }) => api.respondFinding(id, fid, response)),
    resolveFinding: useEngagementMutation(id, ({ fid, outcome, note }) => api.resolveFinding(id, fid, outcome, note)),
    clearEqr: useEngagementMutation(id, (note) => api.clearEqr(id, note)),
    sign: useEngagementMutation(id, (body) => api.signEngagement(id, body)),
    uploadRequestEvidence: useMutation({
      mutationFn: ({ rid, file, description }) => api.uploadRequestEvidence(id, rid, file, description),
      onSuccess: refresh,
    }),
  }
}

/** Evidence on a BRSR section (the preparer's side). */
export function useSectionEvidence(setId, code) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['brsr', 'section', setId, code] })
  return {
    upload: useMutation({
      mutationFn: ({ file, questionId, description }) => api.uploadSectionEvidence(setId, code, file, { questionId, description }),
      onSuccess: refresh,
    }),
    withdraw: useMutation({ mutationFn: (evId) => api.withdrawEvidence(setId, evId), onSuccess: refresh }),
  }
}
