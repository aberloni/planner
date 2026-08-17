// Persistance des PROPOSITIONS d'un PROJET (voir js/projets.js), partagées
// par tous ses plans (étages d'un même lieu) — même principe que
// js/catalogue-stockage.js : un singleton par projet, pas une liste.
//
// Mêmes deux modes que CatalogueStockage, détectés automatiquement,
// toujours SCOPÉS au projet courant (`PropositionsStockage.projetId`, fixé
// par init()) :
// - MODE_LOCAL (file://) : une entrée localStorage unique par projet.
// - MODE_FICHIERS (http/https) : un seul fichier
//   projets/<projetId>/propositions.json, lu directement, écrit via
//   php/propositions-sauvegarder.php.
const PropositionsStockage = {

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
    return `planner-propositions-${this.projetId}`;
  },

  // Retourne la liste des propositions du projet, ou [] si rien n'a encore
  // été sauvegardé.
  async charger() {
    return this.mode === this.MODE_LOCAL ? this._chargerLocal() : this._chargerFichier();
  },

  sauvegarder(liste) {
    return this.mode === this.MODE_LOCAL
      ? this._sauvegarderLocal(liste)
      : this._sauvegarderFichier(liste);
  },

  _chargerLocal() {
    try {
      const brut = localStorage.getItem(this._cleLocal());
      return brut ? JSON.parse(brut) : [];
    } catch (erreur) {
      return [];
    }
  },

  _sauvegarderLocal(liste) {
    try {
      localStorage.setItem(this._cleLocal(), JSON.stringify(liste));
    } catch (erreur) {
      console.warn("Sauvegarde des propositions impossible :", erreur);
    }
  },

  async _chargerFichier() {
    try {
      const reponse = await fetch(`projets/${encodeURIComponent(this.projetId)}/propositions.json`, { cache: "no-store" });
      if (!reponse.ok) return [];
      return await reponse.json();
    } catch (erreur) {
      return [];
    }
  },

  // Best-effort, silencieuse — même logique que Plans/CatalogueStockage.
  async _sauvegarderFichier(liste) {
    try {
      await fetch(`php/propositions-sauvegarder.php?projet=${encodeURIComponent(this.projetId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(liste)
      });
    } catch (erreur) {
      // silencieux
    }
  }
};
