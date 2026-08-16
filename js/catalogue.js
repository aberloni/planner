// Catalogue partagé des objets réels d'une maison, à répartir entre les
// propositions du plan. Grandit au fil de l'eau (rien de prédéfini) : un
// objet créé depuis une proposition devient immédiatement réutilisable par
// les autres, sans avoir à le recréer — voir documentation/17-catalogue.md.
//
// Le catalogue est commun à toutes les propositions (comme le blueprint et
// l'habillage) ; seuls les PLACEMENTS (instances posées sur le plan, dans
// Meubles.liste) sont propres à chaque proposition.
const Catalogue = {

  id: null, // identifiant unique du catalogue courant, utilisé comme nom de fichier par défaut à l'export
  liste: [], // [{ id, nom, description, type, largeur, hauteur }] — largeur/hauteur en CM (taille réelle du meuble, donnée brute) ; la conversion en px pour un plan donné se fait au contexte (placement, rendu), jamais stockée ici — voir documentation/17-catalogue.md
  ecouteurs: [],

  panneau: null,
  conteneurListe: null,
  boutonNouveau: null,

  init(elements) {
    this.panneau = elements.panneau;
    this.conteneurListe = elements.liste;
    this.boutonNouveau = elements.boutonNouveau;

    this.boutonNouveau.addEventListener("click", () => this._creerNouveau());

    // Clic en dehors du panneau (et du bouton "+") : referme le panneau.
    document.addEventListener("pointerdown", (evenement) => {
      if (!this.panneau.classList.contains("visible")) return;
      if (this.panneau.contains(evenement.target)) return;
      if (evenement.target.closest("#btn-ajouter-meuble")) return;
      this.masquer();
    });
  },

  alChangement(callback) {
    this.ecouteurs.push(callback);
  },

  _notifier() {
    this.ecouteurs.forEach((callback) => callback());
  },

  // Remplace intégralement le catalogue (chargement de projet, ou import
  // d'un fichier catalogue séparé pour en changer complètement). Reprend
  // l'id fourni (ex. celui d'un fichier importé) ou en génère un nouveau.
  charger(liste, id) {
    this.liste = liste || [];
    this.id = id || crypto.randomUUID();
    this._rendre();
  },

  afficher() {
    this._rendre();
    this.panneau.classList.add("visible");
    // Comptes tous plans confondus (voir EditionCatalogue) : rendu immédiat
    // avec le compte du seul plan actif (fallback), affiné dès que le
    // parcours de tous les plans est terminé.
    EditionCatalogue.rafraichirComptesTousPlans(() => {
      if (this.panneau.classList.contains("visible")) this._rendre();
    });
  },

  masquer() {
    this.panneau.classList.remove("visible");
  },

  basculer() {
    if (this.panneau.classList.contains("visible")) this.masquer();
    else this.afficher();
  },

  // Crée un nouveau prefab, mais ne le place PAS sur le plan : ses champs
  // (type, dimensions, hauteur réelle) ne sont éditables que depuis la vue
  // d'édition du catalogue (l'inspecteur est en lecture seule dessus) — on y
  // bascule donc directement pour les configurer avant de le poser (depuis
  // ce même panneau, une fois configuré).
  _creerNouveau() {
    if (!Viewport.largeurPlan) return;
    const modele = this.creerVide();
    if (!modele) return;
    this.masquer();
    EditionCatalogue.afficher();
    Statut.definir(I18n.t("catalogue.objet_cree", { nom: modele.nom }));
  },

  // Crée une entrée de catalogue sans la placer sur le plan (utilisé par la
  // vue d'édition dédiée du catalogue, qui ne dépend pas d'un plan ouvert).
  creerVide() {
    const nom = prompt(I18n.t("catalogue.nom_nouvel_objet_prompt"), "");
    if (!nom || !nom.trim()) return null;

    const modele = {
      id: crypto.randomUUID(),
      nom: nom.trim(),
      description: "",
      type: PlannerConf.typeParDefaut,
      largeur: 100, // cm, donnée brute — voir liste ci-dessus
      hauteur: 100,
      hauteurCm: null,
      aDemenager: true
    };

    this.liste.push(modele);
    this._rendre();
    this._notifier();
    return modele;
  },

  // Modifie directement un modèle du catalogue (nom, type, dimensions,
  // hauteur réelle) — utilisé par la vue d'édition dédiée. N'affecte pas les
  // instances déjà posées sur le plan (indépendantes une fois placées).
  modifier(modeleId, champs) {
    const modele = this.liste.find((m) => m.id === modeleId);
    if (!modele) return;
    Object.assign(modele, champs);
    this._rendre();
    this._notifier();
  },

  supprimer(modeleId) {
    const index = this.liste.findIndex((m) => m.id === modeleId);
    if (index === -1) return;
    this.liste.splice(index, 1);
    this._rendre();
    this._notifier();
  },

  // Absorbe une liste externe (import d'un ancien fichier projet avec
  // catalogue embarqué, d'avant le catalogue global — voir
  // documentation/17-catalogue.md/20-plans.md) : ajoute les entrées dont
  // l'id n'existe pas déjà, ignore les autres. Retourne le nombre ajouté.
  fusionner(liste) {
    if (!liste || !liste.length) return 0;
    const idsExistants = new Set(this.liste.map((m) => m.id));
    const nouveaux = liste.filter((m) => !idsExistants.has(m.id));
    if (nouveaux.length) {
      this.liste.push(...nouveaux);
      this._rendre();
      this._notifier();
    }
    return nouveaux.length;
  },

  // Reporte le type d'une instance posée sur son modèle de catalogue
  // d'origine (icône affichée dans le panneau catalogue) — voir bug fixé
  // dans 17-catalogue.md.
  synchroniserType(modeleId, typeId) {
    const modele = this.liste.find((m) => m.id === modeleId);
    if (!modele || modele.type === typeId) return;
    modele.type = typeId;
    this._rendre();
    this._notifier();
  },

  // Reporte la hauteur réelle (cm) d'une instance posée sur son modèle de
  // catalogue d'origine, pour que le prochain objet posé depuis ce modèle
  // (et l'impression du catalogue) en héritent — voir 17-catalogue.md.
  synchroniserHauteurCm(modeleId, hauteurCm) {
    const modele = this.liste.find((m) => m.id === modeleId);
    if (!modele || modele.hauteurCm === hauteurCm) return;
    modele.hauteurCm = hauteurCm;
    this._notifier();
  },

  // Reporte le statut "à déménager" d'une instance posée sur son modèle de
  // catalogue d'origine (comme synchroniserType/synchroniserHauteurCm...).
  synchroniserADemenager(modeleId, aDemenager) {
    const modele = this.liste.find((m) => m.id === modeleId);
    if (!modele || modele.aDemenager === aDemenager) return;
    modele.aDemenager = aDemenager;
    this._notifier();
  },

  // Reporte la largeur/profondeur (CM — voir liste ci-dessus) d'une instance
  // posée sur son modèle de catalogue d'origine. L'appelant (objets.js,
  // redimensionner()) convertit depuis les px de l'instance avant d'appeler.
  synchroniserDimensions(modeleId, largeurCm, hauteurCm) {
    const modele = this.liste.find((m) => m.id === modeleId);
    if (!modele || (modele.largeur === largeurCm && modele.hauteur === hauteurCm)) return;
    modele.largeur = largeurCm;
    modele.hauteur = hauteurCm;
    this._notifier();
  },

  _choisir(modele) {
    this.masquer();
    Meubles.ajouterDepuisModele(modele);
  },

  _rendre() {
    this.conteneurListe.innerHTML = "";

    if (this.liste.length === 0) {
      const vide = document.createElement("div");
      vide.className = "catalogue-vide";
      vide.textContent = I18n.t("catalogue.aucun_objet");
      this.conteneurListe.appendChild(vide);
      return;
    }

    this.liste.forEach((modele) => {
      const bouton = document.createElement("button");
      bouton.className = "catalogue-item";

      const groupeIcone = document.createElement("span");
      groupeIcone.className = "catalogue-item-icone-nom";
      groupeIcone.appendChild(PlannerConf.iconeElement(modele.type, "catalogue-item-icone"));
      groupeIcone.appendChild(document.createTextNode(` ${modele.nom}`));
      bouton.appendChild(groupeIcone);

      // Nombre d'instances déjà posées, TOUS plans confondus (voir
      // EditionCatalogue.instancesTousPlans) — jamais utilisé nulle part
      // = mis en avant (léger orange) pour repérer les prefabs oubliés.
      const quantite = EditionCatalogue.instancesTousPlans(modele.id);
      bouton.classList.toggle("catalogue-item-non-utilise", quantite === 0);

      const spanQuantite = document.createElement("span");
      spanQuantite.className = "catalogue-item-quantite";
      spanQuantite.title = I18n.t("edition_catalogue.quantite_title");
      spanQuantite.textContent = quantite;
      bouton.appendChild(spanQuantite);

      bouton.addEventListener("click", () => this._choisir(modele));
      this.conteneurListe.appendChild(bouton);
    });
  }
};
