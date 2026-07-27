import { screen, fireEvent } from '@testing-library/react';
import { render, initializeMocks } from '../testUtils';
import RaterCertificationAnalyticsPage from './RaterCertificationAnalyticsPage';
import {
  useEnrolledLearners, useLearnerXblocks, useLearnerSubmissions, useResetLearnerAttempt,
} from './data/apiHooks';
import { downloadCsv } from './csvExport';
import messages from './messages';

jest.mock('./data/apiHooks');
jest.mock('./csvExport', () => ({
  ...jest.requireActual('./csvExport'),
  downloadCsv: jest.fn(),
}));

const courseId = 'course-v1:org+course+run';

const queryResult = (overrides = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  ...overrides,
});

const selectLearner = (userId) => {
  fireEvent.change(screen.getByLabelText(messages.selectLearnerLabel.defaultMessage), {
    target: { value: String(userId) },
  });
};

describe('RaterCertificationAnalyticsPage', () => {
  let mutate;

  beforeEach(() => {
    initializeMocks();
    mutate = jest.fn();
    downloadCsv.mockClear();
    useLearnerXblocks.mockReturnValue(queryResult());
    useLearnerSubmissions.mockReturnValue(queryResult());
    useResetLearnerAttempt.mockReturnValue({ mutate, isLoading: false });
  });

  it('shows a message when no learners are enrolled', () => {
    useEnrolledLearners.mockReturnValue(queryResult({ data: [] }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);

    expect(screen.getByText(messages.noLearnersEnrolled.defaultMessage)).toBeVisible();
  });

  it('lets staff pick an enrolled learner and auto-selects their only unit', () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{
        usageId: 'block-v1:usage1',
        displayName: 'Rater Unit',
        attempt: { status: 'certified', videosCompleted: 5 },
      }],
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    expect(screen.getByText(messages.selectXblockLabel.defaultMessage)).toBeVisible();
    expect(screen.getByText('Rater Unit (certified)')).toBeInTheDocument();
  });

  it("shows a unit's not-started status for a learner with no attempt on it", () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: null }],
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    expect(screen.getByText(`Rater Unit (${messages.xblockStatusNotStarted.defaultMessage})`)).toBeInTheDocument();
  });

  it('shows the attempt summary and submission table once a unit is selected', () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{
        usageId: 'block-v1:usage1',
        displayName: 'Rater Unit',
        attempt: { status: 'certified', videosCompleted: 5 },
      }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [{
          status: 'certified',
          videosCompleted: 5,
          dimensionsPassed: 4,
          dimensionsTotal: 4,
          attemptNumber: 1,
          certifiedAt: '2026-07-01',
          isReset: false,
          canReset: false,
        }],
        submissions: [{
          videoId: 'video-1',
          dimension: 'Culture',
          userScore: 5,
          expertScore: 5,
          agreementResult: 'pass',
          feedbackShown: 'Nice work.',
          attemptNumber: 1,
          submittedAt: '2026-07-01',
        }],
      },
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    // The status summary is a merged text block (label + value inline), so
    // check the page's overall text rather than an isolated text node.
    expect(screen.getByText('Attempt 1')).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/Status:\s*certified/);
    expect(screen.getByText('video-1')).toBeInTheDocument();
    expect(screen.getByText('Nice work.')).toBeInTheDocument();
  });

  it('groups submissions into separate attempt sections when a learner has been reset', () => {
    // RaterScoreSubmission rows are never deleted on a reset - a learner
    // with attemptNumber 2 has submissions from both attempt 1 and attempt
    // 2 in the same flat list, which must render as two separate headed
    // tables rather than one mixed table.
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: { status: 'in_progress' } }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [
          {
            status: 'certified',
            videosCompleted: 5,
            dimensionsPassed: 4,
            dimensionsTotal: 4,
            attemptNumber: 1,
            certifiedAt: '2026-07-01',
            isReset: true,
            canReset: false,
          },
          {
            status: 'in_progress',
            videosCompleted: 1,
            dimensionsPassed: 0,
            dimensionsTotal: 4,
            attemptNumber: 2,
            certifiedAt: null,
            isReset: false,
            canReset: false,
          },
        ],
        submissions: [
          {
            videoId: 'video-1',
            dimension: 'Culture',
            userScore: 5,
            expertScore: 5,
            agreementResult: 'pass',
            feedbackShown: 'Nice work.',
            attemptNumber: 1,
            submittedAt: '2026-07-01',
          },
          {
            videoId: 'video-2',
            dimension: 'Culture',
            userScore: 5,
            expertScore: 5,
            agreementResult: 'pass',
            feedbackShown: 'Nice work.',
            attemptNumber: 2,
            submittedAt: '2026-07-02',
          },
        ],
      },
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    expect(screen.getByText('Attempt 1')).toBeInTheDocument();
    expect(screen.getByText('Attempt 2')).toBeInTheDocument();
    expect(screen.getByText('video-1')).toBeInTheDocument();
    expect(screen.getByText('video-2')).toBeInTheDocument();
    // Attempt 1 was superseded by the reset that created attempt 2.
    expect(screen.getByText(messages.attemptWasReset.defaultMessage)).toBeInTheDocument();
  });

  it('shows "cannot reset now" on the current attempt once the one allowed reset is used up', () => {
    // attemptNumber 2 is itself the latest (isReset: false), but canReset is
    // false too because the cap (RESET_ATTEMPTS_ALLOWED=1) has been used -
    // this must show explanatory text, not just silently hide the button.
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: { status: 'in_progress' } }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [{
          status: 'in_progress', attemptNumber: 2, isReset: false, canReset: false,
        }],
        submissions: [],
      },
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    expect(screen.getByText(messages.attemptCannotResetNow.defaultMessage)).toBeInTheDocument();
    expect(screen.queryByText(messages.resetButtonLabel.defaultMessage)).not.toBeInTheDocument();
  });

  it('hides the reset button when the backend says canReset is false', () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: { status: 'certified' } }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [{
          status: 'certified', attemptNumber: 1, isReset: false, canReset: false,
        }],
        submissions: [],
      },
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    expect(screen.queryByText(messages.resetButtonLabel.defaultMessage)).not.toBeInTheDocument();
  });

  it('confirms before resetting, and calls the mutation on confirm', () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: { status: 'certified' } }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [{
          status: 'certified', attemptNumber: 1, isReset: false, canReset: true,
        }],
        submissions: [],
      },
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    fireEvent.click(screen.getByText(messages.resetButtonLabel.defaultMessage));
    expect(screen.getByText(messages.resetModalTitle.defaultMessage)).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(messages.resetModalConfirm.defaultMessage));
    expect(mutate).toHaveBeenCalled();
  });

  it('surfaces the specific backend error when a reset is refused (e.g. limit already used)', () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: { status: 'certified' } }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [{
          status: 'certified', attemptNumber: 1, isReset: false, canReset: true,
        }],
        submissions: [],
      },
    }));
    const backendError = 'This learner has already used their one allowed reset for block-v1:usage1.';
    mutate = jest.fn((_variables, { onError }) => onError({ response: { data: { error: backendError } } }));
    useResetLearnerAttempt.mockReturnValue({ mutate, isLoading: false });

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);
    fireEvent.click(screen.getByText(messages.resetButtonLabel.defaultMessage));
    fireEvent.click(screen.getByText(messages.resetModalConfirm.defaultMessage));

    expect(screen.getByText(backendError)).toBeInTheDocument();
  });

  it('shows a persistent Download Report button even when reset is not available', () => {
    // Unlike Reset (which disappears once the one allowed reset is used, or
    // is otherwise unavailable), Download Report must stay visible - it's a
    // read-only export, not a state-changing action.
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: { status: 'certified' } }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [{
          status: 'certified', attemptNumber: 1, isReset: false, canReset: false,
        }],
        submissions: [],
      },
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    expect(screen.queryByText(messages.resetButtonLabel.defaultMessage)).not.toBeInTheDocument();
    expect(screen.getByText(messages.downloadReportButtonLabel.defaultMessage)).toBeInTheDocument();
  });

  it('does not show Download Report before the learner has any attempt on the unit', () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: null }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({ data: { attempts: [], submissions: [] } }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);

    expect(screen.queryByText(messages.downloadReportButtonLabel.defaultMessage)).not.toBeInTheDocument();
  });

  it('downloads a CSV report of every attempt and submission when clicked', () => {
    useEnrolledLearners.mockReturnValue(queryResult({
      data: [{ userId: 1, username: 'alice', email: 'alice@example.com' }],
    }));
    useLearnerXblocks.mockReturnValue(queryResult({
      data: [{ usageId: 'block-v1:usage1', displayName: 'Rater Unit', attempt: { status: 'certified' } }],
    }));
    useLearnerSubmissions.mockReturnValue(queryResult({
      data: {
        attempts: [{
          status: 'certified', videosCompleted: 5, dimensionsPassed: 4, dimensionsTotal: 4, attemptNumber: 1, certifiedAt: '2026-07-01', isReset: false, canReset: false,
        }],
        submissions: [{
          videoId: 'video-1', dimension: 'Culture', userScore: 5, expertScore: 5, agreementResult: 'pass', feedbackShown: 'Nice work.', attemptNumber: 1, submittedAt: '2026-07-01',
        }],
      },
    }));

    render(<RaterCertificationAnalyticsPage courseId={courseId} />);
    selectLearner(1);
    fireEvent.click(screen.getByText(messages.downloadReportButtonLabel.defaultMessage));

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [csvContent, filename] = downloadCsv.mock.calls[0];
    expect(csvContent).toContain('alice');
    expect(csvContent).toContain('video-1');
    expect(filename).toBe('rater-certification_alice_block-v1:usage1.csv');
  });
});
