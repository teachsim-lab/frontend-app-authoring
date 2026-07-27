import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  headingTitle: {
    id: 'course-authoring.rater-certification-analytics.heading.title',
    defaultMessage: 'Rater Certification Analytics',
    description: 'Title for the Rater Certification Analytics page',
  },
  headingSubtitle: {
    id: 'course-authoring.rater-certification-analytics.heading.subtitle',
    defaultMessage: 'Tools',
    description: 'Subtitle (breadcrumb) for the Rater Certification Analytics page',
  },
  loading: {
    id: 'course-authoring.rater-certification-analytics.loading',
    defaultMessage: 'Loading',
    description: 'Screen-reader text for a loading spinner',
  },
  noLearnersEnrolled: {
    id: 'course-authoring.rater-certification-analytics.no-learners-enrolled',
    defaultMessage: 'No learners are enrolled in this course.',
    description: 'Shown when the course has no active enrollments',
  },
  selectLearnerLabel: {
    id: 'course-authoring.rater-certification-analytics.select-learner.label',
    defaultMessage: 'Learner',
    description: 'Label for the enrolled-learner picker',
  },
  selectLearnerPlaceholder: {
    id: 'course-authoring.rater-certification-analytics.select-learner.placeholder',
    defaultMessage: '-- Select a learner --',
    description: 'Placeholder option for the enrolled-learner picker',
  },
  noXblocksFound: {
    id: 'course-authoring.rater-certification-analytics.no-xblocks-found',
    defaultMessage: 'This course does not have a Rater Certification XBlock.',
    description: 'Shown when a course has no rater-certification xblock instances',
  },
  selectXblockLabel: {
    id: 'course-authoring.rater-certification-analytics.select-xblock.label',
    defaultMessage: 'Rater Certification unit',
    description: 'Label for the xblock-instance picker - a course can have more than one, e.g. two units each carrying a 50% subsection weight',
  },
  selectXblockPlaceholder: {
    id: 'course-authoring.rater-certification-analytics.select-xblock.placeholder',
    defaultMessage: '-- Select a unit --',
    description: 'Placeholder option for the xblock-instance picker',
  },
  xblockStatusNotStarted: {
    id: 'course-authoring.rater-certification-analytics.xblock-status.not-started',
    defaultMessage: 'not started',
    description: "Shown next to a unit this learner hasn't attempted yet",
  },
  statusLabel: {
    id: 'course-authoring.rater-certification-analytics.status.label',
    defaultMessage: 'Status',
    description: 'Label for the certification status summary',
  },
  videosCompletedLabel: {
    id: 'course-authoring.rater-certification-analytics.videos-completed.label',
    defaultMessage: 'Videos completed',
    description: 'Label for the videos-completed summary',
  },
  dimensionsPassedLabel: {
    id: 'course-authoring.rater-certification-analytics.dimensions-passed.label',
    defaultMessage: 'Dimensions passed',
    description: 'Label for the dimensions-passed summary',
  },
  certifiedAtLabel: {
    id: 'course-authoring.rater-certification-analytics.certified-at.label',
    defaultMessage: 'Certified at',
    description: 'Label for the certified-at summary',
  },
  attemptHeading: {
    id: 'course-authoring.rater-certification-analytics.attempt-heading',
    defaultMessage: 'Attempt {attemptNumber}',
    description: 'Heading above each attempt-group of the submissions table',
  },
  attemptWasReset: {
    id: 'course-authoring.rater-certification-analytics.attempt-was-reset',
    defaultMessage: 'Reset by an instructor',
    description: 'Shown on an attempt that was later superseded by a staff reset',
  },
  attemptCannotResetNow: {
    id: 'course-authoring.rater-certification-analytics.attempt-cannot-reset-now',
    defaultMessage: 'Cannot reset now',
    description: 'Shown on the current attempt when it can no longer be reset (e.g. the one allowed reset was already used)',
  },
  noAttemptYet: {
    id: 'course-authoring.rater-certification-analytics.no-attempt-yet',
    defaultMessage: 'This learner has not started this unit yet.',
    description: 'Shown when the selected learner has no attempt for the selected unit',
  },
  columnVideo: {
    id: 'course-authoring.rater-certification-analytics.column.video',
    defaultMessage: 'Video',
    description: 'Submission table column header',
  },
  columnDimension: {
    id: 'course-authoring.rater-certification-analytics.column.dimension',
    defaultMessage: 'Dimension',
    description: 'Submission table column header',
  },
  columnUserScore: {
    id: 'course-authoring.rater-certification-analytics.column.user-score',
    defaultMessage: 'Learner score',
    description: 'Submission table column header',
  },
  columnExpertScore: {
    id: 'course-authoring.rater-certification-analytics.column.expert-score',
    defaultMessage: 'Expert score',
    description: 'Submission table column header',
  },
  columnResult: {
    id: 'course-authoring.rater-certification-analytics.column.result',
    defaultMessage: 'Result',
    description: 'Submission table column header',
  },
  columnFeedback: {
    id: 'course-authoring.rater-certification-analytics.column.feedback',
    defaultMessage: 'Feedback shown',
    description: 'Submission table column header',
  },
  columnSubmittedAt: {
    id: 'course-authoring.rater-certification-analytics.column.submitted-at',
    defaultMessage: 'Submitted at',
    description: 'Submission table column header',
  },
  resetButtonLabel: {
    id: 'course-authoring.rater-certification-analytics.reset.button-label',
    defaultMessage: 'Reset attempt',
    description: 'Button that opens the reset-confirmation modal',
  },
  downloadReportButtonLabel: {
    id: 'course-authoring.rater-certification-analytics.download-report.button-label',
    defaultMessage: 'Download report',
    description: 'Button that downloads a CSV of this learner\'s full attempt/submission history for this unit - unlike Reset, always available regardless of whether the one allowed reset has been used',
  },
  resetModalTitle: {
    id: 'course-authoring.rater-certification-analytics.reset.modal-title',
    defaultMessage: 'Reset this learner’s attempt?',
    description: 'Title of the reset-confirmation modal',
  },
  resetModalBody: {
    id: 'course-authoring.rater-certification-analytics.reset.modal-body',
    defaultMessage: 'This clears {username}’s progress on this unit so they can retake it from the beginning - their assigned videos, submitted scores, and certification status are all cleared, and their course grade for this unit resets to zero until they complete it again. Their previous score history is kept for audit purposes and is not affected.',
    description: 'Body text of the reset-confirmation modal',
  },
  resetModalCancel: {
    id: 'course-authoring.rater-certification-analytics.reset.modal-cancel',
    defaultMessage: 'Cancel',
    description: 'Cancel button in the reset-confirmation modal',
  },
  resetModalConfirm: {
    id: 'course-authoring.rater-certification-analytics.reset.modal-confirm',
    defaultMessage: 'Yes, reset attempt',
    description: 'Confirm button in the reset-confirmation modal',
  },
  resetSuccess: {
    id: 'course-authoring.rater-certification-analytics.reset.success',
    defaultMessage: 'This learner’s attempt has been reset.',
    description: 'Shown after a successful reset',
  },
  resetError: {
    id: 'course-authoring.rater-certification-analytics.reset.error',
    defaultMessage: 'Could not reset this attempt. Please try again.',
    description: 'Shown when the reset request fails',
  },
});

export default messages;
