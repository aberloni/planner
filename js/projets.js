// Couche de données du choix de PROJET (voir documentation/21-projets.md).
// Un "projet" = un lieu (maison, client...), le plus haut niveau de la
// hiérarchie projet > plan (étage) > proposition (agencement) — voir
// js/plans.js et js/propositions.js. Choisi au démarrage sur l'écran
// d'accueil (js/selecteur-projets.js).
//
// Deux modes, détectés automatiquement, jamais mélangés, CRUD complet :
// - MODE_LOCAL (ouverture en file://) : projets stockés dans localStorage.
// - MODE_FICHIERS (servi en http/https) : projets = fichiers .json du
//   dossier projets/, lus/écrits via php/projet-*.php — nécessite un
//   hébergement compatible PHP. Chaque projet possède aussi un
//   sous-dossier projets/<id>/ (plans/*.json + catalogue.json), géré par
//   js/plans.js et js/catalogue-stockage.js une fois le projet ouvert.
const Projets = {

  MODE_LOCAL: "local",
  MODE_FICHIERS: "fichiers",

  CLE_INDEX: "planner-projets",
  CLE_DERNIER: "planner-dernier-projet",

  mode: null,

  init() {
    this.mode = location.protocol === "file:" ? this.MODE_LOCAL : this.MODE_FICHIERS;
    return this.mode;
  },

  async lister() {
    return this.mode === this.MODE_LOCAL ? this._listerLocal() : this._listerFichiers();
  },

  // Crée et sauvegarde immédiatement un projet (pas de contenu lourd à
  // différer, contrairement à un plan/son blueprint — voir Plans.creer) et
  // retourne son entrée { id, nom, modifie }.
  creer(nom) {
    const entree = { id: crypto.randomUUID(), nom, modifie: Date.now() };
    if (this.mode === this.MODE_LOCAL) {
      const index = this._lireIndex();
      index.push(entree);
      this._ecrireIndex(index);
    } else {
      this._sauvegarderFichier(entree);
    }
    return entree;
  },

  renommer(projet, nom) {
    return this.mode === this.MODE_LOCAL
      ? this._renommerLocal(projet.id, nom)
      : this._renommerFichier(projet.id, nom);
  },

  supprimer(projet) {
    return this.mode === this.MODE_LOCAL
      ? this._supprimerLocal(projet.id)
      : this._supprimerFichier(projet.id);
  },

  // Dernier projet ouvert : permet de bypasser l'écran de choix au
  // démarrage (contrairement au choix de plan à l'intérieur d'un projet,
  // toujours réaffiché — voir js/app.js, ouvrirProjet).
  memoriserDernier(projet) {
    try {
      if (projet && projet.id) localStorage.setItem(this.CLE_DERNIER, projet.id);
    } catch (erreur) {
      // silencieux
    }
  },

  dernierProjetId() {
    try {
      return localStorage.getItem(this.CLE_DERNIER);
    } catch (erreur) {
      return null;
    }
  },

  oublierDernier() {
    try {
      localStorage.removeItem(this.CLE_DERNIER);
    } catch (erreur) {
      // silencieux
    }
  },

  _lireIndex() {
    try {
      return JSON.parse(localStorage.getItem(this.CLE_INDEX)) || [];
    } catch (erreur) {
      return [];
    }
  },

  _ecrireIndex(index) {
    try {
      localStorage.setItem(this.CLE_INDEX, JSON.stringify(index));
    } catch (erreur) {
      console.warn("Index des projets non sauvegardé :", erreur);
    }
  },

  _listerLocal() {
    return this._lireIndex().slice()
      .sort((a, b) => (b.modifie || 0) - (a.modifie || 0))
      .map((p) => ({ ...p, nbPlans: this._compterPlansLocal(p.id) }));
  },

  _compterPlansLocal(id) {
    try {
      return (JSON.parse(localStorage.getItem(`planner-plans-${id}`)) || []).length;
    } catch (erreur) {
      return 0;
    }
  },

  _renommerLocal(id, nom) {
    const index = this._lireIndex();
    const entree = index.find((p) => p.id === id);
    if (!entree) return;
    entree.nom = nom;
    this._ecrireIndex(index);
  },

  // Supprime le projet ET purge ses plans/catalogue localStorage (clés
  // préfixées par son id, voir js/plans.js/js/catalogue-stockage.js) —
  // pas de données orphelines.
  _supprimerLocal(id) {
    this._ecrireIndex(this._lireIndex().filter((p) => p.id !== id));
    const prefixePlan = `planner-plan-${id}-`;
    const clesExactes = new Set([
      `planner-plans-${id}`,
      `planner-catalogue-${id}`,
      `planner-propositions-${id}`,
      `planner-dernier-plan-${id}`
    ]);
    Object.keys(localStorage).forEach((cle) => {
      if (clesExactes.has(cle) || cle.startsWith(prefixePlan)) localStorage.removeItem(cle);
    });
  },

  async _listerFichiers() {
    try {
      const reponse = await fetch("php/projet-liste.php");
      if (!reponse.ok) return [];
      return await reponse.json();
    } catch (erreur) {
      return [];
    }
  },

  // Best-effort, silencieuses : php/projet-*.php côté serveur.
  async _sauvegarderFichier(entree) {
    try {
      await fetch("php/projet-sauvegarder.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entree)
      });
    } catch (erreur) {
      // silencieux
    }
  },

  async _renommerFichier(id, nom) {
    try {
      await fetch(`php/projet-renommer.php?id=${encodeURIComponent(id)}&nom=${encodeURIComponent(nom)}`, { method: "POST" });
    } catch (erreur) {
      // silencieux
    }
  },

  async _supprimerFichier(id) {
    try {
      await fetch(`php/projet-supprimer.php?id=${encodeURIComponent(id)}`, { method: "POST" });
    } catch (erreur) {
      // silencieux
    }
  }
};
