//Hallo das ist JavaScript 


//--//

//--//

//das macht unser project quasi lebendig
// es ist wie organen und muskel in körper




//Für dieses Projekt brauchen wie JS(abkürzung für JavaScript) für unser ai chat und auch damit unser ai die neuesten Daten über Wetter weiss




//HINWEISUNG : Ich benutze gerne ab und zu English :-) weil es mir manchmal mehr angenehm ist.
//das ändert jedoch die logik beim der webseite nicht.
//Alle Programmiersprache sind mit English geschrieben, das ist auch ein Grund für den english


// ── GEMINI API KEY ──

const GEMINI_API_KEY = 'AIzaSyBj_pyzEUS-BlA2YdR44rFoqTYv2-iRBZE';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];


// ── Animation beim Scrollen ──

const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


// ── AI CHAT ──

const messagesEl = document.querySelector('#aiMessages');
const inputEl = document.querySelector('#aiInput');


// Sicherheitscheck, falls HTML-Elemente fehlen
if (!messagesEl || !inputEl) {
  console.warn('AI Chat Elemente wurden nicht gefunden. Prüfe #aiMessages und #aiInput im HTML.');
}


// Koordinaten von Opfikon / Glattbrugg für die Wetterabfrage
const LOCAL_LAT = 47.4317;
const LOCAL_LON = 8.5667;


// Ich speichere nur die letzten paar Nachrichten, sonst wird der Chat zu lang
let chatHistory = [];


// Chip Button senden
function sendChip(button) {
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
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `msg ${role}`;

  const avatarBox = document.createElement('div');
  avatarBox.className = 'msg-avatar';

  if (role === 'ai') {
    avatarBox.textContent = 'G';
  } else {
    avatarBox.textContent = 'Du';
  }

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
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'typing';

  div.innerHTML = `
    <div class="msg-avatar">G</div>
    <div class="msg-bubble">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}


// Wettercode zu Text umwandeln
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

    if (data.hourly && data.hourly.precipitation_probability && data.hourly.time) {
      const currentTime = new Date();

      const currentHourString = currentTime
        .toLocaleString('sv-SE', { timeZone: 'Europe/Zurich' })
        .slice(0, 13);

      let startIndex = data.hourly.time.findIndex(t => t.startsWith(currentHourString));

      if (startIndex === -1) {
        startIndex = 0;
      }

      const nextHours = data.hourly.precipitation_probability
        .slice(startIndex, startIndex + 4)
        .filter(v => v !== null && v !== undefined);

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


// Zufällige Ersatzantwort, falls Gemini nicht antwortet
function getRandomFallback(userText = '') {
  const text = userText.toLowerCase();

  if (text.includes('kind') || text.includes('familie')) {
    const familyReplies = [
      'Für Familie oder Kinder passt das Freizeitbad Opfikon gut. Bei trockenem Wetter ist auch der Glattpark-See schön.',
      'Mit Kindern würde ich den Opfikerpark oder das Freizeitbad Opfikon empfehlen. Beides ist einfach erreichbar und nicht kompliziert.',
      'Für eine Familienaktivität passt der Glattpark-See gut. Wenn ihr lieber drinnen seid, ist das Freizeitbad Opfikon eine gute Wahl.'
    ];

    return familyReplies[Math.floor(Math.random() * familyReplies.length)];
  }

  if (text.includes('essen') || text.includes('restaurant') || text.includes('café') || text.includes('cafe')) {
    const foodReplies = [
      'Für Essen oder einen Kaffee würde ich Restaurants und Cafés in Glattbrugg oder im Glattpark anschauen. Das ist unkompliziert und nah.',
      'Wenn du etwas essen möchtest, passt Glattbrugg oder der Glattpark gut. Dort findest du mehrere einfache Restaurant- und Café-Optionen.',
      'Für eine kurze Essenspause sind die Cafés und Restaurants rund um Glattbrugg oder Glattpark eine gute Wahl.'
    ];

    return foodReplies[Math.floor(Math.random() * foodReplies.length)];
  }

  if (text.includes('spazier') || text.includes('laufen') || text.includes('draussen') || text.includes('outdoor')) {
    const outdoorReplies = [
      'Für frische Luft empfehle ich den Opfikerpark oder den Glattpark-See. Das passt gut für einen kurzen Spaziergang.',
      'Ein Spaziergang beim Opfikerpark oder rund um den Glattpark-See ist eine einfache und schöne Option.',
      'Wenn du raus möchtest, ist der Glattpark-See eine gute Wahl. Für etwas mehr Ruhe passt auch der Opfikerpark.'
    ];

    return outdoorReplies[Math.floor(Math.random() * outdoorReplies.length)];
  }

  if (text.includes('regen') || text.includes('kalt') || text.includes('indoor') || text.includes('drinnen')) {
    const indoorReplies = [
      'Bei Regen oder Kälte würde ich die Stadtbibliothek Opfikon, das Glattzentrum oder das Freizeitbad Opfikon empfehlen.',
      'Für drinnen passt das Glattzentrum gut. Wenn du etwas Ruhigeres willst, wäre die Stadtbibliothek Opfikon besser.',
      'Wenn das Wetter schlecht ist, sind Freizeitbad Opfikon, Stadtbibliothek oder Glattzentrum gute Indoor-Optionen.'
    ];

    return indoorReplies[Math.floor(Math.random() * indoorReplies.length)];
  }

  const fallbackReplies = [
    'Heute passt ein kurzer Spaziergang im Opfikerpark gut, wenn das Wetter angenehm ist. Bei Regen wäre die Stadtbibliothek Opfikon eine gute Alternative.',
    'Für eine kurze Pause empfehle ich den Glattpark-See. Wenn du lieber drinnen bleiben willst, passt das Glattzentrum gut.',
    'Wenn du etwas Ruhiges suchst, wäre die Stadtbibliothek Opfikon passend. Für frische Luft ist der Opfikerpark eine einfache Wahl.',
    'Für eine kurze Aktivität empfehle ich einen Spaziergang Richtung Opfikerpark oder, bei schlechtem Wetter, einen ruhigen Indoor-Ort.',
    'Wenn du nicht viel Zeit hast, ist der Opfikerpark eine einfache Wahl. Für drinnen passt das Glattzentrum oder die Stadtbibliothek.'
  ];

  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}


// Verbindung mit Gemini API
async function callGeminiWithFallback(systemContext, contents, userText) {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemContext }]
            },
            contents: contents,
            generationConfig: {
              temperature: 0.8,
              topP: 0.9,
              maxOutputTokens: 180
            }
          })
        }
      );

      const data = await res.json();

      if (data.error) {
        console.warn(`Gemini error with ${model}:`, data.error.message);
        continue;
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply && reply.trim()) {
        return reply.trim();
      }

    } catch (err) {
      console.warn(`Fetch error with ${model}:`, err);
    }
  }

  return getRandomFallback(userText);
}


// Hauptfunktion für Chat
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

Sprache:
- Antworte immer auf Deutsch.
- Freundlich, direkt und lokal.
- Maximal 100 Wörter.
- Keine langen Erklärungen.
- Gib konkrete Empfehlungen.
- Antworte passend auf die konkrete Frage des Nutzers.
- Gib nicht immer dieselbe Standardantwort.
- Wenn du unsicher bist, gib 1 bis 2 passende Optionen.

Wichtig:
Du bekommst aktuelle Wetterdaten. Nutze sie aktiv.
Bei gutem Wetter: Outdoor empfehlen.
Bei Regen, Kälte, starkem Wind oder schlechtem Wetter: Indoor empfehlen.
Wenn der Nutzer Kinder, Familie, Sport, Spaziergang, Date, Essen oder kurze Aktivität erwähnt, passe die Empfehlung daran an.

Lokale Orte, die du kennst:

Outdoor:
- Opfikerpark / Glattpark-See
- Hardwaldturm
- Fitnesspark Glattbrugg
- Graffland Zürich
- Grillplatz Ara Glatt
- Waldweiher Maas
- Sportanlage Au
- Badi Bruggwiesen

Indoor:
- Freizeitbad Opfikon
- Stadtbibliothek Opfikon
- Glattzentrum
- Restaurants und Cafés in Glattbrugg / Glattpark

${weatherContext}
  `.trim();

  try {
    const contents = [];

    chatHistory.slice(-6).forEach(msg => {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }]
      });
    });

    contents.push({
      role: 'user',
      parts: [{ text }]
    });

    const reply = await callGeminiWithFallback(systemContext, contents, text);

    document.getElementById('typing')?.remove();

    appendMsg('ai', reply);

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

    appendMsg(
      'ai',
      getRandomFallback(text)
    );

    console.error(err);
  }
}


// Vielen Dank, dass du den Code bis hier gelesen hast.
// Ich hoffe, es gefällt dir.
