// Persistance du catalogue GLOBAL, partagé par tous les plans (étages d'un
// même lieu) — distinct de js/plans.js, qui persiste chaque plan
// séparément. Voir documentation/17-catalogue.md.
//
// Mêmes deux modes que Plans, détectés automatiquement :
// - MODE_LOCAL (file://) : une entrée localStorage unique (le catalogue est
//   un singleton, pas une liste — pas besoin d'index comme pour les plans).
// - MODE_FICHIERS (http/https) : un seul fichier catalogue/catalogue.json,
//   lu directement, écrit via catalogue/sauvegarder.php.
const CatalogueStockage = {

  MODE_LOCAL: "local",
  MODE_FICHIERS: "fichiers",

  CLE_LOCAL: "planner-catalogue-globale",

  mode: null,

  init() {
    this.mode = location.protocol === "file:" ? this.MODE_LOCAL : this.MODE_FICHIERS;
    return this.mode;
  },

  // Retourne { id, catalogue } ou null si rien n'a encore été sauvegardé.
  async charger() {
    return this.mode === this.MODE_LOCAL ? this._chargerLocal() : this._chargerFichier();
  },

  sauvegarder(id, liste) {
    const donnees = { version: 1, id, catalogue: liste };
    return this.mode === this.MODE_LOCAL
      ? this._sauvegarderLocal(donnees)
      : this._sauvegarderFichier(donnees);
  },

  _chargerLocal() {
    try {
      const brut = localStorage.getItem(this.CLE_LOCAL);
      return brut ? JSON.parse(brut) : null;
    } catch (erreur) {
      return null;
    }
  },

  _sauvegarderLocal(donnees) {
    try {
      localStorage.setItem(this.CLE_LOCAL, JSON.stringify(donnees));
    } catch (erreur) {
      console.warn("Sauvegarde du catalogue global impossible :", erreur);
    }
  },

  async _chargerFichier() {
    try {
      const reponse = await fetch("catalogue/catalogue.json", { cache: "no-store" });
      if (!reponse.ok) return null;
      return await reponse.json();
    } catch (erreur) {
      return null;
    }
  },

  // Best-effort, silencieuse — même logique que Plans/Stockage.
  async _sauvegarderFichier(donnees) {
    try {
      await fetch("catalogue/sauvegarder.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees)
      });
    } catch (erreur) {
      // silencieux
    }
  }
};
