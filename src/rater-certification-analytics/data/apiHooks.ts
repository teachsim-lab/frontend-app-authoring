import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getEnrolledLearners, getLearnerXblocks, getLearnerSubmissions, resetLearnerAttempt,
} from './api';

export const raterCertificationQueryKeys = {
  all: ['raterCertification'],
  enrolledLearners: (courseId?: string) => [...raterCertificationQueryKeys.all, 'enrolledLearners', courseId],
  learnerXblocks: (courseId?: string, userId?: number) => [
    ...raterCertificationQueryKeys.all, 'learnerXblocks', courseId, userId,
  ],
  submissions: (usageId?: string, userId?: number) => [
    ...raterCertificationQueryKeys.all, 'submissions', usageId, userId,
  ],
};

export const useEnrolledLearners = (courseId: string) => useQuery({
  queryKey: raterCertificationQueryKeys.enrolledLearners(courseId),
  queryFn: () => getEnrolledLearners(courseId),
  enabled: !!courseId,
});

export const useLearnerXblocks = (courseId: string, userId?: number) => useQuery({
  queryKey: raterCertificationQueryKeys.learnerXblocks(courseId, userId),
  queryFn: () => getLearnerXblocks(courseId, userId as number),
  enabled: !!courseId && userId !== undefined,
});

export const useLearnerSubmissions = (usageId?: string, userId?: number) => useQuery({
  queryKey: raterCertificationQueryKeys.submissions(usageId, userId),
  queryFn: () => getLearnerSubmissions(usageId as string, userId as number),
  enabled: !!usageId && userId !== undefined,
});

export const useResetLearnerAttempt = (courseId: string, usageId?: string, userId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resetLearnerAttempt(usageId as string, userId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: raterCertificationQueryKeys.submissions(usageId, userId) });
      queryClient.invalidateQueries({ queryKey: raterCertificationQueryKeys.learnerXblocks(courseId, userId) });
    },
  });
};
