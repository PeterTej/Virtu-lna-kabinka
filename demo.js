const wardrobeItems = [
  { id: 'tee', name: 'Basic Tee', color: '#2f67ff' },
  { id: 'hoodie', name: 'Hoodie', color: '#6b7280' },
  { id: 'sweater', name: 'Sweater', color: '#0f766e' },
  { id: 'jacket', name: 'Jacket', color: '#7f1d1d' },
];

const modelUpload = document.getElementById('modelUpload');
const wardrobe = document.getElementById('wardrobe');
const modelImage = document.getElementById('modelImage');
const garmentLayer = document.getElementById('garmentLayer');
const colorPicker = document.getElementById('colorPicker');
const status = document.getElementById('status');
const hint = document.getElementById('hint');
const stage = document.getElementById('stage');
const resetBtn = document.getElementById('resetBtn');

let selected = wardrobeItems[0];

function setStatus(text) {
  status.textContent = text;
}

function renderWardrobe() {
  wardrobe.innerHTML = '';
  for (const item of wardrobeItems) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.name;
    if (item.id === selected.id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      selected = item;
      renderWardrobe();
      if (!garmentLayer.classList.contains('hidden')) {
        garmentLayer.style.background = colorPicker.value || item.color;
      }
      setStatus(`Vybrané: ${item.name}`);
    });
    wardrobe.appendChild(btn);
  }
}

function applyGarment() {
  garmentLayer.classList.remove('hidden');
  garmentLayer.style.background = colorPicker.value || selected.color;
  setStatus(`Outfit: ${selected.name} / ${colorPicker.value}`);
}

modelUpload.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    setStatus('Prosím nahraj obrázok.');
    return;
  }
  const url = URL.createObjectURL(file);
  modelImage.src = url;
  modelImage.style.display = 'block';
  hint.textContent = 'Model nahraný. Vyber top a farbu.';
  applyGarment();
});

colorPicker.addEventListener('input', () => {
  if (!garmentLayer.classList.contains('hidden')) {
    garmentLayer.style.background = colorPicker.value;
    setStatus(`Outfit: ${selected.name} / ${colorPicker.value}`);
  }
});

document.querySelectorAll('.poseButtons button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const pose = btn.getAttribute('data-pose');
    stage.classList.remove('pose-front', 'pose-threequarter', 'pose-side');
    stage.classList.add(`pose-${pose}`);
    setStatus(`Póza: ${pose}`);
  });
});

resetBtn.addEventListener('click', () => {
  modelUpload.value = '';
  modelImage.removeAttribute('src');
  modelImage.style.display = 'none';
  garmentLayer.classList.add('hidden');
  colorPicker.value = '#2f67ff';
  selected = wardrobeItems[0];
  renderWardrobe();
  stage.classList.remove('pose-threequarter', 'pose-side');
  stage.classList.add('pose-front');
  hint.textContent = 'Nahraj fotku modelu pre náhľad.';
  setStatus('Reset hotový.');
});

renderWardrobe();
