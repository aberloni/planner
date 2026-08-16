// Couche de données du choix de plan (voir documentation/20-plans.md).
// Un "plan" = un Projet complet (voir js/app.js, construireProjet()),
// choisi au démarrage sur l'écran d'accueil (js/selecteur-plans.js). Sert
// aussi à représenter les étages d'un même lieu (un plan par étage).
//
// Deux modes, détectés automatiquement, jamais mélangés, tous deux en CRUD
// complet depuis l'écran d'accueil :
// - MODE_LOCAL (ouverture en file://) : plans stockés dans localStorage.
// - MODE_FICHIERS (servi en http/https) : plans = fichiers .json du
//   dossier plans/, lus/écrits via les scripts PHP du même dossier
//   (liste.php, sauvegarder.php, renommer.php, supprimer.php) — nécessite
//   un hébergement compatible PHP.
const Plans = {

  MODE_LOCAL: "local",
  MODE_FICHIERS: "fichiers",

  CLE_INDEX: "planner-plans",
  PREFIXE_PLAN: "planner-plan-",
  CLE_DERNIER: "planner-dernier-plan",

  mode: null,

  init() {
    this.mode = location.protocol === "file:" ? this.MODE_LOCAL : this.MODE_FICHIERS;
    if (this.mode === this.MODE_LOCAL) this._migrerAncienneSauvegarde();
    return this.mode;
  },

  // Liste légère (sans l'image du blueprint) pour les cartes de l'écran d'accueil.
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

  supprimer(plan) {
    return this.mode === this.MODE_LOCAL
      ? this._supprimerLocal(plan.id)
      : this._supprimerFichier(plan.fichier);
  },

  // Dernier plan ouvert (n'importe quel mode) : permet de bypasser l'écran
  // de choix au démarrage (voir js/app.js, demarrerSelectionPlan).
  // Mémorisé seulement une fois qu'un blueprint est réellement chargé/
  // sauvegardé (pas pour un plan "nouveau" encore vide), pour ne jamais
  // pointer vers un plan qui échouerait au rechargement.
  memoriserDernier(plan) {
    try {
      const id = plan && (plan.id || plan.fichier);
      if (id) localStorage.setItem(this.CLE_DERNIER, id);
    } catch (erreur) {
      // silencieux
    }
  },

  dernierPlanId() {
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
      console.warn("Index des plans non sauvegardé :", erreur);
    }
  },

  _listerLocal() {
    return this._lireIndex()
      .map((entree) => {
        const projet = this._chargerLocal(entree.id);
        return {
          id: entree.id,
          nom: entree.nom || entree.id,
          propositions: (projet && projet.propositions || []).map((p) => p.nom),
          modifie: entree.modifie || 0
        };
      })
      .sort((a, b) => b.modifie - a.modifie);
  },

  _chargerLocal(id) {
    try {
      return JSON.parse(localStorage.getItem(this.PREFIXE_PLAN + id));
    } catch (erreur) {
      return null;
    }
  },

  _sauvegarderLocal(id, projet) {
    try {
      localStorage.setItem(this.PREFIXE_PLAN + id, JSON.stringify(projet));
      const index = this._lireIndex();
      const entree = index.find((s) => s.id === id);
      if (entree) entree.modifie = Date.now();
      this._ecrireIndex(index);
    } catch (erreur) {
      console.warn("Sauvegarde de plan impossible :", erreur);
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
    localStorage.removeItem(this.PREFIXE_PLAN + id);
  },

  // Migration ponctuelle : reprend l'ancienne sauvegarde mono-plan
  // (clé "planner-projet", voir js/stockage.js) comme premier plan, si
  // l'index multi-plans n'existe pas encore. Ne supprime pas l'ancienne
  // clé (filet de sécurité, coût négligeable).
  _migrerAncienneSauvegarde() {
    if (localStorage.getItem(this.CLE_INDEX)) return;
    const ancien = Stockage.charger();
    if (!ancien) return;
    const id = ancien.id || crypto.randomUUID();
    ancien.id = id;
    localStorage.setItem(this.PREFIXE_PLAN + id, JSON.stringify(ancien));
    this._ecrireIndex([{ id, nom: "Plan 1", modifie: Date.now() }]);
  },

  async _listerFichiers() {
    try {
      const reponse = await fetch("plans/liste.php");
      if (!reponse.ok) return [];
      const liste = await reponse.json();
      return liste.map((s) => ({
        id: s.fichier,
        fichier: s.fichier,
        nom: s.nom || s.id || s.fichier,
        propositions: s.propositions || [],
        modifie: (s.modifie || 0) * 1000
      }));
    } catch (erreur) {
      return [];
    }
  },

  async _chargerFichier(fichier) {
    try {
      const reponse = await fetch("plans/" + encodeURIComponent(fichier));
      if (!reponse.ok) return null;
      return await reponse.json();
    } catch (erreur) {
      return null;
    }
  },

  // Best-effort, silencieuses : plans/*.php côté serveur, Stockage
  // (localStorage) reste le filet de sécurité en mode fichiers aussi.
  async _sauvegarderFichier(fichier, projet) {
    if (!fichier) return;
    try {
      await fetch(`plans/sauvegarder.php?fichier=${encodeURIComponent(fichier)}`, {
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
      await fetch(`plans/renommer.php?fichier=${encodeURIComponent(fichier)}&nom=${encodeURIComponent(nom)}`, { method: "POST" });
    } catch (erreur) {
      // silencieux
    }
  },

  async _supprimerFichier(fichier) {
    if (!fichier) return;
    try {
      await fetch(`plans/supprimer.php?fichier=${encodeURIComponent(fichier)}`, { method: "POST" });
    } catch (erreur) {
      // silencieux
    }
  }
};
