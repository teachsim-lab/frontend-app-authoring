// Builds a downloadable CSV report for one learner's full history on one
// Rater Certification xblock instance - every attempt's summary (not just
// the latest, since a staff reset creates a new attempt row rather than
// overwriting the previous one - see video_rater_xblock's models.py) plus
// every submission across all of those attempts. Kept separate from the
// page component so the CSV shape itself is unit-testable without needing
// to render/query the DOM.

import getVideoEmbedUrl from './videoEmbedUrl';

const escapeCsvField = (value) => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
};

const toCsvRow = (fields) => fields.map(escapeCsvField).join(',');

// Plain CSV has no concept of a hyperlink, but Google Sheets and Excel both
// recognize and evaluate a cell literally containing an =HYPERLINK(...)
// formula on import - the same trick that makes this show as a real
// clickable link once opened, rather than just the raw video usage key
// (which the on-screen DataTable already renders as a Hyperlink - see
// VideoLinkCell/getVideoEmbedUrl). Doubling internal quotes escapes them
// *within* the formula's own string arguments, separately from - and
// before - the outer, whole-field CSV escaping toCsvRow applies afterwards.
const videoLinkFormula = (videoId) => {
  const escaped = String(videoId).replace(/"/g, '""');
  return `=HYPERLINK("${getVideoEmbedUrl(escaped)}", "${escaped}")`;
};

export const buildLearnerReportCsv = ({
  learner, xblockDisplayName, attempts, submissions,
}) => {
  const lines = [
    toCsvRow(['Learner', `${learner?.username ?? ''} (${learner?.email ?? ''})`]),
    toCsvRow(['Unit', xblockDisplayName ?? '']),
    '',
    'Attempt Summaries',
    toCsvRow([
      'Attempt Number', 'Status', 'Videos Completed', 'Dimensions Passed',
      'Dimensions Total', 'Certified At', 'Superseded By Reset',
    ]),
    ...attempts.map((attempt) => toCsvRow([
      attempt.attemptNumber,
      attempt.status,
      attempt.videosCompleted,
      attempt.dimensionsPassed,
      attempt.dimensionsTotal,
      attempt.certifiedAt ?? '',
      attempt.isReset ? 'Yes' : 'No',
    ])),
    '',
    'Submissions',
    toCsvRow([
      'Attempt Number', 'Video', 'Dimension', 'Learner Score', 'Expert Score',
      'Result', 'Feedback Shown', 'Submitted At',
    ]),
    ...submissions.map((submission) => toCsvRow([
      submission.attemptNumber,
      videoLinkFormula(submission.videoId),
      submission.dimension,
      submission.userScore,
      submission.expertScore ?? '',
      submission.agreementResult,
      submission.feedbackShown,
      submission.submittedAt,
    ])),
  ];
  return lines.join('\n');
};

export const downloadCsv = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  window.URL.revokeObjectURL(url);
};
