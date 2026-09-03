/**
 * React Query hooks for reviews/comments. Same pattern as useDatasets.js.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignReview, getReviews, decideReview, createComment, getComments } from '../api/reviews.js'

export function useReviews(datasetPublicId, versionPublicId, options = {}) {
  return useQuery({
    queryKey: ['reviews', datasetPublicId, versionPublicId],
    queryFn: () => getReviews(datasetPublicId, versionPublicId),
    enabled: options.enabled !== undefined ? options.enabled : !!(datasetPublicId && versionPublicId),
  })
}

export function useAssignReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ datasetPublicId, versionPublicId, reviewerUserId, tier }) =>
      assignReview(datasetPublicId, versionPublicId, reviewerUserId, tier),
    onSuccess: (_data, { datasetPublicId, versionPublicId }) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['dataset-versions', datasetPublicId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', datasetPublicId, versionPublicId] })
    },
  })
}

export function useDecideReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ datasetPublicId, versionPublicId, reviewPublicId, decision, note }) =>
      decideReview(datasetPublicId, versionPublicId, reviewPublicId, decision, note),
    onSuccess: (_data, { datasetPublicId, versionPublicId }) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['dataset-versions', datasetPublicId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', datasetPublicId, versionPublicId] })
    },
  })
}

export function useComments(datasetPublicId, versionPublicId, options = {}) {
  return useQuery({
    queryKey: ['comments', datasetPublicId, versionPublicId],
    queryFn: () => getComments(datasetPublicId, versionPublicId),
    enabled: options.enabled !== undefined ? options.enabled : !!(datasetPublicId && versionPublicId),
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ datasetPublicId, versionPublicId, body }) =>
      createComment(datasetPublicId, versionPublicId, body),
    onSuccess: (_data, { datasetPublicId, versionPublicId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', datasetPublicId, versionPublicId] })
    },
  })
}
