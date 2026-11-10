import { useMutation, useQuery } from '@tanstack/react-query'
import * as api from '../api/ai.js'

export const useAiStatus = () => useQuery({ queryKey: ['ai', 'status'], queryFn: api.getAiStatus, staleTime: 60_000 })
export const useAiAnalyze = (companyId) => useMutation({ mutationFn: (body) => api.aiAnalyze(body, companyId) })
export const useAiAsk = (companyId) => useMutation({ mutationFn: (body) => api.aiAsk(body, companyId) })
export const useAiReview = () => useMutation({ mutationFn: ({ ds, v }) => api.aiReview(ds, v) })
export const useAiWrite = () => useMutation({ mutationFn: api.aiWrite })
