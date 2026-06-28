const cache = {};

async function loadSystem(system) {
  if (cache[system]) return cache[system];
  try {
    const resp = await fetch(`./data/displayNames/${system}.json`);
    if (!resp.ok) {
      console.warn(`displayNames: ${system}.json nu a fost găsit (${resp.status})`);
      cache[system] = {};
      return cache[system];
    }
    const names = await resp.json();
    cache[system] = names;
    return names;
  } catch (e) {
    console.warn(`displayNames: eroare la ${system}.json`, e);
    cache[system] = {};
    return cache[system];
  }
}

export async function loadAllDisplayNames(systems) {
  const promises = systems.map(sys => loadSystem(sys));
  await Promise.all(promises);
  console.log('📝 Display names încărcate pentru:', Object.keys(cache).length, 'sisteme');
  return cache;
}

export function getDisplayName(structure) {
  if (!structure) return '?';
  const id = structure.id;          // id normalizat din loader (ex: "deep_branch_of_transverse_cervical_artery_l")
  const system = structure.system;
  if (!id || !system || !cache[system]) {
    return structure.name || structure.id || '?';
  }

  // 1. Potrivire exactă
  if (cache[system][id]) {
    return cache[system][id];
  }

  // 2. Caută normalizând cheile din cache pentru a le compara cu id-ul normalizat
  //    (id-ul e deja normalizat, iar cheile din JSON pot avea paranteze, majuscule etc.)
  for (const key of Object.keys(cache[system])) {
    // normalizează cheia exact ca în loader: litere mici, caractere non-alfanumerice → underscore
    const normKey = key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    if (normKey === id) {
      return cache[system][key];
    }
  }

  // 3. Fallback la numele original
  return structure.name || structure.id || '?';
}