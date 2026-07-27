import { buildLearnerReportCsv, downloadCsv } from './csvExport';

jest.mock('./videoEmbedUrl', () => ({
  __esModule: true,
  default: (videoId) => `https://lms.example.com/xblocks/v2/${videoId}/embed/student_view/`,
}));

describe('buildLearnerReportCsv', () => {
  const learner = { username: 'alice', email: 'alice@example.com' };
  const xblockDisplayName = 'Rater Unit';

  it('includes the learner, unit, attempt summaries, and submissions', () => {
    const csv = buildLearnerReportCsv({
      learner,
      xblockDisplayName,
      attempts: [{
        attemptNumber: 1,
        status: 'certified',
        videosCompleted: 5,
        dimensionsPassed: 4,
        dimensionsTotal: 4,
        certifiedAt: '2026-07-01',
        isReset: false,
      }],
      submissions: [{
        attemptNumber: 1,
        videoId: 'video-1',
        dimension: 'Culture',
        userScore: 5,
        expertScore: 5,
        agreementResult: 'pass',
        feedbackShown: 'Nice work.',
        submittedAt: '2026-07-01',
      }],
    });

    expect(csv).toContain('Learner,alice (alice@example.com)');
    expect(csv).toContain('Unit,Rater Unit');
    expect(csv).toContain('1,certified,5,4,4,2026-07-01,No');
    // The Video column is an =HYPERLINK(...) formula (see videoLinkFormula),
    // not the raw video id, so Google Sheets/Excel render it as a real
    // clickable link on import rather than plain text.
    expect(csv).toContain('=HYPERLINK(""https://lms.example.com/xblocks/v2/video-1/embed/student_view/"", ""video-1"")');
    expect(csv).toContain(',Culture,5,5,pass,Nice work.,2026-07-01');
  });

  it('marks an earlier attempt as superseded once a reset created a later one', () => {
    const csv = buildLearnerReportCsv({
      learner,
      xblockDisplayName,
      attempts: [
        {
          attemptNumber: 1, status: 'certified', videosCompleted: 5, dimensionsPassed: 4, dimensionsTotal: 4, certifiedAt: '2026-07-01', isReset: true,
        },
        {
          attemptNumber: 2, status: 'in_progress', videosCompleted: 1, dimensionsPassed: 0, dimensionsTotal: 4, certifiedAt: null, isReset: false,
        },
      ],
      submissions: [],
    });

    expect(csv).toContain('1,certified,5,4,4,2026-07-01,Yes');
    expect(csv).toContain('2,in_progress,1,0,4,,No');
  });

  it('escapes fields containing commas, quotes, or newlines', () => {
    const csv = buildLearnerReportCsv({
      learner,
      xblockDisplayName,
      attempts: [],
      submissions: [{
        attemptNumber: 1,
        videoId: 'video-1',
        dimension: 'Culture',
        userScore: 5,
        expertScore: 5,
        agreementResult: 'pass',
        feedbackShown: 'Great, "excellent" work.\nKeep it up.',
        submittedAt: '2026-07-01',
      }],
    });

    expect(csv).toContain('"Great, ""excellent"" work.\nKeep it up."');
  });

  it('renders a null expertScore and missing certifiedAt as blank, not the literal word null', () => {
    const csv = buildLearnerReportCsv({
      learner,
      xblockDisplayName,
      attempts: [{
        attemptNumber: 1, status: 'not_on_track', videosCompleted: 5, dimensionsPassed: 1, dimensionsTotal: 4, certifiedAt: null, isReset: false,
      }],
      submissions: [{
        attemptNumber: 1, videoId: 'video-1', dimension: 'Culture', userScore: 5, expertScore: null, agreementResult: 'pass', feedbackShown: '', submittedAt: '2026-07-01',
      }],
    });

    expect(csv).not.toMatch(/null/);
    expect(csv).toContain('1,not_on_track,5,1,4,,No');
    expect(csv).toContain(',Culture,5,,pass,,2026-07-01');
  });

  it('renders the video as an =HYPERLINK(...) formula pointing at the embed view, not plain text', () => {
    const csv = buildLearnerReportCsv({
      learner,
      xblockDisplayName,
      attempts: [],
      submissions: [{
        attemptNumber: 1, videoId: 'video-1', dimension: 'Culture', userScore: 5, expertScore: 5, agreementResult: 'pass', feedbackShown: '', submittedAt: '2026-07-01',
      }],
    });

    // The whole formula field contains commas and quotes, so toCsvRow wraps
    // it in an outer pair of quotes and doubles the formula's own internal
    // quotes - this is what a real spreadsheet app unescapes back down to
    // the plain =HYPERLINK("url", "text") formula on import.
    expect(csv).toContain('"=HYPERLINK(""https://lms.example.com/xblocks/v2/video-1/embed/student_view/"", ""video-1"")"');
  });
});

describe('downloadCsv', () => {
  it('creates an object URL, triggers a download via a temporary anchor, and revokes the URL', () => {
    const createObjectURL = jest.fn(() => 'blob:mock-url');
    const revokeObjectURL = jest.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = clickSpy;
      }
      return element;
    });

    downloadCsv('a,b,c', 'report.csv');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    document.createElement.mockRestore();
  });
});
