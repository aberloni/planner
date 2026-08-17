// Persistance du catalogue d'un PROJET (voir js/projets.js), partagé par
// tous ses plans (étages d'un même lieu) — distinct de js/plans.js, qui
// persiste chaque plan séparément. Voir documentation/17-catalogue.md.
//
// Mêmes deux modes que Plans, détectés automatiquement, toujours SCOPÉS au
// projet courant (`CatalogueStockage.projetId`, fixé par init()) :
// - MODE_LOCAL (file://) : une entrée localStorage unique par projet (le
//   catalogue d'un projet est un singleton, pas une liste).
// - MODE_FICHIERS (http/https) : un seul fichier
//   projets/<projetId>/catalogue.json, lu directement, écrit via
//   php/catalogue-sauvegarder.php.
const CatalogueStockage = {

  MODE_LOCAL: "local",
  MODE_FICHIERS: "fichiers",

  projetId: null,
  mode: null,

  init(projetId) {
    this.mode = location.protocol === "file:" ? this.MODE_LOCAL : this.MODE_FICHIERS;
    this.projetId = projetId;
    return this.mode;
  },

  _cleLocal() {
    return `planner-catalogue-${this.projetId}`;
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
      const brut = localStorage.getItem(this._cleLocal());
      return brut ? JSON.parse(brut) : null;
    } catch (erreur) {
      return null;
    }
  },

  _sauvegarderLocal(donnees) {
    try {
      localStorage.setItem(this._cleLocal(), JSON.stringify(donnees));
    } catch (erreur) {
      console.warn("Sauvegarde du catalogue impossible :", erreur);
    }
  },

  async _chargerFichier() {
    try {
      const reponse = await fetch(`projets/${encodeURIComponent(this.projetId)}/catalogue.json`, { cache: "no-store" });
      if (!reponse.ok) return null;
      return await reponse.json();
    } catch (erreur) {
      return null;
    }
  },

  // Best-effort, silencieuse — même logique que Plans/Stockage.
  async _sauvegarderFichier(donnees) {
    try {
      await fetch(`php/catalogue-sauvegarder.php?projet=${encodeURIComponent(this.projetId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees)
      });
    } catch (erreur) {
      // silencieux
    }
  }
};
