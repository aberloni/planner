// Couche de données du choix de plan (voir documentation/20-plans.md).
// Un "plan" = un Plan complet (voir js/app.js, construireProjet()), choisi
// une fois un projet ouvert (voir js/projets.js) sur l'écran de choix
// (js/selecteur-plans.js). Représente un étage d'un même lieu (le
// "projet") — plusieurs plans d'un même projet partagent son catalogue
// (voir js/catalogue-stockage.js).
//
// Deux modes, détectés automatiquement, jamais mélangés, tous deux en CRUD
// complet depuis l'écran de choix. Toujours SCOPÉS au projet courant
// (`Plans.projetId`, fixé par init()) :
// - MODE_LOCAL (ouverture en file://) : plans stockés dans localStorage,
//   sous des clés préfixées par l'id du projet.
// - MODE_FICHIERS (servi en http/https) : plans = fichiers .json du
//   dossier projets/<projetId>/plans/, lus/écrits via les scripts PHP
//   préfixés `plan-` du dossier php/ — nécessite un hébergement compatible
//   PHP.
const Plans = {

  MODE_LOCAL: "local",
  MODE_FICHIERS: "fichiers",

  projetId: null,
  mode: null,
  _alerteEchecAffichee: false, // évite de spammer alert() à chaque édition tant que le stockage reste plein

  init(projetId) {
    this.mode = location.protocol === "file:" ? this.MODE_LOCAL : this.MODE_FICHIERS;
    this.projetId = projetId;
    return this.mode;
  },

  _cleIndex() {
    return `planner-plans-${this.projetId}`;
  },

  _clePlan(id) {
    return `planner-plan-${this.projetId}-${id}`;
  },

  // Liste légère (sans l'image du blueprint) pour les cartes de l'écran de choix.
  async lister() {
    return this.mode === this.MODE_LOCAL ? this._listerLocal() : this._listerFichiers();
  },

  // Recharge le projet complet d'un plan (entrée retournée par lister()).
  async charger(plan) {
    return this.mode === this.MODE_LOCAL
      ? this._chargerLocal(plan.id)
      : this._chargerFichier(plan.fichier);
  },

  // Persistance en continu pendant l'édition (à chaque modification).
  sauvegarder(plan, projet) {
    if (!plan) return;
    return this.mode === this.MODE_LOCAL
      ? this._sauvegarderLocal(plan.id, projet)
      : this._sauvegarderFichier(plan.fichier, projet);
  },

  // MODE_LOCAL uniquement : crée une entrée vide dans l'index et retourne son
  // id. En MODE_FICHIERS, le fichier est simplement désigné côté client
  // (voir js/app.js) et n'existe vraiment qu'à la première sauvegarde.
  creer(nom) {
    const id = crypto.randomUUID();
    const index = this._lireIndex();
    index.push({ id, nom, modifie: Date.now() });
    this._ecrireIndex(index);
    return id;
  },

  renommer(plan, nom) {
    return this.mode === this.MODE_LOCAL
      ? this._renommerLocal(plan.id, nom)
      : this._renommerFichier(plan.fichier, nom);
  },

  // Purge aussi les données de ce plan dans les propositions du projet
  // (`meublesParPlan[planId]`, voir js/propositions.js) — pas d'entrées
  // orphelines une fois le plan supprimé.
  supprimer(plan) {
    Propositions.purgerPlan(plan.id || plan.fichier);
    return this.mode === this.MODE_LOCAL
      ? this._supprimerLocal(plan.id)
      : this._supprimerFichier(plan.fichier);
  },

  _lireIndex() {
    try {
      return JSON.parse(localStorage.getItem(this._cleIndex())) || [];
    } catch (erreur) {
      return [];
    }
  },

  _ecrireIndex(index) {
    try {
      localStorage.setItem(this._cleIndex(), JSON.stringify(index));
    } catch (erreur) {
      console.warn("Index des plans non sauvegardé :", erreur);
    }
  },

  _listerLocal() {
    return this._lireIndex()
      .map((entree) => ({
        id: entree.id,
        nom: entree.nom || entree.id,
        modifie: entree.modifie || 0
      }))
      .sort((a, b) => b.modifie - a.modifie);
  },

  _chargerLocal(id) {
    try {
      return JSON.parse(localStorage.getItem(this._clePlan(id)));
    } catch (erreur) {
      return null;
    }
  },

  // En cas d'échec (le plus souvent : quota localStorage dépassé, ex.
  // beaucoup de plans avec blueprint dans ce navigateur), alerte
  // immédiatement au lieu d'échouer en silence — sinon le plan a l'air de se
  // sauvegarder normalement pendant toute l'édition, et l'échec ne se
  // découvre qu'au rechargement suivant ("impossible de charger ce plan").
  _sauvegarderLocal(id, projet) {
    try {
      localStorage.setItem(this._clePlan(id), JSON.stringify(projet));
      const index = this._lireIndex();
      const entree = index.find((s) => s.id === id);
      if (entree) entree.modifie = Date.now();
      this._ecrireIndex(index);
    } catch (erreur) {
      console.warn("Sauvegarde de plan impossible :", erreur);
      if (!this._alerteEchecAffichee) {
        this._alerteEchecAffichee = true;
        alert(I18n.t("app.sauvegarde_plan_echec", { erreur: erreur && erreur.message ? erreur.message : erreur }));
      }
    }
  },

  _renommerLocal(id, nom) {
    const index = this._lireIndex();
    const entree = index.find((s) => s.id === id);
    if (!entree) return;
    entree.nom = nom;
    this._ecrireIndex(index);
  },

  _supprimerLocal(id) {
    this._ecrireIndex(this._lireIndex().filter((s) => s.id !== id));
    localStorage.removeItem(this._clePlan(id));
  },

  async _listerFichiers() {
    try {
      const reponse = await fetch(`php/plan-liste.php?projet=${encodeURIComponent(this.projetId)}`);
      if (!reponse.ok) return [];
      const liste = await reponse.json();
      return liste.map((s) => ({
        id: s.fichier,
        fichier: s.fichier,
        nom: s.nom || s.id || s.fichier,
        modifie: (s.modifie || 0) * 1000
      }));
    } catch (erreur) {
      return [];
    }
  },

  async _chargerFichier(fichier) {
    try {
      const reponse = await fetch(`projets/${encodeURIComponent(this.projetId)}/plans/${encodeURIComponent(fichier)}`);
      if (!reponse.ok) return null;
      return await reponse.json();
    } catch (erreur) {
      return null;
    }
  },

  // Best-effort, silencieuses : php/plan-*.php côté serveur, Stockage
  // (localStorage) reste le filet de sécurité en mode fichiers aussi.
  async _sauvegarderFichier(fichier, projet) {
    if (!fichier) return;
    try {
      await fetch(`php/plan-sauvegarder.php?projet=${encodeURIComponent(this.projetId)}&fichier=${encodeURIComponent(fichier)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projet)
      });
    } catch (erreur) {
      // silencieux
    }
  },

  async _renommerFichier(fichier, nom) {
    if (!fichier) return;
    try {
      await fetch(`php/plan-renommer.php?projet=${encodeURIComponent(this.projetId)}&fichier=${encodeURIComponent(fichier)}&nom=${encodeURIComponent(nom)}`, { method: "POST" });
    } catch (erreur) {
      // silencieux
    }
  },

  async _supprimerFichier(fichier) {
    if (!fichier) return;
    try {
      await fetch(`php/plan-supprimer.php?projet=${encodeURIComponent(this.projetId)}&fichier=${encodeURIComponent(fichier)}`, { method: "POST" });
    } catch (erreur) {
      // silencieux
    }
  }
};
