import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Free & Future Plans | Chungju Halbae Names' };
export default function Plans() {
  return <main className="names-site beta-info-page">
    <header className="site-header"><a className="brand" href="/" aria-label="Chungju Halbae Names home"><span><strong lang="ko">충주 할배</strong><small>· GWIMUN SAJU ·</small></span></a></header>
    <article className="beta-info-card">
      <p className="eyebrow">CLEAR FROM THE START</p><h1>Explore your name for free.</h1>
      <div className="plan-card"><small>AVAILABLE NOW · OPEN BETA</small><h2>Free</h2><ul><li>Your full set of name suggestions</li><li>Sound, style, and available birth-chart connections</li><li>Basic meanings for checked Hanja spellings</li><li>Korean-voice audio where supported</li><li>Your chosen name story and Korean introduction</li><li>A downloadable name card and printable story</li><li>A private result link valid for seven days</li></ul><p>No account, credit card, or subscription required.</p></div>
      <div className="plan-card future-plan"><small>UNDER CONSIDERATION · NOT FOR SALE</small><h2>Reviewed Hanja story</h2><strong>Proposed US$7.99 · one time</strong><p>A possible future product with a reviewed Hanja pairing, its combined interpretation, and a deeper explanation of why it fits your preferences. It would be available only for names whose content has completed the required review.</p><p>This product is not available yet. Its scope and price may change before launch. Current reports have not been reviewed by a naming expert.</p></div>
      <h2>Planned payment method</h2>
      <p>Bank transfer, with payment confirmed by our team. If the paid product launches, the process will be:</p>
      <ol className="plan-steps"><li>Choose an eligible reviewed story and receive an order number.</li><li>Check the exact price, currency, payment deadline, bank details, and delivery time before sending a transfer.</li><li>Our team checks the received payment and updates your order.</li><li>Open your reviewed story through your private order link.</li></ol>
      <p>No transfer instructions or payment requests are issued during this beta. We will publish the final payment and refund terms before accepting orders.</p>
      <h2>You choose the name.</h2><p>We show all recommendations together. Choosing a name does not create a charge. The current name story and card are free.</p>
      <a className="beta-back" href="/">← Find my Korean name</a>
    </article>
  </main>;
}
