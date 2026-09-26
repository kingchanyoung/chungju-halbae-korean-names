export async function pronounceKorean(hangul: string): Promise<string | null> {
  if (!('speechSynthesis' in window)) return 'Audio is not available in this browser.';
  if (!window.speechSynthesis.getVoices().length) await new Promise<void>(resolve => {
    const done = () => { clearTimeout(timer); window.speechSynthesis.removeEventListener('voiceschanged', done); resolve(); };
    const timer = setTimeout(done, 1000);
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
  });
  const voice = window.speechSynthesis.getVoices().find(item => /^ko(?:-|_)/i.test(item.lang));
  if (!voice) return 'A Korean voice is not available on this device. Check its speech settings or ask a Korean speaker for pronunciation.';
  const speech = new SpeechSynthesisUtterance(hangul);
  speech.voice = voice; speech.lang = 'ko-KR'; speech.rate = .8;
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(speech);
  return null;
}
