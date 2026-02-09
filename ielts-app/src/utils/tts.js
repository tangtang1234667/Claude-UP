const synth = window.speechSynthesis;

let currentUtterance = null;

export function speak(text, options = {}) {
  stop();
  const { rate = 1, lang = 'en-US', onEnd, onBoundary } = options;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  if (onEnd) utterance.onend = onEnd;
  if (onBoundary) utterance.onboundary = onBoundary;
  currentUtterance = utterance;
  synth.speak(utterance);
  return utterance;
}

export function speakSentence(sentence, options = {}) {
  return speak(sentence, options);
}

export function stop() {
  if (synth.speaking) {
    synth.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking() {
  return synth.speaking;
}
