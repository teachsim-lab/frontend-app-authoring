import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  ActionRow, Alert, AlertModal, Button, Container, DataTable, Hyperlink, Form, Spinner,
} from '@openedx/paragon';

import { useModel } from '../generic/model-store';
import SubHeader from '../generic/sub-header/SubHeader';
import ConnectionErrorAlert from '../generic/ConnectionErrorAlert';
import getPageHeadTitle from '../generic/utils';
import {
  useEnrolledLearners, useLearnerXblocks, useLearnerSubmissions, useResetLearnerAttempt,
} from './data/apiHooks';
import { buildLearnerReportCsv, downloadCsv } from './csvExport';
import getVideoEmbedUrl from './videoEmbedUrl';
import messages from './messages';

// Module-level (not defined inside the page component) so its identity is
// stable across renders - matches the ActiveColumn/TranscriptColumn
// convention used elsewhere in this repo for DataTable custom cells.
const VideoLinkCell = ({ row }) => (
  <Hyperlink destination={getVideoEmbedUrl(row.original.video)} target="_blank">
    {row.original.video}
  </Hyperlink>
);

VideoLinkCell.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      video: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const RaterCertificationAnalyticsPage = ({ courseId }) => {
  const intl = useIntl();
  const courseName = useModel('courseDetails', courseId)?.name;

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUsageId, setSelectedUsageId] = useState('');
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [resetResult, setResetResult] = useState(null); // { variant: 'success' | 'danger', message: string } | null

  const numericUserId = selectedUserId ? Number(selectedUserId) : undefined;

  const {
    data: learners, isLoading: learnersLoading, isError: learnersError,
  } = useEnrolledLearners(courseId);
  const {
    data: xblocks, isLoading: xblocksLoading, isError: xblocksError,
  } = useLearnerXblocks(courseId, numericUserId);
  const {
    data: submissionsData, isLoading: submissionsLoading, isError: submissionsError,
  } = useLearnerSubmissions(selectedUsageId || undefined, numericUserId);
  const resetMutation = useResetLearnerAttempt(courseId, selectedUsageId || undefined, numericUserId);

  // Auto-select the xblock instance if this learner only has one to look at.
  useEffect(() => {
    if (xblocks?.length === 1 && !selectedUsageId) {
      setSelectedUsageId(xblocks[0].usageId);
    }
  }, [xblocks, selectedUsageId]);

  const attempts = submissionsData?.attempts || [];
  const submissions = submissionsData?.submissions || [];
  const selectedLearner = learners?.find((learner) => String(learner.userId) === selectedUserId);
  const selectedXblock = xblocks?.find((xblock) => xblock.usageId === selectedUsageId);

  // A staff reset creates a NEW RaterCertificationAttempt row for the next
  // attempt_number rather than overwriting the previous one (see models.py),
  // so every attempt's own final tally (status/videos completed/dimensions
  // passed) is available here, not just the latest. RaterScoreSubmission
  // rows are similarly never deleted on a reset, so a learner who's been
  // reset once has submissions from both attempts in the same flat list,
  // disambiguated only by attemptNumber. Grouping submissions into a
  // separate table per attempt - each with that attempt's OWN summary line
  // above it - instead of one mixed table makes it obvious which rows and
  // results belong to which attempt.
  const attemptsByNumber = {};
  attempts.forEach((attempt) => { attemptsByNumber[attempt.attemptNumber] = attempt; });
  const submissionsByAttempt = {};
  submissions.forEach((submission) => {
    const key = submission.attemptNumber;
    submissionsByAttempt[key] = submissionsByAttempt[key] || [];
    submissionsByAttempt[key].push(submission);
  });
  const attemptNumbers = [...new Set([
    ...attempts.map((attempt) => attempt.attemptNumber),
    ...Object.keys(submissionsByAttempt).map(Number),
  ])].sort((a, b) => a - b);

  const handleSelectLearner = (e) => {
    setSelectedUserId(e.target.value);
    setSelectedUsageId('');
    setResetResult(null);
  };

  const handleSelectXblock = (e) => {
    setSelectedUsageId(e.target.value);
    setResetResult(null);
  };

  const handleDownloadReport = () => {
    const csvContent = buildLearnerReportCsv({
      learner: selectedLearner, xblockDisplayName: selectedXblock?.displayName, attempts, submissions,
    });
    // Unlike Reset (which disappears once the one allowed reset is used),
    // this stays available indefinitely - it's just a read-only export of
    // whatever's already loaded above, not a state-changing action.
    downloadCsv(csvContent, `rater-certification_${selectedLearner?.username}_${selectedUsageId}.csv`);
  };

  const handleConfirmReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        setResetModalOpen(false);
        setResetResult({ variant: 'success', message: intl.formatMessage(messages.resetSuccess) });
      },
      onError: (error) => {
        setResetModalOpen(false);
        // Surface the specific reason (e.g. "already used their one allowed
        // reset", a 409 from views.reset_learner) when the backend gives
        // one, rather than only ever showing a generic failure message.
        const backendMessage = error?.response?.data?.error;
        setResetResult({ variant: 'danger', message: backendMessage || intl.formatMessage(messages.resetError) });
      },
    });
  };

  return (
    <>
      <Helmet>
        <title>{getPageHeadTitle(courseName, intl.formatMessage(messages.headingTitle))}</title>
      </Helmet>
      <Container size="xl" className="p-4 pt-4.5 min-vh-100">
        <SubHeader
          title={intl.formatMessage(messages.headingTitle)}
          subtitle={intl.formatMessage(messages.headingSubtitle)}
        />

        {learnersError && <ConnectionErrorAlert />}
        {learnersLoading && (
          <Spinner animation="border" screenReaderText={intl.formatMessage(messages.loading)} />
        )}
        {!learnersLoading && !learnersError && !learners?.length && (
          <Alert variant="info">{intl.formatMessage(messages.noLearnersEnrolled)}</Alert>
        )}
        {!!learners?.length && (
          <Form.Group>
            <Form.Label>{intl.formatMessage(messages.selectLearnerLabel)}</Form.Label>
            <Form.Control as="select" value={selectedUserId} onChange={handleSelectLearner}>
              <option value="">{intl.formatMessage(messages.selectLearnerPlaceholder)}</option>
              {learners.map((learner) => (
                <option key={learner.userId} value={learner.userId}>
                  {`${learner.username} (${learner.email})`}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {!!selectedUserId && (
          <>
            {xblocksError && <ConnectionErrorAlert />}
            {xblocksLoading && (
              <Spinner animation="border" screenReaderText={intl.formatMessage(messages.loading)} />
            )}
            {!xblocksLoading && !xblocksError && !xblocks?.length && (
              <Alert variant="info">{intl.formatMessage(messages.noXblocksFound)}</Alert>
            )}
            {/* A course can have more than one Rater Certification unit (e.g.
                two subsections each worth 50%) - show this learner's own
                status on each so staff aren't guessing which one to look at. */}
            {!!xblocks?.length && (
              <Form.Group>
                <Form.Label>{intl.formatMessage(messages.selectXblockLabel)}</Form.Label>
                <Form.Control as="select" value={selectedUsageId} onChange={handleSelectXblock}>
                  <option value="">{intl.formatMessage(messages.selectXblockPlaceholder)}</option>
                  {xblocks.map((xblock) => (
                    <option key={xblock.usageId} value={xblock.usageId}>
                      {`${xblock.displayName} (${
                        xblock.attempt ? xblock.attempt.status : intl.formatMessage(messages.xblockStatusNotStarted)
                      })`}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            )}
          </>
        )}

        {!!selectedUsageId && !!selectedUserId && (
          <>
            {submissionsError && <ConnectionErrorAlert />}
            {submissionsLoading && (
              <Spinner animation="border" screenReaderText={intl.formatMessage(messages.loading)} />
            )}

            {resetResult && (
              <Alert variant={resetResult.variant} dismissible onClose={() => setResetResult(null)}>
                {resetResult.message}
              </Alert>
            )}

            {!submissionsLoading && !attemptNumbers.length && (
              <Alert variant="info">{intl.formatMessage(messages.noAttemptYet)}</Alert>
            )}

            {attemptNumbers.map((attemptNumber) => {
              const attempt = attemptsByNumber[attemptNumber];
              const attemptSubmissions = submissionsByAttempt[attemptNumber] || [];
              return (
                <div key={attemptNumber} className="mt-3">
                  <h3 className="h5">
                    {intl.formatMessage(messages.attemptHeading, { attemptNumber })}
                  </h3>
                  {attempt && (
                    <Alert variant="light">
                      <strong>{intl.formatMessage(messages.statusLabel)}:</strong> {attempt.status}
                      {' · '}
                      <strong>{intl.formatMessage(messages.videosCompletedLabel)}:</strong> {attempt.videosCompleted}
                      {' · '}
                      <strong>{intl.formatMessage(messages.dimensionsPassedLabel)}:</strong>{' '}
                      {attempt.dimensionsPassed} / {attempt.dimensionsTotal}
                      {attempt.certifiedAt && (
                        <>
                          {' · '}
                          <strong>{intl.formatMessage(messages.certifiedAtLabel)}:</strong> {attempt.certifiedAt}
                        </>
                      )}
                      {/* is_reset/can_reset already fold in every reason this
                          attempt can or can't be acted on server-side (see
                          video_rater_xblock/views.py) - just render whichever
                          applies, no client-side cap/permission logic needed. */}
                      {attempt.isReset && (
                        <>
                          {' · '}
                          <strong>{intl.formatMessage(messages.attemptWasReset)}</strong>
                        </>
                      )}
                      {!attempt.isReset && !attempt.canReset && (
                        <>
                          {' · '}
                          <strong>{intl.formatMessage(messages.attemptCannotResetNow)}</strong>
                        </>
                      )}
                    </Alert>
                  )}
                  {!!attemptSubmissions.length && (
                    <DataTable
                      itemCount={attemptSubmissions.length}
                      data={attemptSubmissions.map((submission) => ({
                        video: submission.videoId,
                        dimension: submission.dimension,
                        userScore: submission.userScore,
                        expertScore: submission.expertScore ?? '—',
                        result: submission.agreementResult,
                        feedback: submission.feedbackShown,
                        submittedAt: submission.submittedAt,
                      }))}
                      columns={[
                        {
                          Header: intl.formatMessage(messages.columnVideo),
                          accessor: 'video',
                          Cell: ({ row }) => VideoLinkCell({ row }),
                        },
                        { Header: intl.formatMessage(messages.columnDimension), accessor: 'dimension' },
                        { Header: intl.formatMessage(messages.columnUserScore), accessor: 'userScore' },
                        { Header: intl.formatMessage(messages.columnExpertScore), accessor: 'expertScore' },
                        { Header: intl.formatMessage(messages.columnResult), accessor: 'result' },
                        { Header: intl.formatMessage(messages.columnFeedback), accessor: 'feedback' },
                        { Header: intl.formatMessage(messages.columnSubmittedAt), accessor: 'submittedAt' },
                      ]}
                    >
                      <DataTable.Table />
                    </DataTable>
                  )}
                </div>
              );
            })}

            {/* Reset only ever applies to the latest attempt (canReset is
                only ever true there - see video_rater_xblock/views.py), so
                pulling it out of the per-attempt loop and next to Download
                doesn't change which attempt it acts on. Download covers the
                learner's whole history on this unit - every attempt's
                summary plus every submission - and, unlike Reset (gone once
                the one allowed reset is used), stays available regardless of
                reset state, since it's a read-only export rather than a
                state-changing action. */}
            {!!attemptNumbers.length && (
              <ActionRow className="mt-3">
                <Button variant="primary" onClick={handleDownloadReport}>
                  {intl.formatMessage(messages.downloadReportButtonLabel)}
                </Button>
                {attempts.some((attempt) => attempt.canReset) && (
                  <Button variant="danger" onClick={() => setResetModalOpen(true)}>
                    {intl.formatMessage(messages.resetButtonLabel)}
                  </Button>
                )}
              </ActionRow>
            )}

            <AlertModal
              title={intl.formatMessage(messages.resetModalTitle)}
              isOpen={isResetModalOpen}
              onClose={() => setResetModalOpen(false)}
              footerNode={(
                <ActionRow>
                  <Button variant="tertiary" onClick={() => setResetModalOpen(false)}>
                    {intl.formatMessage(messages.resetModalCancel)}
                  </Button>
                  <Button variant="danger" onClick={handleConfirmReset} disabled={resetMutation.isLoading}>
                    {intl.formatMessage(messages.resetModalConfirm)}
                  </Button>
                </ActionRow>
              )}
            >
              {intl.formatMessage(messages.resetModalBody, { username: selectedLearner?.username })}
            </AlertModal>
          </>
        )}
      </Container>
    </>
  );
};

RaterCertificationAnalyticsPage.propTypes = {
  courseId: PropTypes.string.isRequired,
};

export default RaterCertificationAnalyticsPage;
