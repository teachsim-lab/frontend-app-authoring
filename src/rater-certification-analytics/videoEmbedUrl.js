import { getConfig } from '@edx/frontend-platform';

// Same "xblocks/v2/<usage_key>/embed/student_view/" REST view the
// learner-facing player already uses (see library_service.py in
// video-rater-xblock) - lets staff jump straight to the video a submission
// row is about instead of only seeing its raw usage key. Shared by the
// on-screen DataTable link cell and the downloadable CSV report so the two
// can't drift apart.
const getVideoEmbedUrl = (videoId) => `${getConfig().LMS_BASE_URL}/xblocks/v2/${videoId}/embed/student_view/`;

export default getVideoEmbedUrl;
