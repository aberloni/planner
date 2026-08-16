// Écran d'accueil : choix d'un plan parmi ceux disponibles (voir
// js/plans.js et documentation/20-plans.md). Affiché au démarrage, avant
// tout chargement de projet.
const SelecteurPlans = {

  overlay: null,
  grille: null,
  boutonNouveau: null,
  callback: null,

  init(elements) {
    this.overlay = elements.overlay;
    this.grille = elements.grille;
    this.boutonNouveau = elements.boutonNouveau;
    this.boutonNouveau.addEventListener("click", () => this._creerPlan());
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

    const detail = document.createElement("div");
    detail.className = "plan-carte-detail";
    detail.textContent = plan.propositions.length
      ? plan.propositions.join(", ")
      : I18n.t("plans.aucune_proposition");
    carte.appendChild(detail);

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
