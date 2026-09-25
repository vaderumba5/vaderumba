import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { collection, getFirestore, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// Same public Firebase project and configuration as concerts.js.
const app = initializeApp({
  apiKey: 'AIzaSyC0DrWRG4JLWHSX2vk5zat6eVxxKs8GfvY',
  authDomain: 'va-de-rumba.firebaseapp.com',
  projectId: 'va-de-rumba',
  storageBucket: 'va-de-rumba.firebasestorage.app',
  messagingSenderId: '353945851143',
  appId: '1:353945851143:web:7c27b29224e687476c21a2',
});
const images = [...document.querySelectorAll('[data-gallery-slot]')];
const defaults = new Map(images.map(img => [img.dataset.gallerySlot, {
  src: img.src, alt: img.alt,
}]));
onSnapshot(collection(getFirestore(app), 'public_gallery'), snapshot => {
  const published = new Map(snapshot.docs.map(doc => [doc.id, doc.data()]));
  for (const img of images) {
    const slot = img.dataset.gallerySlot;
    const photo = published.get(`slot-${slot}`);
    const fallback = defaults.get(slot);
    const url = typeof photo?.imageUrl === 'string'
      && photo.imageUrl.startsWith('https://')
      ? photo.imageUrl : fallback.src;
    if (img.src !== url) img.src = url;
    img.alt = typeof photo?.alt === 'string' && photo.alt.trim()
      ? photo.alt.trim() : fallback.alt;
  }
  window.dispatchEvent(new Event('gallerycontentchange'));
}, error => {
  // Keep the default photographs if public gallery rules are not yet active.
  console.warn('No se pudo cargar la galería pública.', error);
});
