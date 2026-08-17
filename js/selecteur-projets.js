// Écran d'accueil : choix d'un projet parmi ceux disponibles (voir
// js/projets.js et documentation/21-projets.md). Affiché au démarrage,
// avant même le choix de plan (js/selecteur-plans.js).
const SelecteurProjets = {

  overlay: null,
  grille: null,
  boutonNouveau: null,
  callback: null,
  callbackImporter: null,
  callbackExporter: null,

  init(elements) {
    this.overlay = elements.overlay;
    this.grille = elements.grille;
    this.boutonNouveau = elements.boutonNouveau;
    this.boutonNouveau.addEventListener("click", () => this._creerProjet());

    // Importer un projet complet déjà exporté ailleurs (voir
    // js/app.js, exporterProjet()) sans avoir à en ouvrir un d'abord.
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
  // "Importer un projet...".
  alImporter(callback) {
    this.callbackImporter = callback;
  },

  // callback(projet) appelé au clic sur l'action "Exporter" d'une carte.
  alExporter(callback) {
    this.callbackExporter = callback;
  },

  // Affiche l'écran avec la liste donnée ; `callback(projet)` est appelé au
  // choix d'une carte. `projet` = soit une entrée de Projets.lister(), soit
  // { nouveau: true, nom } pour "+ Nouveau projet".
  afficher(liste, callback) {
    this.callback = callback;
    this._rendre(liste);
    document.body.classList.add("choix-projet");
  },

  masquer() {
    document.body.classList.remove("choix-projet");
  },

  async _rafraichir() {
    this._rendre(await Projets.lister());
  },

  _rendre(liste) {
    this.grille.innerHTML = "";
    liste.forEach((projet) => this.grille.appendChild(this._carteProjet(projet)));
  },

  _carteProjet(projet) {
    const carte = document.createElement("div");
    carte.className = "plan-carte";

    const nom = document.createElement("div");
    nom.className = "plan-carte-nom";
    nom.textContent = projet.nom;
    carte.appendChild(nom);

    const detail = document.createElement("div");
    detail.className = "plan-carte-detail";
    detail.textContent = projet.nbPlans
      ? I18n.t("projets.n_plans", { n: projet.nbPlans })
      : I18n.t("projets.aucun_plan");
    carte.appendChild(detail);

    if (projet.modifie) {
      const date = document.createElement("div");
      date.className = "plan-carte-date";
      date.textContent = I18n.t("projets.modifie_le", { date: new Date(projet.modifie).toLocaleString(I18n.langue === "en" ? "en-US" : "fr-FR") });
      carte.appendChild(date);
    }

    carte.addEventListener("click", () => this.callback(projet));
    carte.appendChild(this._actions(projet));

    return carte;
  },

  _actions(projet) {
    const actions = document.createElement("div");
    actions.className = "plan-carte-actions";

    const exporter = document.createElement("button");
    exporter.type = "button";
    exporter.title = I18n.t("projets.exporter_title");
    exporter.innerHTML = '<img class="barre-icone" src="icones/ui/enregistrer.svg" alt="">';
    exporter.addEventListener("click", (evenement) => {
      evenement.stopPropagation();
      if (this.callbackExporter) this.callbackExporter(projet);
    });
    actions.appendChild(exporter);

    const renommer = document.createElement("button");
    renommer.type = "button";
    renommer.title = I18n.t("commun.renommer");
    renommer.textContent = "✎";
    renommer.addEventListener("click", async (evenement) => {
      evenement.stopPropagation();
      const nouveauNom = prompt(I18n.t("projets.renommer_prompt"), projet.nom);
      if (!nouveauNom) return;
      await Projets.renommer(projet, nouveauNom.trim());
      this._rafraichir();
    });
    actions.appendChild(renommer);

    const supprimer = document.createElement("button");
    supprimer.type = "button";
    supprimer.title = I18n.t("commun.supprimer");
    supprimer.innerHTML = '<img class="icone-supprimer" src="icones/ui/supprimer.svg" alt="">';
    supprimer.addEventListener("click", async (evenement) => {
      evenement.stopPropagation();
      if (!confirm(I18n.t("projets.supprimer_confirm", { nom: projet.nom }))) return;
      await Projets.supprimer(projet);
      this._rafraichir();
    });
    actions.appendChild(supprimer);

    return actions;
  },

  _creerProjet() {
    const nom = prompt(I18n.t("projets.nouveau_nom_prompt"), I18n.t("projets.nouveau_nom_defaut"));
    if (nom === null) return;
    this.callback({ nouveau: true, nom: nom.trim() || I18n.t("projets.nouveau_nom_defaut") });
  }
};
