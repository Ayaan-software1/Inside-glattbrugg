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

// ── animation beim scrollen ──

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

// Koordinaten von Opfikon/Glattbrugg für die Wetterabfrage
const LOCAL_LAT = 47.4317;
const LOCAL_LON = 8.5667;

// ich speichere nur die letzten paar Nachrichten, sonst wird der Chat zu lang
let chatHistory = [];

function sendChip(button) {
  const chipText = button.textContent.trim();

  inputEl.value = chipText;
  sendMessage();
}

inputEl.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

function appendMsg(role, text) {

  // neue nachricht erstellen
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `msg ${role}`;

  // kleines avatar links/rechts
  const avatarBox = document.createElement('div');
  avatarBox.className = 'msg-avatar';

  if (role === 'ai') {
    avatarBox.textContent = 'G';
  } else {
    avatarBox.textContent = 'Du';
  }

  // eigentliche nachricht bubble
  const msgBubble = document.createElement('div');
  msgBubble.className = 'msg-bubble';
  msgBubble.textContent = text;

  // früher hatte ich hier appendChild problem :-(
  msgWrapper.appendChild(avatarBox);
  msgWrapper.appendChild(msgBubble);

  //in den chat hinzufügen
  messagesEl.appendChild(msgWrapper);

  // automatisch nach unten scrollen
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return msgWrapper;
}


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

//hier notiere ich alle mögliche wetter unde deren code(code ist zu jede wetter zugeordnet)
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

//hier ist der logik hier unser wetter funktion
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
      const currentHourString = currentTime.toISOString().slice(0, 13);

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
    return 'Wetterdaten konnten nicht geladen werden. Gib trotzdem eine passende lokale Empfehlung.';
  }
}
// hier ist quasi die verbindung des wetter funtion mit ai chat
async function callGeminiWithFallback(systemContext, contents) {

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
            contents: contents
          })
        }
      );

      const data = await res.json();

      if (data.error) {
        console.warn('Gemini error:', data.error.message);
        continue;
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        return reply;
      }

    } catch (err) {
      console.warn(err);
    }
  }

  return 'Heute eignet sich der Opfikerpark perfekt für einen Spaziergang. Bei schlechtem Wetter empfehle ich das Freizeitbad Opfikon oder das Glattzentrum.';
}
//mit hilfe von ki habe ich einen guten Prompt bekommen den ich den ai chat gegeben habe den es immmer folgen muss
async function sendMessage() {

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

    // Chat memory
    chatHistory.slice(-6).forEach(msg => {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }]
      });
    });

    // jetzige nachricht
    contents.push({
      role: 'user',
      parts: [{ text }]
    });

    // Models fallback
    const models = [
      'gemini-2.5-flash',
      'gemini-2.0-flash'
    ];

    let reply = null;

    for (const model of models) {

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
              contents: contents
            })
          }
        );

        const data = await res.json();

        if (data.error) {
          console.warn('Gemini error:', data.error.message);
          continue;
        }

        reply =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
          break;
        }

      } catch (err) {
        console.warn(err);
      }
    }

    document.getElementById('typing')?.remove();

    // Final fallback
    if (!reply) {

      reply =
        'Heute eignet sich der Opfikerpark perfekt für einen Spaziergang. Bei schlechtem Wetter empfehle ich das Freizeitbad Opfikon oder das Glattzentrum.';
    }

    appendMsg('ai', reply);

    // Save memory
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
      'Momentan ist der KI-Guide kurz beschäftigt. Versuch es gleich nochmals 😊'
    );

    console.error(err);
  }
}




//Vielen dank das du den code bis hier gelesen hast!!!! 
// Ich hoffe es gefällt dir

