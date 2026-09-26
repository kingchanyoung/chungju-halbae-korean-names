import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Beta Privacy | Chungju Halbae Names',
  description: 'How the Korean name beta handles your answers, result link, and feedback.',
};

export default function BetaPrivacy() {
  return <main className="names-site beta-info-page">
    <header className="site-header"><a className="brand" href="/"><span><strong lang="ko">충주 할배</strong><small>· GWIMUN SAJU ·</small></span></a></header>
    <article className="beta-info-card">
      <p className="eyebrow">OPEN BETA</p>
      <h1>Your answers and privacy</h1>
      <p>This beta is free. You do not need an account or a credit card.</p>
      <h2>What we save</h2>
      <p>To make a result link, we save your given name, pronunciation hint, meaning note, style and focus choices, your selected name impression and the aggregate usage basis for an automatic recommendation, any names or syllables you asked us to avoid, the calculated birth-chart summary, and the suggested names. We do not save your exact birth date, birth time, or birthplace time zone. We use those details to calculate the summary when you submit the form.</p>
      <h2>Name cards and your surname</h2>
      <p>Your optional surname preview is stored only in this browser, not in our result database or shared result link. A downloaded name card includes the chosen Korean name, available Hanja spelling, and the surname preview you selected, but excludes your original given name, birth chart, personal note, exclusions, and result link. Your printable personal story may include your note, chart summary, and names or syllables you asked us to avoid. People with your full private link can read those saved preferences; check them before sharing. Files you save on your device remain until you delete them.</p>
      <h2>Friend-vote links</h2>
      <p>The browser that created a result can make a separate poll with two or three names. We save only the shortlisted Hangul names and Roman spellings in that poll. A person with its full link can see those names and vote counts, but cannot see your original name, chart, meaning note, surname preference, or private result key. A poll expires with its source result. Closing the poll, or deleting the source result, also removes its votes.</p>
      <p>To keep one vote per browser, we store a random identifier for that poll in the voter&apos;s browser. In the database we keep a one-way keyed hash of that identifier, scoped to the poll, together with the selected Korean name. We do not ask voters for a name or email. This does not verify a person&apos;s identity; clearing browser storage can allow another vote. Expired polls and votes are cleared with their source result as new results are created.</p>
      <h2>Your private link</h2>
      <p>Your result link works for seven days. Anyone with the full link can view your names and the information saved with them, so share it only with people you trust. The browser that created a new result keeps a separate deletion key on your device. From that browser, choose <strong>Delete my result</strong> to remove it immediately. People you share the link with cannot delete it. If you clear that browser&apos;s storage, email us with your result link to request deletion. The link stops working after seven days. Expired records may remain in our database until the next result is created.</p>
      <h2>Feedback</h2>
      <p>If you send beta feedback, we save your rating, the Korean name you selected, and any comment. We do not attach your original name or birth chart to that feedback. Please do not include personal details in your comment. Feedback older than 30 days is cleared as new results are created.</p>
      <h2>Keeping the beta available</h2>
      <p>We temporarily use a one-way hash of your IP address to limit repeated requests. We do not save the plain IP address in the beta database. Old limit records are cleared as new requests arrive.</p>
      <h2>Questions or a deletion request?</h2>
      <p>Email <a href="mailto:shj2331@chansworld.co.kr?subject=Korean%20name%20beta">shj2331@chansworld.co.kr</a>. Include only the information needed to explain the issue. This beta does not take payments.</p>
      <a className="beta-back" href="/">← Back to the name finder</a>
    </article>
  </main>;
}
