import type { PipelineStatus } from './types';

export type CandidateAction =
  | 'VIEW_PROFILE'
  | 'SHORTLIST'
  | 'REJECT'
  | 'MESSAGE'
  | 'MOVE_TO_INTERVIEW'
  | 'SCHEDULE_INTERVIEW'
  | 'HIRE'
  | 'RESTORE_TO_IN_REVIEW';

export function actionsForStatus(status: PipelineStatus): CandidateAction[] {
  switch (status) {
    case 'NEW':
      return ['VIEW_PROFILE', 'SHORTLIST', 'REJECT'];
    case 'IN_REVIEW':
      return ['SHORTLIST', 'REJECT', 'MESSAGE'];
    case 'SHORTLISTED':
      return ['MOVE_TO_INTERVIEW', 'REJECT', 'VIEW_PROFILE'];
    case 'INTERVIEW':
      return ['HIRE', 'REJECT', 'SCHEDULE_INTERVIEW'];
    case 'HIRED':
      return ['VIEW_PROFILE'];
    case 'REJECTED':
      return ['VIEW_PROFILE', 'RESTORE_TO_IN_REVIEW'];
  }
}

export function actionToNextStatus(action: CandidateAction): PipelineStatus | null {
  switch (action) {
    case 'SHORTLIST':
      return 'SHORTLISTED';
    case 'MOVE_TO_INTERVIEW':
      return 'INTERVIEW';
    case 'HIRE':
      return 'HIRED';
    case 'REJECT':
      return 'REJECTED';
    case 'RESTORE_TO_IN_REVIEW':
      return 'IN_REVIEW';
    case 'VIEW_PROFILE':
    case 'MESSAGE':
    case 'SCHEDULE_INTERVIEW':
      return null;
  }
}

export function allowedStatusesForSelect(current: PipelineStatus): PipelineStatus[] {
  // Safe UX assumption:
  // - Dropdown is kept for quick moves, but constrained to transitions
  //   available via contextual actions. Confirmations still apply in UI.
  switch (current) {
    case 'NEW':
      return ['NEW', 'SHORTLISTED', 'REJECTED'];
    case 'IN_REVIEW':
      return ['IN_REVIEW', 'SHORTLISTED', 'REJECTED'];
    case 'SHORTLISTED':
      return ['SHORTLISTED', 'INTERVIEW', 'REJECTED'];
    case 'INTERVIEW':
      return ['INTERVIEW', 'HIRED', 'REJECTED'];
    case 'REJECTED':
      return ['REJECTED', 'IN_REVIEW'];
    case 'HIRED':
      return ['HIRED'];
  }
}

export function actionI18nKey(action: CandidateAction): string {
  // Under namespace: EmployerApplications
  switch (action) {
    case 'VIEW_PROFILE':
      return 'actions.viewProfile';
    case 'SHORTLIST':
      return 'actions.shortlist';
    case 'REJECT':
      return 'actions.reject';
    case 'MESSAGE':
      return 'actions.message';
    case 'MOVE_TO_INTERVIEW':
      return 'actions.moveToInterview';
    case 'SCHEDULE_INTERVIEW':
      return 'actions.scheduleInterview';
    case 'HIRE':
      return 'actions.hire';
    case 'RESTORE_TO_IN_REVIEW':
      return 'actions.restoreToInReview';
  }
}

