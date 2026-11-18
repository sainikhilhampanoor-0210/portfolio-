import { documents, retrieve, search, voice } from './engine.mjs';

for (const [title, body] of documents) {
  const li = document.createElement('li');
  li.textContent = title + ' — ' + body;
  document.querySelector('#sources').append(li);
}
const mic = document.querySelector('#mic');
const speak = document.querySelector('#speak');
const status = document.querySelector('#voice-status');
const input = document.querySelector('#voice-input');
let previousOrder;
let reply;
for (const form of document.querySelectorAll('form')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = form.querySelector('input').value.trim();
    const output = form.querySelector('output');
    if (!query) {
      output.textContent = 'Enter a question or search term.';
      return;
    }
    if (form.dataset.mode === 'search') {
      const { trace, answer } = search(query);
      output.textContent = trace + '\n\n' + answer;
    } else if (form.dataset.mode === 'documents') {
      output.textContent = retrieve(query);
    } else {
      const result = voice(query, previousOrder);
      previousOrder = result.orderId ?? previousOrder;
      reply = result.answer;
      output.textContent = reply;
      speak.disabled = !('speechSynthesis' in window);
    }
  });
}

const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  mic.disabled = true;
  status.textContent = 'Microphone input is unavailable in this browser.';
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.onresult = (event) => {
    input.value = event.results[0][0].transcript;
    input.form.requestSubmit();
    status.textContent = '';
  };
  recognition.onerror = () => { status.textContent = 'Could not capture speech. Try typing your message.'; };
  recognition.onend = () => {
    mic.disabled = false;
    if (status.textContent === 'Listening…') status.textContent = 'No speech captured.';
  };
  mic.addEventListener('click', () => {
    try {
      recognition.start();
      mic.disabled = true;
      status.textContent = 'Listening…';
    } catch {
      status.textContent = 'Could not start the microphone.';
    }
  });
}
speak.addEventListener('click', () => {
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
});
