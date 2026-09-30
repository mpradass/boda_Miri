/* Reusable reveals and scroll scenes; natural browser scrolling, no wheel interception. */
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');
const clamp = value => Math.max(0, Math.min(1, value));

class RevealGroup {
  constructor() {
    this.elements = [...document.querySelectorAll('[data-reveal]')];
    document.querySelectorAll('.lines span').forEach((line, index) => line.style.setProperty('--line', index));
    if (!('IntersectionObserver' in window) || preference.matches) return;
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    this.elements.forEach(element => this.observer.observe(element));
    document.documentElement.classList.add('motion-ready');
  }
  showAll() {
    this.observer?.disconnect();
    this.elements.forEach(element => element.classList.add('visible'));
  }
}

class ScrollScene {
  constructor(element, render) { this.element = element; this.render = render; }
  update() {
    const rect = this.element.getBoundingClientRect();
    const height = window.innerHeight;
    if (rect.bottom < 0 || rect.top > height) return;
    this.render(clamp(-rect.top / Math.max(1, rect.height - height)));
  }
}

const reveals = new RevealGroup();
const hero = document.querySelector('[data-scene="hero"]');
const heroContent = hero.querySelector('.veil-content');
const heroPhoto = hero.querySelector('.veil-photo');
const heroPanel = hero.querySelector('.veil-hero');
const scenes = [
  new ScrollScene(hero, progress => {
    heroContent.style.opacity = 1 - clamp(progress * 1.7);
    heroContent.style.transform = `translate3d(0,${-progress * (mobile.matches ? 12 : 32)}px,0)`;
    heroPhoto.style.transform = `scale(${1 + progress * (mobile.matches ? .025 : .05)})`;
    heroPanel.style.setProperty('--dissolve', clamp((progress - .32) / .68));
    heroPanel.style.setProperty('--scene-blur', `${clamp(progress * 1.2) * (mobile.matches ? 2 : 4)}px`);
  })
];
// A short soft-focus handoff at the viewport edges. Content stays sharp while read.
const transitions = [...document.querySelectorAll('.prologue,.invitation,.practical,.closing')];
function updateTransitions() {
  const height = window.innerHeight;
  const measurements = transitions.map(element => ({element, rect: element.getBoundingClientRect()}));
  measurements.forEach(({element, rect}) => {
    if (rect.bottom < 0 || rect.top > height) return;
    const entering = clamp((rect.top - height * .48) / (height * .45));
    const leaving = clamp((height * .2 - rect.bottom) / (height * .2));
    const softness = Math.max(entering, leaving);
    element.style.setProperty('--scene-blur', `${(softness * (mobile.matches ? 2 : 4)).toFixed(2)}px`);
    element.style.setProperty('--scene-fade', (1 - softness * .5).toFixed(3));
  });
}
let pending = false;
function update() {
  pending = false;
  if (!preference.matches) { scenes.forEach(scene => scene.update()); updateTransitions(); }
}
function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
addEventListener('scroll', schedule, {passive:true});
addEventListener('resize', schedule, {passive:true});
addEventListener('pageshow', schedule);
preference.addEventListener('change', () => {
  if (preference.matches) {
    reveals.showAll();
    [heroContent, heroPhoto].forEach(element => { element.style.opacity = ''; element.style.transform = ''; });
    heroPanel.style.setProperty('--dissolve', 0);
    heroPanel.style.setProperty('--scene-blur', '0px');
    transitions.forEach(element => { element.style.setProperty('--scene-blur', '0px'); element.style.setProperty('--scene-fade', 1); });
  } else schedule();
});
schedule();
