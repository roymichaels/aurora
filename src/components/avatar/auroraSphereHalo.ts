import * as THREE from 'three';

function getAccentHsl(): string {
  if (typeof window === 'undefined') return '0 0% 100%';
  const val = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  return val.trim() || '0 0% 100%';
}

export function createHalo(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(1.15, 1.25, 64);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(`hsl(${getAccentHsl()})`),
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(geometry, material);
  halo.rotation.x = Math.PI / 2;
  return halo;
}
