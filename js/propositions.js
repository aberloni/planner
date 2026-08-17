// Propositions d'agencement : une proposition est définie au niveau du
// PROJET (voir js/projets.js), partagée par tous ses plans (étages d'un
// même lieu) — une proposition du même nom (ex. "Option A") retrouvée sur
// chaque plan désigne la MÊME proposition, avec sa propre disposition de
// meubles par plan (`meublesParPlan[planId]`). Le blueprint et l'habillage
// restent propres à chaque plan.
//
// Bascule : Meubles.liste est toujours la liste de la proposition ACTIVE
// pour le plan affiché (`Propositions.planId`). Au changement de
// proposition ou de plan, on recopie Meubles.liste vers
// meublesParPlan[planId] de la proposition qu'on quitte
// (_sauvegarderMeublesCourante), puis on recharge Meubles avec les meubles
// de la proposition qu'on active pour ce plan (vide si elle n'a encore rien
// sur ce plan).
const Propositions = {

  liste: [], // [{ id, nom, meublesParPlan: { [planId]: [] } }]
  courante: null,
  planId: null, // id (ou fichier) du plan actuellement affiché
  label: null, // <span>, barre d'outils : nom (lecture seule) de la proposition active
  listeConteneur: null, // <div>, menu kebab : un bouton par proposition pour basculer
  fermerMenu: null, // callback fourni par app.js pour refermer le menu kebab après sélection
  ecouteurs: [],

  init(elements) {
    this.label = elements.label;
    this.listeConteneur = elements.listeConteneur;
    this.fermerMenu = elements.fermerMenu || (() => {});
  },

  alChangement(callback) {
    this.ecouteurs.push(callback);
  },

  _notifier() {
    this.ecouteurs.forEach((callback) => callback());
  },

  // Charge les propositions du PROJET donné — une seule fois, à son
  // ouverture (voir js/app.js, ouvrirProjet), pas à chaque changement de
  // plan. Crée une proposition par défaut si le projet n'en a encore aucune.
  async chargerProjet(projetId) {
    PropositionsStockage.init(projetId);
    const liste = await PropositionsStockage.charger();
    this.liste = (liste && liste.length)
      ? liste.map((p) => ({ ...p, meublesParPlan: p.meublesParPlan || {} }))
      : [{ id: crypto.randomUUID(), nom: I18n.t("app.proposition_defaut", { n: 1 }), meublesParPlan: {} }];
    this.courante = null;
    this.planId = null;
  },

  // Affiche, pour le plan donné, la proposition active — garde la même
  // proposition (par id) qu'on affichait sur le plan précédent si elle
  // existe encore, sinon la première de la liste. Recharge Meubles avec les
  // meubles de cette proposition SUR CE PLAN (vide si elle n'y a encore
  // rien). Appelé à chaque ouverture/bascule de plan (voir js/app.js).
  activerPourPlan(planId) {
    this.planId = planId;
    const proposition = (this.courante && this.liste.includes(this.courante)) ? this.courante : this.liste[0];
    this._activer(proposition);
  },

  // Recopie Meubles.liste dans meublesParPlan[planId] de la proposition
  // active, avant sauvegarde/export (Meubles.liste peut avoir changé depuis
  // la dernière bascule de proposition/plan).
  synchroniser() {
    this._sauvegarderMeublesCourante();
  },

  // Retire toute donnée liée à un plan supprimé, de TOUTES les propositions
  // du projet (voir js/plans.js, supprimer()) — pas d'entrées orphelines.
  purgerPlan(planId) {
    if (!planId) return;
    this.liste.forEach((p) => { delete p.meublesParPlan[planId]; });
    PropositionsStockage.sauvegarder(this.liste);
  },

  // Crée une nouvelle proposition (au niveau du projet) et bascule dessus
  // pour le plan courant. `dupliquer` reprend la disposition (liste de
  // meubles + position) de la proposition active, SUR CE PLAN, comme point
  // de départ (copie indépendante, nouveaux id) ; sinon proposition vide
  // partout. Dans les deux cas modeleId reste inchangé : les prefabs du
  // catalogue restent partagés, seules les instances/positions sont propres
  // à chaque proposition — voir documentation/16-propositions.md.
  ajouter(nom, dupliquer) {
    if (!Viewport.largeurPlan) return;

    const meubles = dupliquer
      ? Meubles.liste.map((objet) => ({ ...objet, id: crypto.randomUUID() }))
      : [];

    const proposition = {
      id: crypto.randomUUID(),
      nom: nom || I18n.t("app.proposition_defaut", { n: this.liste.length + 1 }),
      meublesParPlan: this.planId ? { [this.planId]: meubles } : {}
    };
    this._sauvegarderMeublesCourante();
    this.liste.push(proposition);
    this._activer(proposition);
    Statut.definir(I18n.t("propositions.ajoutee", { nom: proposition.nom, suffixe: dupliquer ? I18n.t("propositions.disposition_dupliquee") : "" }));
  },

  // Renomme la proposition active (appelée depuis le menu kebab, via prompt()).
  renommer(nom) {
    if (!this.courante) return;
    this.courante.nom = nom || this.courante.nom;
    this._actualiserAffichage();
    Statut.definir(I18n.t("propositions.renommee", { nom: this.courante.nom }));
    this._notifier();
  },

  // Supprime la proposition active DU PROJET ENTIER (tous les plans) et
  // bascule sur une autre pour le plan courant — appelée depuis la barre
  // d'outils, confirmation déjà faite par l'appelant. Refuse de supprimer
  // la dernière proposition restante (il en faut toujours au moins une).
  supprimer() {
    if (!this.courante || this.liste.length <= 1) return;

    const index = this.liste.indexOf(this.courante);
    const nom = this.courante.nom;
    this.liste.splice(index, 1);
    const suivante = this.liste[index] || this.liste[index - 1];
    this.courante = null; // évite que _activer resauvegarde les meubles sur la proposition supprimée
    this._activer(suivante);
    Statut.definir(I18n.t("propositions.supprimee", { nom }));
  },

  basculerVers(proposition) {
    if (proposition === this.courante) return;
    this._sauvegarderMeublesCourante();
    this._activer(proposition);
  },

  _sauvegarderMeublesCourante() {
    if (this.courante && this.planId) this.courante.meublesParPlan[this.planId] = Meubles.liste;
  },

  _activer(proposition) {
    this.courante = proposition;
    Meubles.charger(proposition.meublesParPlan[this.planId] || []);
    this._actualiserAffichage();
    Statut.definir(I18n.t("propositions.active", { nom: proposition.nom }));
    this._notifier();
  },

  // Rafraîchit le label (nom de la proposition active) et la liste des
  // propositions dans le menu kebab (voir index.html, #menu-proposition-liste).
  _actualiserAffichage() {
    if (!this.courante) return;
    if (this.label) this.label.textContent = this.courante.nom;
    if (this.listeConteneur) {
      this.listeConteneur.innerHTML = "";
      this.liste.forEach((p) => {
        const bouton = document.createElement("button");
        bouton.type = "button";
        bouton.className = "menu-proposition-item" + (p === this.courante ? " actif" : "");
        bouton.textContent = p.nom;
        bouton.addEventListener("click", () => {
          this.fermerMenu();
          this.basculerVers(p);
        });
        this.listeConteneur.appendChild(bouton);
      });
    }
  }
};
