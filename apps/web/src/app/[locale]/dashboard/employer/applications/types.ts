export const PIPELINE_STATUSES = [
  'NEW',
  'IN_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'HIRED',
  'REJECTED'
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export type StageTranslationKey =
  | 'new'
  | 'inReview'
  | 'shortlisted'
  | 'interview'
  | 'hired'
  | 'rejected';

export type Applicant = {
  id: number;
  name: string;
  roleKey: 'seniorFrontendEngineer' | 'productDesigner' | 'fullstackDeveloper' | 'marketingManager' | 'salesExecutive';
  jobKey: 'seniorFrontendEngineer' | 'productDesigner' | 'fullstackDeveloper' | 'marketingManager' | 'salesExecutive';
  location: string;
  appliedAt: string;
  img: string;
  status: PipelineStatus;
};

export function statusToStageKey(status: PipelineStatus): StageTranslationKey {
  switch (status) {
    case 'NEW':
      return 'new';
    case 'IN_REVIEW':
      return 'inReview';
    case 'SHORTLISTED':
      return 'shortlisted';
    case 'INTERVIEW':
      return 'interview';
    case 'HIRED':
      return 'hired';
    case 'REJECTED':
      return 'rejected';
  }
}

export function statusToBadgeLabel(status: PipelineStatus) {
  // IMPORTANT: We keep status keys in English in state,
  // but pass a human label to StatusBadge (which is already localized).
  switch (status) {
    case 'NEW':
      return 'New';
    case 'IN_REVIEW':
      return 'In Review';
    case 'SHORTLISTED':
      return 'Shortlisted';
    case 'INTERVIEW':
      return 'Interview';
    case 'HIRED':
      return 'Hired';
    case 'REJECTED':
      return 'Rejected';
  }
}

