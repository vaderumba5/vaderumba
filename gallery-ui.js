const gallery = document.querySelector('.gallery');
const photos = [...gallery.querySelectorAll('.photo')];
const images = photos.map(photo => photo.querySelector('img'));
const counter = document.getElementById('galleryCount');
const dialog = document.getElementById('galleryDialog');
const enlarged = dialog.querySelector('img');
const caption = dialog.querySelector('p');
let active = 0;
let enlargedIndex = 0;
let pointerStart = null;
let suppressClickUntil = 0;

function wrapped(index) {
  return (index + photos.length) % photos.length;
}

function selectPhoto(index) {
  active = wrapped(index);
  photos.forEach((photo, i) => {
    let distance = wrapped(i - active);
    if (distance > photos.length / 2) distance -= photos.length;
    const visible = Math.abs(distance) <= 2;
    const interactive = Math.abs(distance) <= 1;
    if (visible) photo.dataset.position = String(distance);
    else delete photo.dataset.position;
    photo.setAttribute('aria-hidden', String(!interactive));
    const button = photo.querySelector('button');
    button.tabIndex = interactive ? 0 : -1;
    button.setAttribute('aria-label', `${distance === 0 ? 'Ampliar' : 'Mostrar'} foto: ${images[i].alt}`);
  });
  counter.textContent = `${active + 1} / ${photos.length}`;
}

function showEnlarged(index) {
  enlargedIndex = wrapped(index);
  const image = images[enlargedIndex];
  enlarged.src = image.currentSrc || image.src;
  enlarged.alt = image.alt;
  caption.textContent = `${enlargedIndex + 1} / ${photos.length} · ${image.alt}`;
}

photos.forEach((photo, index) => photo.querySelector('button').addEventListener('click', () => {
  if (performance.now() < suppressClickUntil) return;
  if (index !== active) {
    selectPhoto(index);
    return;
  }
  showEnlarged(index);
  dialog.showModal();
}));

document.getElementById('galleryBack').addEventListener('click', () => selectPhoto(active - 1));
document.getElementById('galleryForward').addEventListener('click', () => selectPhoto(active + 1));

gallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    selectPhoto(active + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

gallery.addEventListener('dragstart', event => event.preventDefault());
gallery.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  pointerStart = {x: event.clientX, y: event.clientY, id: event.pointerId};
});
gallery.addEventListener('pointerup', event => {
  if (!pointerStart || event.pointerId !== pointerStart.id) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
  suppressClickUntil = performance.now() + 350;
  selectPhoto(active + (dx < 0 ? 1 : -1));
});
gallery.addEventListener('pointercancel', () => { pointerStart = null; });
window.addEventListener('gallerycontentchange', () => selectPhoto(active));

dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
dialog.querySelector('.gallery-prev').addEventListener('click', () => showEnlarged(enlargedIndex - 1));
dialog.querySelector('.gallery-next').addEventListener('click', () => showEnlarged(enlargedIndex + 1));
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') showEnlarged(enlargedIndex - 1);
  if (event.key === 'ArrowRight') showEnlarged(enlargedIndex + 1);
});

selectPhoto(0);
