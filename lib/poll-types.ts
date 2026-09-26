import type { NameCandidate } from './names';

export type PollCandidate = Pick<NameCandidate, 'hangul' | 'romanization' | 'syllables'>;
export type NamePoll = {
  id: string; candidates: (PollCandidate & { votes: number })[];
  expiresAt: number; myVote: string | null;
};
export const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function publicPollCandidate(candidate: NameCandidate): PollCandidate {
  return { hangul: candidate.hangul, romanization: candidate.romanization, syllables: candidate.syllables };
}
