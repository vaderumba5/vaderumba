import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { collection, getFirestore, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// Public Firebase web configuration, shared with vaderumba.es. Firestore rules control access.
const app = initializeApp({
  apiKey: 'AIzaSyC0DrWRG4JLWHSX2vk5zat6eVxxKs8GfvY',
  authDomain: 'va-de-rumba.firebaseapp.com',
  projectId: 'va-de-rumba',
  storageBucket: 'va-de-rumba.firebasestorage.app',
  messagingSenderId: '353945851143',
  appId: '1:353945851143:web:7c27b29224e687476c21a2',
});
const db = getFirestore(app);
const list = document.querySelector('#fechas');
const nextDate = document.querySelector('#nextDate');
const nextTitle = document.querySelector('#nextTitle');
const nextMeta = document.querySelector('#nextMeta');
const showLabel = document.querySelector('#showLabel');
const nextShow = document.querySelector('#nextShow');
const text = value => typeof value === 'string' ? value.trim() : '';
const dateFormat = new Intl.DateTimeFormat('es-ES', {day:'numeric', month:'short', timeZone:'Europe/Madrid'});
const longDate = new Intl.DateTimeFormat('es-ES', {day:'numeric', month:'long', year:'numeric', timeZone:'Europe/Madrid'});

function madridStartOfToday() {
  const now = new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    year:'numeric', month:'2-digit', day:'2-digit', timeZone:'Europe/Madrid'
  }).formatToParts(now).map(({type,value}) => [type,value]));
  const guess = Date.UTC(+parts.year, +parts.month-1, +parts.day);
  const local = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit',
    hourCycle:'h23', timeZone:'Europe/Madrid'
  }).formatToParts(new Date(guess)).map(({type,value}) => [type,value]));
  const represented = Date.UTC(+local.year,+local.month-1,+local.day,+local.hour,+local.minute,+local.second);
  return new Date(guess-(represented-guess));
}

function showMessage(message) {
  const p = document.createElement('p');
  p.textContent = message;
  list.replaceChildren(p);
  list.setAttribute('aria-busy','false');
}

function render(concert, past) {
  const date = concert.date?.toDate?.();
  const row = document.createElement('div');
  row.className = 'date-row';
  const day = document.createElement('time');
  if (date) { day.dateTime = date.toISOString(); day.textContent = dateFormat.format(date).toUpperCase(); }
  const venue = text(concert.publicLocation) || text(concert.venue);
  const city = text(concert.city);
  const title = document.createElement('strong');
  title.textContent = [venue, city].filter(Boolean).join(' · ') || 'Va de Rumba en directo';
  const detail = document.createElement('span');
  detail.className = 'date-detail';
  detail.textContent = text(concert.time) ? `${text(concert.time)} h` : 'En directo';
  const action = document.createElement('b');
  const url = text(concert.ticketUrl);
  if (past) {
    const marker = document.createElement('span');
    marker.className = 'past-marker';
    marker.textContent = '✓';
    marker.setAttribute('role','img');
    marker.setAttribute('aria-label','Concierto celebrado');
    marker.title = 'Concierto celebrado';
    action.append(marker);
  } else if (concert.ticketType === 'ticketed' && /^https:\/\//i.test(url)) {
    const a = document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer';
    a.textContent=text(concert.ticketLabel)||'Entradas'; action.append(a);
  } else if (concert.ticketType === 'free') {
    action.textContent=text(concert.ticketLabel)||'Gratis';
  }
  row.append(day,title,detail,action);
  return row;
}

// Keep previously published concerts visible after their date has passed.
const published = query(collection(db,'public_concerts'), where('status','==','scheduled'));
onSnapshot(published, snapshot => {
  list.setAttribute('aria-busy','false');
  if (snapshot.empty) { showMessage('Próximamente anunciaremos nuevas fechas.'); return; }
  const events = snapshot.docs.map(doc => doc.data());
  const today = madridStartOfToday();
  const upcoming = events.filter(event => event.date?.toDate?.() >= today)
    .sort((a,b) => a.date.toDate() - b.date.toDate());
  const past = events.filter(event => event.date?.toDate?.() < today)
    .sort((a,b) => b.date.toDate() - a.date.toDate());
  const fragment = document.createDocumentFragment();
  for (const [title, group, isPast] of [
    ['Próximos conciertos',upcoming,false],['Conciertos anteriores',past,true]
  ]) {
    if (!group.length) continue;
    const heading = document.createElement('h3');
    heading.textContent = title;
    fragment.append(heading,...group.map(event => render(event,isPast)));
  }
  list.replaceChildren(fragment);
  const first = upcoming[0] || past[0];
  const date = first?.date?.toDate?.();
  if (date) {
    const isPast = !upcoming.length;
    nextShow.classList.toggle('is-past',isPast);
    showLabel.textContent = isPast ? 'Último concierto' : 'Próximo concierto';
    nextDate.textContent = dateFormat.format(date).toUpperCase();
    nextTitle.textContent = [text(first.publicLocation)||text(first.venue),text(first.city)].filter(Boolean).join(' · ') || 'Va de Rumba en directo';
    nextMeta.textContent = `${longDate.format(date)}${text(first.time) ? ` · ${text(first.time)} h` : ''}`;
  }
}, error => {
  console.error('No se pudieron cargar los conciertos públicos.',error);
  showMessage('No se pudieron cargar las fechas. Vuelve a intentarlo más tarde.');
});
