export function NameReviewStatus({ hasHanja }: { hasHanja: boolean }) {
  return <div className="name-review-status"><span>{hasHanja ? 'Characters & readings checked' : 'Hanja not assigned'}</span><small>Whole-name meaning and expert review: pending</small><a href="/beta-guide#quality-en">What has been checked?</a></div>;
}
