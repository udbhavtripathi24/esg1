/**
 * React Query hooks for datasets/versions/files. Same pattern as
 * useAssignments.js / useCompanies.js.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDatasets, createDataset, getDatasetVersions, createDatasetVersion,
  submitDatasetVersion, uploadDatasetFile, getUploadTypes, getDepartments, getSites,
} from '../api/datasets.js'

export function useDatasets(params = {}) {
  return useQuery({
    queryKey: ['datasets', params],
    queryFn: () => getDatasets(params),
  })
}

export function useCreateDataset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    },
  })
}

export function useDatasetVersions(publicId, options = {}) {
  return useQuery({
    queryKey: ['dataset-versions', publicId],
    queryFn: () => getDatasetVersions(publicId),
    enabled: options.enabled !== undefined ? options.enabled : !!publicId,
  })
}

/** Only for the "new version after a terminal one" case — not the normal flow. */
export function useCreateDatasetVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (publicId) => createDatasetVersion(publicId),
    onSuccess: (_data, publicId) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['dataset-versions', publicId] })
    },
  })
}

export function useSubmitDatasetVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ publicId, versionPublicId }) => submitDatasetVersion(publicId, versionPublicId),
    onSuccess: (_data, { publicId }) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['dataset-versions', publicId] })
    },
  })
}

export function useUploadDatasetFile() {
  return useMutation({
    // No query invalidation here — file upload alone doesn't change a
    // dataset's list-visible fields (status/etc.), and the caller
    // orchestrates create→upload→[submit] as a single flow, invalidating
    // once at the end via useCreateDataset/useSubmitDatasetVersion.
    mutationFn: ({ publicId, versionPublicId, file, role }) =>
      uploadDatasetFile(publicId, versionPublicId, file, role),
  })
}

/** Real Deloitte roles rarely change — long staleTime. */
export function useUploadTypes() {
  return useQuery({
    queryKey: ['upload-types'],
    queryFn: getUploadTypes,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDepartments(params = {}, options = {}) {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: () => getDepartments(params),
    enabled: options.enabled !== undefined ? options.enabled : true,
  })
}

export function useSites(params = {}, options = {}) {
  return useQuery({
    queryKey: ['sites', params],
    queryFn: () => getSites(params),
    enabled: options.enabled !== undefined ? options.enabled : true,
  })
}
