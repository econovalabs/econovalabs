"use strict";
const systems = [
  { name: "AquaCore", category: "WATER MANAGEMENT", symbol: "◉", word: "EVERY DROP, A LITTLE MORE PURPOSE.", description: "A built-in reservoir, soil-moisture sensing and automatic drip irrigation. AquaCore is designed to deliver water when the selected moisture threshold calls for it.", features: ["Reservoir-fed drip irrigation", "Soil-moisture sensing", "Low-water reminder"] },
  { name: "LumaGrow", category: "SUPPLEMENTAL LIGHTING", symbol: "☼", word: "A LITTLE MORE LIGHT. ROOM TO GROW.", description: "Full-spectrum LED lighting is intended to supplement available daylight. Adjustable brightness and programmable schedules let the user choose settings around the plants being grown.", features: ["Full-spectrum LED grow lighting", "Adjustable intensity", "Programmable lighting schedules"] },
  { name: "ClimateSync", category: "ENVIRONMENTAL MONITORING", symbol: "◌", word: "A CLOSER LOOK AT YOUR GROWING WORLD.", description: "Temperature and humidity sensors bring environmental information to the digital panel, with alerts for user-selected ranges. Active heating, cooling and humidification require separate engineering.", features: ["Temperature sensing", "Humidity monitoring", "Environmental information and alerts"] },
  { name: "AirFlow", category: "VENTILATION & CIRCULATION", symbol: "≋", word: "A FRESH PERSPECTIVE, INSIDE AND OUT.", description: "Adjustable vents and circulation fans are intended to move air within the greenhouse and support fresh-air exchange. Placement, noise and maintenance remain part of the detailed design.", features: ["Adjustable ventilation", "Internal air circulation", "Fresh-air exchange"] },
  { name: "BioSphere", category: "MODULAR GROWING INTERIOR", symbol: "✳", word: "YOUR SPACE. YOUR ARRANGEMENT. YOUR GREEN.", description: "Removable trays, substrate layers and modular sections allow the interior to be arranged around suitable plants. Materials should withstand moisture and be easy to clean.", features: ["Removable growing trays", "Configurable interior sections", "Plant-focused layouts"] },
  { name: "EcoSense", category: "CENTRAL CONTROL", symbol: "⌘", word: "BRINGING EVERY LITTLE DETAIL TOGETHER.", description: "A central controller brings sensor information and the main electronic functions together. A front-facing digital panel would display conditions and offer automatic operation and manual override.", features: ["Central sensor information", "Coordinated system settings", "Manual and automatic operating modes"] }
];
const tabs = [...document.querySelectorAll('[data-system]')];
function selectSystem(index, focus = false) {
  const system = systems[index];
  tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  document.getElementById('system-panel').setAttribute('aria-labelledby', `tab-${index}`);
  document.getElementById('system-category').textContent = system.category;
  document.getElementById('system-title').textContent = `Meet ${system.name}.`;
  document.getElementById('system-description').textContent = system.description;
  document.getElementById('system-symbol').textContent = system.symbol;
  document.getElementById('system-word').textContent = system.word;
  const list = document.getElementById('system-features');
  list.replaceChildren(...system.features.map(feature => { const item = document.createElement('li'); item.textContent = feature; return item; }));
  if (focus) tabs[index].focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectSystem(index));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % tabs.length;
    else if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); selectSystem(next, true);
  });
});
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu() { navigation.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => { const open = navigation.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
const brightness = document.getElementById('brightness');
const lightSwitch = document.getElementById('light-switch');
const airSwitch = document.getElementById('air-switch');
let mode = 'Automatic';
function updateDemo() {
  const lightOn = lightSwitch.getAttribute('aria-checked') === 'true';
  const airOn = airSwitch.getAttribute('aria-checked') === 'true';
  document.getElementById('brightness-value').textContent = `${brightness.value}%`;
  document.querySelector('.demo-plant img').style.filter = `brightness(${lightOn ? .78 + Number(brightness.value) / 250 : .72}) drop-shadow(0 22px 12px #163f2d15)`;
  document.getElementById('demo-status').textContent = `${mode} mode · Lighting ${lightOn ? brightness.value + '%' : 'off'} · Air circulation ${airOn ? 'on' : 'off'}`;
}
brightness.addEventListener('input', updateDemo);
[lightSwitch, airSwitch].forEach(button => button.addEventListener('click', () => { button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true')); updateDemo(); }));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  updateDemo();
}));
document.getElementById('reset-demo').addEventListener('click', () => {
  brightness.value = '70'; lightSwitch.setAttribute('aria-checked', 'true'); airSwitch.setAttribute('aria-checked', 'true');
  document.querySelector('[data-mode="Automatic"]').click();
});
document.getElementById('year').textContent = new Date().getFullYear();
