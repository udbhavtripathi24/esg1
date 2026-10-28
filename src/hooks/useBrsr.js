/**
 * React Query hooks for the BRSR questionnaire. Query keys carry every
 * dimension that changes the result; mutations update or invalidate the
 * cache from the server's response, so the screen always shows what the
 * backend actually stored (revision, computed cells, issues).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuestionBank, listResponseSets, createResponseSet, getResponseSet, getSection, saveAnswers,
  submitSection, withdrawSection, decideSection, reopenSection, getReviewQueue, getAnswerHistory,
  submitQuestions, reviewQuestions, getQuestionQueue, getRoster, putRoster,
} from '../api/brsr.js'

export function useQuestionBank() {
  return useQuery({ queryKey: ['brsr', 'bank'], queryFn: getQuestionBank, staleTime: Infinity })
}

export function useResponseSets(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: ['brsr', 'sets', companyId || 'own'], queryFn: () => listResponseSets(companyId), enabled })
}

export function useResponseSet(setId) {
  return useQuery({ queryKey: ['brsr', 'set', setId], queryFn: () => getResponseSet(setId), enabled: !!setId })
}

export function useSection(setId, code) {
  return useQuery({
    queryKey: ['brsr', 'section', setId, code],
    queryFn: () => getSection(setId, code),
    enabled: !!setId && !!code,
  })
}

export function useCreateResponseSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ financialYear, companyId }) => createResponseSet(financialYear, companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brsr', 'sets'] }),
  })
}

/** Merges a save response into the cached section so revisions, computed
 * cells and issues update without a refetch (and without losing what the
 * user is still typing in other questions). */
export function useSaveAnswers(setId, code) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answers) => saveAnswers(setId, answers),
    onSuccess: (res, sent) => {
      qc.setQueryData(['brsr', 'section', setId, code], (old) => {
        if (!old) return old
        const answers = { ...old.answers }
        for (const [qid, info] of Object.entries(res.answers)) {
          if (!answers[qid]) continue
          answers[qid] = {
            ...answers[qid],
            value: sent[qid]?.value ?? answers[qid].value,
            revision: info.revision,
            computed: info.computed,
            issues: info.issues,
            ...(res.workflow?.[qid] ? { workflow: res.workflow[qid] } : {}),
          }
        }
        return { ...old, answers, report: res.sections?.[code] || old.report }
      })
      // Background refresh for derived flags (answered, hidden groups,
      // missing fields). Every section of the set is invalidated, not just
      // this one: annual data saved here feeds tables in other sections.
      // Only the open section refetches now; the rest refetch when opened.
      // Safe while typing: unsaved edits live in local state.
      qc.invalidateQueries({ queryKey: ['brsr', 'section', setId] })
      qc.invalidateQueries({ queryKey: ['brsr', 'set', setId] })
    },
  })
}

function useSectionAction(fn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      qc.setQueryData(['brsr', 'section', vars.setId, vars.code], data)
      qc.invalidateQueries({ queryKey: ['brsr', 'set', vars.setId] })
      qc.invalidateQueries({ queryKey: ['brsr', 'sets'] })
      qc.invalidateQueries({ queryKey: ['brsr', 'queue'] })
    },
  })
}

export const useSubmitSection = () => useSectionAction(({ setId, code }) => submitSection(setId, code))
export const useWithdrawSection = () => useSectionAction(({ setId, code }) => withdrawSection(setId, code))
export const useReopenSection = () => useSectionAction(({ setId, code, reason }) => reopenSection(setId, code, reason))
export const useDecideSection = () =>
  useSectionAction(({ setId, code, decision, note, questionComments }) =>
    decideSection(setId, code, decision, note, questionComments))

export function useReviewQueue({ enabled = true } = {}) {
  return useQuery({ queryKey: ['brsr', 'queue'], queryFn: getReviewQueue, enabled })
}

export function useAnswerHistory(setId, qid, { enabled = false } = {}) {
  return useQuery({ queryKey: ['brsr', 'history', setId, qid], queryFn: () => getAnswerHistory(setId, qid), enabled })
}

/** Per-question workflow. The server answers with the new states; the
 * section (pending reviews, comments) and the queues are refreshed. */
function useQuestionAction(fn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (states, vars) => {
      qc.setQueryData(['brsr', 'section', vars.setId, vars.code], (old) => {
        if (!old) return old
        const answers = { ...old.answers }
        for (const [qid, st] of Object.entries(states || {})) {
          if (answers[qid]) answers[qid] = { ...answers[qid], workflow: st }
        }
        return { ...old, answers }
      })
      qc.invalidateQueries({ queryKey: ['brsr', 'section', vars.setId] })
      qc.invalidateQueries({ queryKey: ['brsr', 'set', vars.setId] })
      qc.invalidateQueries({ queryKey: ['brsr', 'question-queue'] })
    },
  })
}

export const useSubmitQuestions = () =>
  useQuestionAction(({ setId, questionIds }) => submitQuestions(setId, questionIds))
export const useReviewQuestions = () =>
  useQuestionAction(({ setId, questionIds, decision, note }) => reviewQuestions(setId, questionIds, decision, note))

export function useQuestionQueue({ enabled = true } = {}) {
  return useQuery({ queryKey: ['brsr', 'question-queue'], queryFn: getQuestionQueue, enabled })
}

export function useRoster(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: ['brsr', 'roster', companyId || 'own'], queryFn: () => getRoster(companyId), enabled })
}

export function useSaveRoster(companyId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entries) => putRoster(entries, companyId),
    onSuccess: (data) => {
      qc.setQueryData(['brsr', 'roster', companyId || 'own'], data)
      qc.invalidateQueries({ queryKey: ['brsr', 'section'] })
    },
  })
}
