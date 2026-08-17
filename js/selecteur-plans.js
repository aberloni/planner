// Écran d'accueil : choix d'un plan parmi ceux disponibles (voir
// js/plans.js et documentation/20-plans.md). Affiché au démarrage, avant
// tout chargement de projet.
const SelecteurPlans = {

  overlay: null,
  grille: null,
  boutonNouveau: null,
  boutonImporter: null,
  inputImporter: null,
  callback: null,
  callbackImporter: null,

  init(elements) {
    this.overlay = elements.overlay;
    this.grille = elements.grille;
    this.boutonNouveau = elements.boutonNouveau;
    this.boutonNouveau.addEventListener("click", () => this._creerPlan());

    // Importer des plans déjà exportés ailleurs (voir documentation/20-plans.md)
    // dans le projet en cours, sans passer par "Ouvrir un projet..." (qui crée
    // un nouveau projet quand le fichier est un paquet multi-plans).
    this.boutonImporter = elements.boutonImporter;
    this.inputImporter = elements.inputImporter;
    this.boutonImporter.addEventListener("click", () => this.inputImporter.click());
    this.inputImporter.addEventListener("change", () => {
      const fichier = this.inputImporter.files[0];
      if (fichier && this.callbackImporter) this.callbackImporter(fichier);
      this.inputImporter.value = "";
    });
  },

  // callback(fichier) appelé quand l'utilisateur choisit un fichier via
  // "Importer des plans...".
  alImporter(callback) {
    this.callbackImporter = callback;
  },

  // Alias public de _rafraichir(), pour permettre à l'appelant (voir
  // js/app.js) de remettre l'écran à jour après un import.
  rafraichir() {
    return this._rafraichir();
  },

  // Affiche l'écran avec la liste donnée ; `callback(plan)` est appelé au
  // choix d'une carte. `plan` = soit une entrée de Plans.lister(), soit
  // { nouveau: true, nom } pour "+ Nouveau plan".
  afficher(liste, callback) {
    this.callback = callback;
    this._rendre(liste);
    document.body.classList.add("choix-plan");
  },

  masquer() {
    document.body.classList.remove("choix-plan");
  },

  async _rafraichir() {
    this._rendre(await Plans.lister());
  },

  _rendre(liste) {
    this.grille.innerHTML = "";
    liste.forEach((plan) => this.grille.appendChild(this._cartePlan(plan)));
  },

  _cartePlan(plan) {
    const carte = document.createElement("div");
    carte.className = "plan-carte";

    const nom = document.createElement("div");
    nom.className = "plan-carte-nom";
    nom.textContent = plan.nom;
    carte.appendChild(nom);

    const pastilles = this._pastillesPropositions(plan);
    if (pastilles) carte.appendChild(pastilles);

    if (plan.modifie) {
      const date = document.createElement("div");
      date.className = "plan-carte-date";
      date.textContent = I18n.t("plans.modifie_le", { date: new Date(plan.modifie).toLocaleString(I18n.langue === "en" ? "en-US" : "fr-FR") });
      carte.appendChild(date);
    }

    carte.addEventListener("click", () => this.callback(plan));
    carte.appendChild(this._actions(plan));

    return carte;
  },

  // Une pastille par proposition du projet (voir js/propositions.js) ayant
  // déjà des meubles SUR CE plan (`meublesParPlan[plan.id]`) — première
  // lettre de son nom. Propositions.liste est déjà chargée (projet ouvert
  // avant d'atteindre cet écran, voir js/app.js, ouvrirProjet), pas besoin
  // de recharger quoi que ce soit ici.
  _pastillesPropositions(plan) {
    if (typeof Propositions === "undefined") return null;
    const avecContenu = Propositions.liste.filter((p) => (p.meublesParPlan[plan.id] || []).length > 0);
    if (!avecContenu.length) return null;

    const conteneur = document.createElement("div");
    conteneur.className = "plan-carte-pastilles";
    avecContenu.forEach((proposition) => {
      const pastille = document.createElement("span");
      pastille.className = "plan-carte-pastille";
      pastille.textContent = (proposition.nom || "?").trim().charAt(0).toUpperCase();
      pastille.title = proposition.nom;
      conteneur.appendChild(pastille);
    });
    return conteneur;
  },

  _actions(plan) {
    const actions = document.createElement("div");
    actions.className = "plan-carte-actions";

    const renommer = document.createElement("button");
    renommer.type = "button";
    renommer.title = I18n.t("commun.renommer");
    renommer.textContent = "✎";
    renommer.addEventListener("click", async (evenement) => {
      evenement.stopPropagation();
      const nouveauNom = prompt(I18n.t("plans.renommer_prompt"), plan.nom);
      if (!nouveauNom) return;
      await Plans.renommer(plan, nouveauNom.trim());
      this._rafraichir();
    });
    actions.appendChild(renommer);

    const supprimer = document.createElement("button");
    supprimer.type = "button";
    supprimer.title = I18n.t("commun.supprimer");
    supprimer.innerHTML = '<img class="icone-supprimer" src="icones/ui/supprimer.svg" alt="">';
    supprimer.addEventListener("click", async (evenement) => {
      evenement.stopPropagation();
      if (!confirm(I18n.t("plans.supprimer_confirm", { nom: plan.nom }))) return;
      await Plans.supprimer(plan);
      this._rafraichir();
    });
    actions.appendChild(supprimer);

    return actions;
  },

  _creerPlan() {
    const nom = prompt(I18n.t("plans.nouveau_nom_prompt"), I18n.t("plans.nouveau_nom_defaut"));
    if (nom === null) return;
    this.callback({ nouveau: true, nom: nom.trim() || I18n.t("plans.nouveau_nom_defaut") });
  }
};
