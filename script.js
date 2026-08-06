import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0DrWRG4JLWHSX2vk5zat6eVxxKs8GfvY",
  authDomain: "va-de-rumba.firebaseapp.com",
  projectId: "va-de-rumba",
  storageBucket: "va-de-rumba.firebasestorage.app",
  messagingSenderId: "353945851143",
  appId: "1:353945851143:web:7c27b29224e687476c21a2",
  measurementId: "G-0DXD34H6CZ",
};

const list = document.querySelector("#concerts-list");
const heading = document.querySelector("#conciertos h2");
const db = getFirestore(initializeApp(firebaseConfig));

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Madrid",
});

function madridStartOfToday() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Madrid",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const utcGuess = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
  );

  const madridParts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Madrid",
  }).formatToParts(new Date(utcGuess));
  const madridValues = Object.fromEntries(
    madridParts.map(({ type, value }) => [type, value]),
  );
  const representedAsUtc = Date.UTC(
    Number(madridValues.year),
    Number(madridValues.month) - 1,
    Number(madridValues.day),
    Number(madridValues.hour),
    Number(madridValues.minute),
    Number(madridValues.second),
  );

  return new Date(utcGuess - (representedAsUtc - utcGuess));
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function appendTicket(container, concert) {
  const ticketType = text(concert.ticketType);
  if (ticketType === "free") {
    const badge = document.createElement("div");
    badge.className = "entrada-gratis";
    badge.textContent = text(concert.ticketLabel) || "ENTRADA GRATUITA";
    container.append(badge);
    return;
  }

  const ticketUrl = text(concert.ticketUrl);
  if (ticketUrl && ticketType === "ticketed") {
    const link = document.createElement("a");
    link.className = "boton-entrada";
    link.href = ticketUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent =
      text(concert.ticketLabel) ||
      "COMPRAR ENTRADAS";
    container.append(link);
  }
}

function renderConcert(concert) {
  const item = document.createElement("li");
  const event = document.createElement("div");
  const day = document.createElement("div");
  const detail = document.createElement("div");
  const actions = document.createElement("div");

  event.className = "evento";
  day.className = "dia";
  detail.className = "detalle";
  actions.style.marginTop = "10px";

  const concertDate = concert.date?.toDate?.();
  day.textContent = concertDate
    ? dateFormatter.format(concertDate).toLocaleUpperCase("es-ES")
    : "";

  const venue = text(concert.publicLocation) || text(concert.venue);
  const city = text(concert.city);
  const location = [venue, city].filter(Boolean).join(", ");
  const time = text(concert.time);
  detail.textContent = `${location ? `📍${location}` : ""}${time ? ` — ${time}h` : ""}`;

  appendTicket(actions, concert);
  event.append(day, detail);
  if (actions.childElementCount) event.append(actions);
  item.append(event);
  return item;
}

function showMessage(message) {
  list.replaceChildren();
  const item = document.createElement("li");
  const event = document.createElement("div");
  const detail = document.createElement("div");
  event.className = "evento";
  detail.className = "detalle";
  detail.textContent = message;
  event.append(detail);
  item.append(event);
  list.append(item);
}

const publicConcerts = query(
  collection(db, "public_concerts"),
  where("status", "==", "scheduled"),
  where("date", ">=", Timestamp.fromDate(madridStartOfToday())),
  orderBy("date", "asc"),
);

onSnapshot(
  publicConcerts,
  (snapshot) => {
    list.setAttribute("aria-busy", "false");
    if (snapshot.empty) {
      showMessage("Próximamente anunciaremos nuevas fechas.");
      return;
    }

    const fragment = document.createDocumentFragment();
    snapshot.forEach((document) => fragment.append(renderConcert(document.data())));
    list.replaceChildren(fragment);

    const firstDate = snapshot.docs[0].data().date?.toDate?.();
    if (firstDate) {
      const year = new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        timeZone: "Europe/Madrid",
      }).format(firstDate);
      heading.textContent = `Conciertos ${year}`;
    }
  },
  (error) => {
    console.error("No se pudieron cargar los conciertos públicos.", error);
    list.setAttribute("aria-busy", "false");
    showMessage("No se pudieron cargar los conciertos. Inténtalo de nuevo más tarde.");
  },
);
