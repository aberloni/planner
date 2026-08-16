// Catalogue partagé des objets réels d'une maison, à répartir entre les
// utilisateurs sur le nouveau plan. Grandit au fil de l'eau (rien de
// prédéfini) : un objet créé par un utilisateur devient immédiatement
// réutilisable par les autres, sans avoir à le recréer — voir
// documentation/17-catalogue.md.
//
// Le catalogue est commun à tous les utilisateurs (comme le plan et
// l'habillage) ; seuls les PLACEMENTS (instances posées sur le plan, dans
// Meubles.liste) sont propres à chaque utilisateur.
const Catalogue = {

  id: null, // identifiant unique du catalogue courant, utilisé comme nom de fichier par défaut à l'export
  liste: [], // [{ id, nom, type, largeur, hauteur }]
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
    Statut.definir(`Objet créé dans le catalogue : ${modele.nom}. Configurez-le puis choisissez-le pour le poser.`);
  },

  // Crée une entrée de catalogue sans la placer sur le plan (utilisé par la
  // vue d'édition dédiée du catalogue, qui ne dépend pas d'un plan ouvert).
  creerVide() {
    const nom = prompt("Nom du nouvel objet (ex. \"Canapé du salon\") :", "");
    if (!nom || !nom.trim()) return null;

    const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
    const modele = {
      id: crypto.randomUUID(),
      nom: nom.trim(),
      type: PlannerConf.typeParDefaut,
      largeur: 100 * pxParCm,
      hauteur: 100 * pxParCm,
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

  // Reporte la largeur/profondeur (px) d'une instance posée sur son modèle
  // de catalogue d'origine.
  synchroniserDimensions(modeleId, largeur, hauteur) {
    const modele = this.liste.find((m) => m.id === modeleId);
    if (!modele || (modele.largeur === largeur && modele.hauteur === hauteur)) return;
    modele.largeur = largeur;
    modele.hauteur = hauteur;
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
      vide.textContent = "Aucun objet pour l'instant.";
      this.conteneurListe.appendChild(vide);
      return;
    }

    this.liste.forEach((modele) => {
      const bouton = document.createElement("button");
      bouton.className = "catalogue-item";
      bouton.appendChild(PlannerConf.iconeElement(modele.type, "catalogue-item-icone"));
      bouton.appendChild(document.createTextNode(` ${modele.nom}`));
      bouton.addEventListener("click", () => this._choisir(modele));
      this.conteneurListe.appendChild(bouton);
    });
  }
};
