// content/voice.js
// Simplified Push-To-Talk helper using Web Speech API
import logger from "../lib/logger.js";

(function(){
  let rec = null;
  function startPTT(onFinal){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { logger.warn('SpeechRecognition unsupported'); return () => {}; }
    rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang='en-US';
    rec.onresult = (e)=>{
      let t = '';
      for (const r of e.results) t += r[0].transcript + ' ';
      if (e.results[0].isFinal) onFinal?.(t.trim());
    };
    rec.start();
    return () => { try { rec.stop(); } catch{} };
  }
  window.__AURORA_VOICE__ = { startPTT };
})();
