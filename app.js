//Hallo das ist JavaScript 


//--//

//--//

//das macht unser project quasi lebendig
// es ist wie organen und muskel in körper




//Für dieses Projekt brauchen wie JS(abkürzung für JavaScript) für unser ai chat und auch damit unser ai die neuesten Daten über Wetter weiss




//HINWEISUNG : Ich benutze gerne ab und zu English :-) weil es mir manchmal mehr angenehm ist.



// ── GEMINI API KEY ──

const GEMINI_PROXY_URL = 'https://glattguide-gemini.ayaan-zurich.workers.dev';





// ── Animation beim Scrollen ──

const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 80);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(element => {
  observer.observe(element);
});


// ── AI CHAT ──

const messagesEl = document.querySelector('#aiMessages');
const inputEl = document.querySelector('#aiInput');

if (!messagesEl || !inputEl) {
  console.warn('AI Chat Elemente wurden nicht gefunden. Prüfe #aiMessages und #aiInput im HTML.');
}


// Koordinaten von Opfikon / Glattbrugg
const LOCAL_LAT = 47.4317;
const LOCAL_LON = 8.5667;


// Ich speichere nur die letzten Nachrichten.
// Sonst wird der Chat für die KI zu lang.
let chatHistory = [];


// Chip Button senden
function sendChip(button) {
  if (!inputEl) return;

  const chipText = button.textContent.trim();
  inputEl.value = chipText;
  sendMessage();
}


// Enter Taste zum Senden
inputEl?.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});


// Nachricht im Chat anzeigen
function appendMsg(role, text) {
  if (!messagesEl) return;

  const msgWrapper = document.createElement('div');
  msgWrapper.className = `msg ${role}`;

  const avatarBox = document.createElement('div');
  avatarBox.className = 'msg-avatar';
  avatarBox.textContent = role === 'ai' ? 'G' : 'Du';

  const msgBubble = document.createElement('div');
  msgBubble.className = 'msg-bubble';
  msgBubble.textContent = text;

  msgWrapper.appendChild(avatarBox);
  msgWrapper.appendChild(msgBubble);

  messagesEl.appendChild(msgWrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return msgWrapper;
}


// Tippanimation anzeigen
function appendTyping() {
  if (!messagesEl) return;

  document.getElementById('typing')?.remove();

  const typingDiv = document.createElement('div');
  typingDiv.className = 'msg ai';
  typingDiv.id = 'typing';

  typingDiv.innerHTML = `
    <div class="msg-avatar">G</div>
    <div class="msg-bubble">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  messagesEl.appendChild(typingDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}


// Wettercode zu normalem Text umwandeln
function weatherCodeToText(code) {
  const map = {
    0: 'klarer Himmel',
    1: 'überwiegend klar',
    2: 'teilweise bewölkt',
    3: 'bewölkt',
    45: 'Nebel',
    48: 'Reifnebel',
    51: 'leichter Nieselregen',
    53: 'Nieselregen',
    55: 'starker Nieselregen',
    56: 'leichter gefrierender Nieselregen',
    57: 'starker gefrierender Nieselregen',
    61: 'leichter Regen',
    63: 'Regen',
    65: 'starker Regen',
    66: 'leichter gefrierender Regen',
    67: 'starker gefrierender Regen',
    71: 'leichter Schneefall',
    73: 'Schneefall',
    75: 'starker Schneefall',
    77: 'Schneekörner',
    80: 'leichte Regenschauer',
    81: 'Regenschauer',
    82: 'starke Regenschauer',
    85: 'leichte Schneeschauer',
    86: 'starke Schneeschauer',
    95: 'Gewitter',
    96: 'Gewitter mit leichtem Hagel',
    99: 'Gewitter mit starkem Hagel'
  };

  return map[code] || 'wechselhaftes Wetter';
}


// Wetterdaten holen
async function getLocalWeatherContext() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LOCAL_LAT}` +
      `&longitude=${LOCAL_LON}` +
      `&current=temperature_2m,precipitation,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,precipitation_probability,weather_code` +
      `&forecast_days=1` +
      `&timezone=Europe%2FZurich`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error('Wetterdienst nicht erreichbar');
    }

    const data = await res.json();

    if (!data.current) {
      return 'Aktuelle Wetterdaten sind momentan nicht verfügbar.';
    }

    const current = data.current;
    const weatherText = weatherCodeToText(current.weather_code);

    let nextRainChance = '';

    if (
      data.hourly &&
      data.hourly.precipitation_probability &&
      data.hourly.time
    ) {
      const currentTime = new Date();

      const currentHourString = currentTime
        .toLocaleString('sv-SE', { timeZone: 'Europe/Zurich' })
        .slice(0, 13);

      let startIndex = data.hourly.time.findIndex(time =>
        time.startsWith(currentHourString)
      );

      if (startIndex === -1) {
        startIndex = 0;
      }

      const nextHours = data.hourly.precipitation_probability
        .slice(startIndex, startIndex + 4)
        .filter(value => value !== null && value !== undefined);

      if (nextHours.length) {
        const maxRain = Math.max(...nextHours);
        nextRainChance = `- Regenwahrscheinlichkeit in den nächsten Stunden: ca. ${maxRain}%`;
      }
    }

    return `
Aktuelles Wetter in Opfikon-Glattbrugg:
- Temperatur: ${current.temperature_2m}°C
- Wetter: ${weatherText}
- Niederschlag: ${current.precipitation} mm
- Wind: ${current.wind_speed_10m} km/h
${nextRainChance}

Nutze diese Wetterdaten aktiv für deine Empfehlung.
Wenn es regnet, kalt, windig oder ungemütlich ist, empfehle eher Indoor-Orte.
Wenn es sonnig oder trocken ist, empfehle Outdoor-Orte.
    `.trim();

  } catch (err) {
    console.error('Weather error:', err);

    return `
Wetterdaten konnten nicht geladen werden.
Gib trotzdem eine passende lokale Empfehlung.
Wenn die Frage nach Wetter klingt, erwähne kurz, dass du aktuell keine Wetterdaten laden konntest.
    `.trim();
  }
}


// Bessere Ersatzantworten, falls Gemini nicht antwortet.
// Diese Antworten sind absichtlich nach Thema sortiert.
// So wirkt der Chat nicht mehr so random oder immer gleich.
function getRandomFallback(userText = '') {
  const text = userText.toLowerCase();

  if (
    text.includes('sport') ||
    text.includes('training') ||
    text.includes('fitness') ||
    text.includes('bewegen') ||
    text.includes('bewegung')
  ) {
    const sportReplies = [
      'Für Sport kannst du zur Sportanlage Au, zum Fitnesspark Glattbrugg oder bei gutem Wetter in den Opfikerpark gehen. Für einen einfachen Start reicht auch eine Runde um den Glattpark-See.',
      'Wenn du Sport machen willst, passt die Sportanlage Au gut. Für etwas Leichteres kannst du im Opfikerpark spazieren oder dich draussen bewegen.',
      'Für Bewegung eignen sich der Opfikerpark, der Glattpark-See oder die Sportanlage Au. Drinnen wäre der Fitnesspark Glattbrugg eine passende Option.'
    ];

    return sportReplies[Math.floor(Math.random() * sportReplies.length)];
  }

  if (
    text.includes('grill') ||
    text.includes('grillieren') ||
    text.includes('bbq') ||
    text.includes('feuer')
  ) {
    const grillReplies = [
      'Zum Grillieren passt der Grillplatz Ara Glatt gut. Bitte prüfe vorher kurz, ob Feuer erlaubt ist, und nimm den Abfall wieder mit.',
      'Für Grillieren mit Freunden ist der Grillplatz Ara Glatt eine passende Idee. Bei trockenem Wetter ist das eine einfache Outdoor-Aktivität.',
      'Wenn du grillieren möchtest, würde ich den Grillplatz Ara Glatt anschauen. Wichtig ist nur, vorher die aktuellen Feuerregeln zu prüfen.'
    ];

    return grillReplies[Math.floor(Math.random() * grillReplies.length)];
  }

  if (
    text.includes('freund') ||
    text.includes('freunde') ||
    text.includes('kolleg') ||
    text.includes('gruppe') ||
    text.includes('zusammen')
  ) {
    const friendReplies = [
      'Mit Freunden passt der Glattpark-See gut für Spazieren, Reden oder ein kleines Picknick. Bei schlechtem Wetter ist das Glattzentrum eine einfache Indoor-Option.',
      'Für Freunde würde ich den Opfikerpark oder den Glattpark-See empfehlen. Dort kann man unkompliziert Zeit verbringen, ohne viel zu planen.',
      'Wenn ihr zusammen etwas machen wollt, passt der Glattpark-See gut. Für drinnen wäre das Glattzentrum die einfachste Alternative.'
    ];

    return friendReplies[Math.floor(Math.random() * friendReplies.length)];
  }

  if (
    text.includes('günstig') ||
    text.includes('gratis') ||
    text.includes('kostenlos') ||
    text.includes('billig') ||
    text.includes('ohne geld')
  ) {
    const cheapReplies = [
      'Günstige Aktivitäten sind: Spaziergang im Opfikerpark, Glattpark-See, Stadtbibliothek Opfikon oder Hardwaldturm. Das kostet wenig oder gar nichts.',
      'Wenn es günstig sein soll, passen Opfikerpark, Glattpark-See oder die Stadtbibliothek Opfikon. Für Aussicht ist der Hardwaldturm eine gute Idee.',
      'Kostenlose Optionen sind ein Spaziergang am Glattpark-See, der Opfikerpark oder ein Besuch in der Stadtbibliothek Opfikon.'
    ];

    return cheapReplies[Math.floor(Math.random() * cheapReplies.length)];
  }

  if (
    text.includes('draussen') ||
    text.includes('outdoor') ||
    text.includes('spazier') ||
    text.includes('natur') ||
    text.includes('frische luft')
  ) {
    const outdoorReplies = [
      'Draussen kannst du zum Opfikerpark, zum Glattpark-See oder zum Hardwaldturm. Für eine kurze Pause ist der Glattpark-See am einfachsten.',
      'Für frische Luft empfehle ich den Opfikerpark oder den Glattpark-See. Wenn du mehr Aussicht willst, ist der Hardwaldturm spannend.',
      'Outdoor passt der Glattpark-See sehr gut. Für Natur und Ruhe ist auch der Opfikerpark eine einfache Wahl.'
    ];

    return outdoorReplies[Math.floor(Math.random() * outdoorReplies.length)];
  }

  if (
    text.includes('regen') ||
    text.includes('kalt') ||
    text.includes('indoor') ||
    text.includes('drinnen') ||
    text.includes('schlechtes wetter')
  ) {
    const indoorReplies = [
      'Bei Regen oder Kälte passen das Freizeitbad Opfikon, die Stadtbibliothek Opfikon oder das Glattzentrum. Das sind einfache Indoor-Optionen.',
      'Wenn du lieber drinnen bleiben willst, empfehle ich die Stadtbibliothek Opfikon, das Glattzentrum oder das Freizeitbad Opfikon.',
      'Für schlechtes Wetter ist das Glattzentrum unkompliziert. Ruhiger ist die Stadtbibliothek Opfikon, aktiver wäre das Freizeitbad Opfikon.'
    ];

    return indoorReplies[Math.floor(Math.random() * indoorReplies.length)];
  }

  if (
    text.includes('kind') ||
    text.includes('kinder') ||
    text.includes('familie') ||
    text.includes('eltern')
  ) {
    const familyReplies = [
      'Für Familie oder Kinder passen der Opfikerpark, der Glattpark-See oder das Freizeitbad Opfikon. Bei gutem Wetter würde ich nach draussen gehen.',
      'Mit Kindern ist der Opfikerpark oder der Glattpark-See eine gute Wahl. Bei schlechtem Wetter passt das Freizeitbad Opfikon besser.',
      'Für eine Familienaktivität passt der Glattpark-See gut. Wenn ihr lieber drinnen seid, ist das Freizeitbad Opfikon eine gute Wahl.'
    ];

    return familyReplies[Math.floor(Math.random() * familyReplies.length)];
  }

  if (
    text.includes('essen') ||
    text.includes('restaurant') ||
    text.includes('café') ||
    text.includes('cafe') ||
    text.includes('kaffee')
  ) {
    const foodReplies = [
      'Für Essen oder Kaffee kannst du Restaurants und Cafés in Glattbrugg oder im Glattpark anschauen. Das ist nah und unkompliziert.',
      'Wenn du etwas essen möchtest, passt Glattbrugg oder der Glattpark gut. Dort gibt es mehrere einfache Restaurant- und Café-Optionen.',
      'Für eine kurze Essenspause sind die Cafés und Restaurants rund um Glattbrugg oder Glattpark eine gute Wahl.'
    ];

    return foodReplies[Math.floor(Math.random() * foodReplies.length)];
  }

  if (
    text.includes('kultur') ||
    text.includes('museum') ||
    text.includes('geschichte')
  ) {
    const cultureReplies = [
      'Für Kultur kannst du das Ortsmuseum Opfikon anschauen. Wenn du etwas Ruhiges suchst, passt auch die Stadtbibliothek Opfikon gut.',
      'Kulturell wäre das Ortsmuseum Opfikon eine passende Idee. Für eine ruhige Aktivität ist die Stadtbibliothek Opfikon auch gut.',
      'Wenn du etwas mit Kultur suchst, würde ich das Ortsmuseum Opfikon oder die Stadtbibliothek Opfikon empfehlen.'
    ];

    return cultureReplies[Math.floor(Math.random() * cultureReplies.length)];
  }

  if (
    text.includes('abschalten') ||
    text.includes('ruhe') ||
    text.includes('entspannen') ||
    text.includes('stress')
  ) {
    const relaxReplies = [
      'Zum Abschalten passt der Opfikerpark oder der Glattpark-See gut. Wenn du es ruhiger magst, kannst du auch in die Stadtbibliothek Opfikon gehen.',
      'Für Ruhe empfehle ich einen Spaziergang am Glattpark-See oder eine Pause im Opfikerpark. Bei schlechtem Wetter passt die Stadtbibliothek.',
      'Wenn du entspannen möchtest, ist der Glattpark-See eine einfache Wahl. Für drinnen wäre die Stadtbibliothek Opfikon ruhiger.'
    ];

    return relaxReplies[Math.floor(Math.random() * relaxReplies.length)];
  }

  return 'Sag mir kurz, ob du eher Sport, Natur, Essen, Freunde, Familie, Kultur oder etwas Ruhiges suchst. Dann gebe ich dir eine passendere Idee in Opfikon-Glattbrugg.';
}


// Verbindung mit Gemini API
async function callGeminiWithFallback(systemContext, contents, userText) {
  try {
    const res = await fetch(GEMINI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemContext,
        contents
      })
    });

    const data = await res.json();

    console.log('Gemini proxy response:', data);

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply && reply.trim()) {
      return reply.trim();
    }

  } catch (err) {
    console.warn('Cloudflare Worker Error:', err);
  }

  return getRandomFallback(userText);
}


// Hauptfunktion für den Chat
async function sendMessage() {
  if (!messagesEl || !inputEl) return;

  const text = inputEl.value.trim();

  if (!text) return;

  inputEl.value = '';

  appendMsg('user', text);
  appendTyping();

  const weatherContext = await getLocalWeatherContext();

  const systemContext = `
Du bist "GlattGuide", ein freundlicher lokaler Aktivitätsberater für Opfikon-Glattbrugg.

Deine Aufgabe:
- Empfiehl passende Orte und Aktivitäten in Opfikon-Glattbrugg.
- Antworte passend auf die konkrete Frage.
- Gib nicht immer dieselbe Standardantwort.
- Wenn der Nutzer nach Sport fragt, nenne Sportorte.
- Wenn der Nutzer grillieren möchte, nenne Grillplatz Ara Glatt.
- Wenn der Nutzer günstige Aktivitäten sucht, nenne kostenlose oder günstige Ideen.
- Wenn der Nutzer Freunde erwähnt, schlage Orte vor, die man gemeinsam besuchen kann.
- Wenn der Nutzer draussen sein will, nenne Outdoor-Orte.
- Wenn das Wetter schlecht ist, nenne Indoor-Orte.

Sprache:
- Antworte immer auf Deutsch.
- Freundlich, direkt und lokal.
 -Schreibe immer mindestens 2-3 vollständige Sätze.
Höre nie mitten im Satz auf.
- Gib immer mindestens eine konkrete Empfehlung mit kurzer Begründung.
- Keine langen Erklärungen.
- Keine Bulletpoints, ausser es passt wirklich.
- Keine erfundenen Orte.
- Antworte natürlich, wie ein Schülerprojekt-Guide.

Wetter:
Du bekommst aktuelle Wetterdaten. Nutze sie aktiv.
Bei gutem Wetter: Outdoor empfehlen.
Bei Regen, Kälte, starkem Wind oder schlechtem Wetter: Indoor empfehlen.

Lokale Orte, die du kennst:

Outdoor:
- Opfikerpark / Glattpark-See
- Hardwaldturm
- Grillplatz Ara Glatt
- Waldweiher Maas
- Sportanlage Au
- Badi Bruggwiesen
- Graffland Zürich

Indoor:
- Freizeitbad Opfikon
- Stadtbibliothek Opfikon
- Glattzentrum
- Restaurants und Cafés in Glattbrugg / Glattpark
- Ortsmuseum Opfikon

${weatherContext}
  `.trim();

  try {
    const contents = [];

    // Letzte Chatnachrichten als Kontext mitgeben
    chatHistory.slice(-6).forEach(msg => {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }]
      });
    });

    // Neue Frage hinzufügen
    contents.push({
      role: 'user',
      parts: [{ text }]
    });

    const reply = await callGeminiWithFallback(systemContext, contents, text);

    document.getElementById('typing')?.remove();

    appendMsg('ai', reply);

    // Chatverlauf speichern
    chatHistory.push({
      role: 'user',
      text: text
    });

    chatHistory.push({
      role: 'model',
      text: reply
    });

  } catch (err) {
    document.getElementById('typing')?.remove();

    appendMsg('ai', getRandomFallback(text));

    console.error(err);
  }
}


// Vielen Dank, dass du den Code bis hier gelesen hast.
// Ich hoffe, es gefällt dir.
