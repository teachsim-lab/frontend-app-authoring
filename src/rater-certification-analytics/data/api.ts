import { camelCaseObject, getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

// Backed by video_rater_xblock's analytics API - see that package's
// README "Required edx-platform changes" item 6 for the backend side.
//
// The reset endpoint specifically must be called against the LMS host, not
// Studio: it touches lms.djangoapps.grades, which is only installed in the
// LMS process (see that package's apps.py/views.py docstrings). Every other
// endpoint here is mounted in both processes, so calling them via Studio's
// host works fine.
const getStudioApiBaseUrl = () => `${getConfig().STUDIO_BASE_URL}/api/rater-certification`;
const getLmsApiBaseUrl = () => `${getConfig().LMS_BASE_URL}/api/rater-certification`;

export const getEnrolledLearnersUrl = (courseId: string) => (
  `${getStudioApiBaseUrl()}/courses/${courseId}/learners/`
);

export const getLearnerXblocksUrl = (courseId: string, userId: number) => (
  `${getStudioApiBaseUrl()}/courses/${courseId}/learners/${userId}/xblocks/`
);

export const getLearnerSubmissionsUrl = (usageId: string, userId: number) => (
  `${getStudioApiBaseUrl()}/xblocks/${usageId}/learners/${userId}/submissions/`
);

export const getResetLearnerUrl = (usageId: string, userId: number) => (
  `${getLmsApiBaseUrl()}/xblocks/${usageId}/learners/${userId}/reset/`
);

export interface EnrolledLearner {
  userId: number;
  username: string;
  email: string;
}

export interface RaterAttemptSummary {
  userId: number;
  username: string;
  email: string;
  status: string;
  videosCompleted: number;
  dimensionsPassed: number;
  dimensionsTotal: number;
  // 1 = original attempt, 2 = after staff have used their one allowed reset
  // (see video_rater_xblock's analytics_api.RESET_ATTEMPTS_ALLOWED).
  attemptNumber: number;
  certifiedAt: string | null;
  // Only present on getLearnerSubmissions results (a single, per-xblock
  // attempt like the one on LearnerXblock below doesn't carry these - see
  // that package's analytics_api.py module docstring on why there's one row
  // per attempt_number, not one upserted row per learner).
  isReset?: boolean;
  canReset?: boolean;
}

export interface LearnerXblock {
  usageId: string;
  displayName: string;
  // The learner's MOST RECENT attempt on this unit, for the xblock picker's
  // status label - not the full attempt history (see getLearnerSubmissions
  // for that).
  attempt: RaterAttemptSummary | null;
}

export interface RaterSubmission {
  videoId: string;
  dimension: string;
  userScore: number;
  expertScore: number | null;
  agreementResult: string;
  feedbackShown: string;
  // Which attempt this submission belongs to - rows are never deleted on a
  // reset (see models.py's RaterScoreSubmission docstring), so a learner who
  // has been reset once has submissions from both attempt 1 and attempt 2
  // mixed together here, disambiguated only by this field.
  attemptNumber: number;
  submittedAt: string;
}

export interface LearnerSubmissions {
  // Every attempt this learner has made on this xblock instance (not just
  // the latest) - a staff reset creates a new attempt row rather than
  // overwriting the previous one, so an earlier attempt's final tally is a
  // real historical snapshot, not something the next attempt clobbers.
  attempts: RaterAttemptSummary[];
  submissions: RaterSubmission[];
}

export const getEnrolledLearners = async (courseId: string): Promise<EnrolledLearner[]> => {
  const { data } = await getAuthenticatedHttpClient().get(getEnrolledLearnersUrl(courseId));
  return camelCaseObject(data).learners;
};

export const getLearnerXblocks = async (courseId: string, userId: number): Promise<LearnerXblock[]> => {
  const { data } = await getAuthenticatedHttpClient().get(getLearnerXblocksUrl(courseId, userId));
  return camelCaseObject(data).xblocks;
};

export const getLearnerSubmissions = async (
  usageId: string,
  userId: number,
): Promise<LearnerSubmissions> => {
  const { data } = await getAuthenticatedHttpClient().get(getLearnerSubmissionsUrl(usageId, userId));
  return camelCaseObject(data);
};

export const resetLearnerAttempt = async (usageId: string, userId: number): Promise<void> => {
  await getAuthenticatedHttpClient().post(getResetLearnerUrl(usageId, userId));
};
