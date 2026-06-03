let drugDb = [];

export async function loadDrugDb() {
  const res = await fetch("./data/drugs.json");
  drugDb = await res.json();
  return drugDb;
}

export function matchDrug(drugName) {
  if (!drugName || !drugDb.length) return null;
  const norm = drugName.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  for (const drug of drugDb) {
    if (drug.display.toLowerCase().includes(norm) || norm.includes(drug.id.replace(/-/g, " "))) {
      return drug;
    }
    for (const alias of drug.names) {
      if (norm.includes(alias) || alias.includes(norm.split(" ")[0])) {
        return drug;
      }
    }
  }
  return null;
}

export function getDrugById(id) {
  return drugDb.find((d) => d.id === id) || null;
}
