// Inspecteur (coin haut droit) : propriétés de l'objet sélectionné (meuble
// ou masque d'habillage), en deux groupes — voir index.html/#inspecteur :
// - "Prefab (catalogue)" : type, modèle, dimensions, hauteur réelle. Partagé
//   entre utilisateurs, en LECTURE SEULE ici — se modifie uniquement depuis
//   la vue d'édition du catalogue (bouton dédié, voir boutonOuvrirCatalogue).
// - "Cette instance" : nom, forme, position (lecture seule), rotation
//   (lecture seule), ordre d'affichage. Propre à cet exemplaire posé par
//   l'utilisateur actif — éditable ici.
const Inspecteur = {

  panneau: null,
  ligneType: null, // masqué pour les objets sans type (habillage)
  champType: null,
  ligneModele: null, // masqué pour les objets sans modeleId (habillage, meuble créé sans catalogue)
  champModele: null,
  champLargeur: null, // <span> lecture seule (voir ci-dessus)
  champProfondeur: null,
  ligneHauteurCm: null, // masqué pour les objets sans hauteurCm (habillage)
  champHauteurCm: null,
  boutonOuvrirCatalogue: null, // masqué avec ligneModele : pas de prefab à éditer sans modeleId
  champNom: null,
  champForme: null,
  champPosition: null,
  champRotation: null,
  champZOrdre: null,
  boutonSupprimer: null,
  boutonDupliquer: null,
  objetCourant: null,
  moduleCourant: null, // Meubles ou Habillage — pour router renommer/definirForme/definirZOrdre

  init(elements) {
    this.panneau = elements.panneau;
    this.champType = elements.type;
    this.ligneType = elements.ligneType;
    this.ligneModele = elements.ligneModele;
    this.champModele = elements.modele;
    this.champLargeur = elements.largeur;
    this.champProfondeur = elements.profondeur;
    this.ligneHauteurCm = elements.ligneHauteurCm;
    this.champHauteurCm = elements.hauteurCm;
    this.boutonOuvrirCatalogue = elements.ouvrirCatalogue;
    this.champNom = elements.nom;
    this.champForme = elements.forme;
    this.champPosition = elements.position;
    this.champRotation = elements.rotation;
    this.champZOrdre = elements.zOrdre;
    this.boutonSupprimer = elements.supprimer;
    this.boutonDupliquer = elements.dupliquer;

    this.boutonSupprimer.addEventListener("click", () => {
      if (!this.objetCourant) return;
      this.moduleCourant.supprimer(this.objetCourant);
    });

    this.boutonDupliquer.addEventListener("click", () => {
      if (!this.objetCourant) return;
      this.moduleCourant.dupliquer(this.objetCourant);
    });

    this.boutonOuvrirCatalogue.addEventListener("click", () => EditionCatalogue.afficher(this.objetCourant.modeleId));

    this.champNom.addEventListener("change", () => {
      if (!this.objetCourant) return;
      this.moduleCourant.renommer(this.objetCourant, this.champNom.value.trim());
    });

    this.champForme.addEventListener("change", () => {
      if (!this.objetCourant) return;
      this.moduleCourant.definirForme(this.objetCourant, this.champForme.value);
    });

    this.champZOrdre.addEventListener("change", () => {
      if (!this.objetCourant) return;
      this.moduleCourant.definirZOrdre(this.objetCourant, this.champZOrdre.value);
    });

    // Raccourci clavier Suppr/Retour arrière : supprime l'instance
    // sélectionnée (jamais l'entrée du catalogue, comme le bouton
    // "Supprimer" ci-dessus) — ignoré si la touche est tapée dans un champ
    // de saisie (édition de texte en cours, pas une intention de suppression
    // d'objet).
    document.addEventListener("keydown", (evenement) => {
      const cible = evenement.target;
      if (cible instanceof HTMLInputElement || cible instanceof HTMLTextAreaElement || cible instanceof HTMLSelectElement) return;
      if (!this.objetCourant) return;

      if (evenement.key === "Delete" || evenement.key === "Backspace") {
        evenement.preventDefault();
        this.moduleCourant.supprimer(this.objetCourant);
        return;
      }

      if (evenement.key === "Escape") {
        evenement.preventDefault();
        this.moduleCourant.deselectionner();
        return;
      }

      if (evenement.ctrlKey) {
        const rotations = { ArrowLeft: -45, ArrowRight: 45 };
        const deltaDegres = rotations[evenement.key];
        if (deltaDegres === undefined) return;
        evenement.preventDefault();
        this.moduleCourant.tournerDe(this.objetCourant, deltaDegres);
        return;
      }

      const PAS_CM = 5;
      const deltas = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
      };
      const delta = deltas[evenement.key];
      if (!delta) return;
      evenement.preventDefault();
      const pas = PAS_CM * this._pxParCm();
      this.moduleCourant.deplacerDe(this.objetCourant, delta[0] * pas, delta[1] * pas);
    });
  },

  _pxParCm() {
    return Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
  },

  // `module` est Meubles ou Habillage, propriétaire de `objet` — nécessaire
  // pour router renommer/definirForme/definirZOrdre vers le bon module.
  afficher(objet, module) {
    this.objetCourant = objet;
    this.moduleCourant = module;

    const avecType = "type" in objet;
    this.ligneType.style.display = avecType ? "" : "none";
    if (avecType) this.champType.textContent = PlannerConf.trouverType(objet.type).libelle;

    // Rappelle de quel modèle de catalogue (prefab) cette instance a été
    // posée — son propre nom (ci-dessous) peut diverger du nom du modèle.
    // Le bouton catalogue n'a de sens que s'il y a un prefab à éditer.
    const modele = objet.modeleId ? Catalogue.liste.find((m) => m.id === objet.modeleId) : null;
    this.ligneModele.style.display = modele ? "" : "none";
    if (modele) this.champModele.textContent = modele.nom;
    this.boutonOuvrirCatalogue.style.display = modele ? "" : "none";

    const avecHauteurCm = "hauteurCm" in objet;
    this.ligneHauteurCm.style.display = avecHauteurCm ? "" : "none";
    if (avecHauteurCm) this.champHauteurCm.textContent = objet.hauteurCm ?? "-";

    this.champNom.value = objet.libelle;
    this.champForme.value = objet.forme || "rectangle";
    this.champZOrdre.value = objet.zOrdre || "normal";
    this.actualiserTaille(objet);
    this.actualiserLectureSeule(objet);
    this.panneau.classList.add("visible");
    this.boutonDupliquer.classList.add("visible");
  },

  masquer() {
    this.objetCourant = null;
    this.moduleCourant = null;
    this.panneau.classList.remove("visible");
    this.boutonDupliquer.classList.remove("visible");
  },

  // Rafraîchit largeur/profondeur (lecture seule) — appelé aussi pendant un
  // glisser de la poignée de coin (voir objets.js, _surPointerDownTaille).
  actualiserTaille(objet) {
    if (objet !== this.objetCourant) return;
    const pxParCm = this._pxParCm();
    this.champLargeur.textContent = Math.round(objet.largeur / pxParCm);
    this.champProfondeur.textContent = Math.round(objet.hauteur / pxParCm);
  },

  // Rafraîchit position/rotation (lecture seule) sans toucher aux champs éditables
  // en cours de saisie — appelé pendant un déplacement de l'objet sélectionné.
  actualiserLectureSeule(objet) {
    if (objet !== this.objetCourant) return;
    const pxParCm = this._pxParCm();
    const xCm = Math.round(objet.x / pxParCm);
    const yCm = Math.round(objet.y / pxParCm);
    this.champPosition.textContent = `${xCm} cm, ${yCm} cm`;
    this.champRotation.textContent = `${Math.round(objet.rotation)}°`;
  }
};
