/** Dataset status → what a reviewer reads. "in_progress" = submitted and waiting for its reviewer. */
export const DATASET_STATUS = {
  draft: 'Draft', submitted: 'Waiting for review', in_progress: 'Waiting for review', approved: 'Approved',
  rejected: 'Rejected', archived: 'Archived',
}
export const WAITING = ['submitted', 'in_progress']
