// Barre latérale (ancrée à gauche, pleine hauteur) pour changer de plan
// sans revenir à l'écran d'accueil (voir js/selecteur-plans.js pour cet
// écran, même couche de données via js/plans.js).
const SidebarPlans = {

  liste: null,
  boutonNouveau: null,
  idActuel: null,
  callbackChoix: null,
  callbackNouveau: null,
  callbackRenommer: null,

  init(elements) {
    this.liste = elements.liste;
    this.boutonNouveau = elements.boutonNouveau;
    this.boutonNouveau.addEventListener("click", () => this._creerPlan());
  },

  alChoix(callback) {
    this.callbackChoix = callback;
  },

  alNouveau(callback) {
    this.callbackNouveau = callback;
  },

  // callback(plan, nouveauNom) appelé après un renommage réussi, pour que
  // l'appelant puisse mettre à jour son propre libellé si c'est le plan en
  // cours qui a été renommé.
  alRenommer(callback) {
    this.callbackRenommer = callback;
  },

  async rafraichir(idActuel) {
    this.idActuel = idActuel;
    this._rendre(await Plans.lister());
  },

  _rendre(liste) {
    this.liste.innerHTML = "";
    if (!liste.length) {
      const vide = document.createElement("div");
      vide.className = "sidebar-plans-vide";
      vide.textContent = I18n.t("sidebar_plans.aucun_plan");
      this.liste.appendChild(vide);
      return;
    }
    liste.forEach((plan) => this.liste.appendChild(this._item(plan)));
  },

  _item(plan) {
    const actif = plan.id === this.idActuel;

    const item = document.createElement("div");
    item.className = "sidebar-plan-item" + (actif ? " actif" : "");

    const nom = document.createElement("div");
    nom.className = "sidebar-plan-nom";
    nom.textContent = plan.nom;

    // Nombre d'éléments placés sur CE plan, pour la proposition ACTIVE
    // (voir js/propositions.js, meublesParPlan) — Propositions.liste est
    // déjà en mémoire (projet ouvert avant d'atteindre la sidebar), pas
    // besoin de recharger quoi que ce soit ici.
    if (typeof Propositions !== "undefined" && Propositions.courante) {
      const compte = document.createElement("span");
      compte.className = "sidebar-plan-compte";
      compte.textContent = (Propositions.courante.meublesParPlan[plan.id] || []).length;
      nom.appendChild(compte);
    }

    item.appendChild(nom);

    if (plan.modifie) {
      const date = document.createElement("div");
      date.className = "sidebar-plan-date";
      date.textContent = new Date(plan.modifie).toLocaleString(I18n.langue === "en" ? "en-US" : "fr-FR");
      item.appendChild(date);
    }

    if (!actif) {
      item.addEventListener("click", () => this.callbackChoix(plan));
    }
    item.appendChild(this._actions(plan));

    return item;
  },

  _actions(plan) {
    const actions = document.createElement("div");
    actions.className = "sidebar-plan-actions";

    const renommer = document.createElement("button");
    renommer.type = "button";
    renommer.title = I18n.t("commun.renommer");
    renommer.textContent = "✎";
    renommer.addEventListener("click", async (evenement) => {
      evenement.stopPropagation();
      const nouveauNom = prompt(I18n.t("plans.renommer_prompt"), plan.nom);
      if (!nouveauNom) return;
      const nom = nouveauNom.trim();
      await Plans.renommer(plan, nom);
      if (this.callbackRenommer) this.callbackRenommer(plan, nom);
      this.rafraichir(this.idActuel);
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
      if (plan.id === this.idActuel) {
        // Le plan ouvert vient d'être supprimé : retour à l'écran de choix.
        location.reload();
        return;
      }
      this.rafraichir(this.idActuel);
    });
    actions.appendChild(supprimer);

    return actions;
  },

  _creerPlan() {
    const nom = prompt(I18n.t("plans.nouveau_nom_prompt"), I18n.t("plans.nouveau_nom_defaut"));
    if (nom === null) return;
    this.callbackNouveau(nom.trim() || I18n.t("plans.nouveau_nom_defaut"));
  }
};
