// Vue dédiée (plein écran) pour éditer le catalogue : liste tous les
// modèles avec leurs champs modifiables (nom, type, dimensions, hauteur
// réelle) — voir documentation/17-catalogue.md.
//
// Le nom édité ici est celui du PREFAB (modele.nom, l'identité du catalogue
// et de l'ajout d'objet) — toujours écrit sur le modèle. Distinct du nom de
// chaque instance posée (auto-incrémenté par défaut, voir Objets.
// _prochainNomInstance), éditable individuellement depuis l'inspecteur.
//
// Pour type/dimensions/hauteur réelle en revanche, comme l'inspecteur : si
// une instance est posée sur le plan de l'utilisateur actif (Meubles.liste),
// on lit/écrit DIRECTEMENT cette instance (même objet, même fonctions
// Meubles.* que l'inspecteur) — valeurs toujours à jour, édition répercutée
// immédiatement sur le plan. Sans instance posée (modèle jamais placé, ou
// placé uniquement chez un autre utilisateur), on retombe sur le modèle du
// catalogue lui-même (Catalogue.modifier).
const EditionCatalogue = {

  overlay: null,
  tbody: null,
  boutonFermer: null,
  boutonNouveau: null,

  init(elements) {
    this.overlay = elements.overlay;
    this.tbody = elements.tbody;
    this.boutonFermer = elements.fermer;
    this.boutonNouveau = elements.nouveau;

    this.boutonFermer.addEventListener("click", () => this.masquer());
    this.overlay.addEventListener("pointerdown", (evenement) => {
      if (evenement.target === this.overlay) this.masquer();
    });
    this.boutonNouveau.addEventListener("click", () => {
      if (Catalogue.creerVide()) this._rendre();
    });

    Catalogue.alChangement(() => {
      if (this.overlay.classList.contains("visible")) this._rendre();
    });
  },

  // `modeleAMettreEnAvant` (optionnel) : id du prefab à faire défiler en vue
  // et surligner brièvement — utilisé quand on arrive depuis le bouton
  // "Éditer dans le catalogue" de l'inspecteur, pour retrouver la bonne
  // ligne dans la liste (potentiellement longue) sans avoir à la chercher.
  afficher(modeleAMettreEnAvant) {
    this._rendre();
    this.overlay.classList.add("visible");
    if (modeleAMettreEnAvant) this._mettreEnAvant(modeleAMettreEnAvant);
  },

  _mettreEnAvant(modeleId) {
    const ligne = this.tbody.querySelector(`tr[data-modele-id="${modeleId}"]`);
    if (!ligne) return;
    ligne.scrollIntoView({ block: "center", behavior: "smooth" });
    ligne.classList.add("vue-catalogue-ligne-surlignee");
    window.setTimeout(() => ligne.classList.remove("vue-catalogue-ligne-surlignee"), 2000);
  },

  masquer() {
    this.overlay.classList.remove("visible");
  },

  basculer() {
    if (this.overlay.classList.contains("visible")) this.masquer();
    else this.afficher();
  },

  // Toutes les instances posées sur le plan de l'utilisateur actif pour ce
  // modèle (dupliquer un meuble garde le même modeleId — voir objets.js,
  // dupliquer() — donc un modèle peut avoir plusieurs instances).
  _instancesPosees(modeleId) {
    return Meubles.liste.filter((objet) => objet.modeleId === modeleId);
  },

  // Une instance "représentative" du modèle, s'il y en a une posée — même
  // liste que celle dans laquelle l'inspecteur sélectionne. Utilisée pour
  // lire/écrire les champs (nom, type, dimensions...) de la ligne.
  _instancePosee(modeleId) {
    return this._instancesPosees(modeleId)[0] || null;
  },

  // Copie triée du catalogue, par libellé de type croissant puis par nom du
  // prefab (ne modifie pas Catalogue.liste, seulement l'ordre d'affichage
  // de cette vue).
  _listeTrieeParType() {
    return [...Catalogue.liste].sort((a, b) => {
      const libelleA = PlannerConf.trouverType(a.type).libelle;
      const libelleB = PlannerConf.trouverType(b.type).libelle;
      return libelleA.localeCompare(libelleB) || a.nom.localeCompare(b.nom);
    });
  },

  _rendre() {
    const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
    this.tbody.innerHTML = "";

    if (Catalogue.liste.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.className = "vue-catalogue-vide";
      td.textContent = "Aucun objet pour l'instant.";
      tr.appendChild(td);
      this.tbody.appendChild(tr);
      return;
    }

    let volumeTotalM3 = 0;
    this._listeTrieeParType().forEach((modele) => {
      const instances = this._instancesPosees(modele.id);
      const instance = instances[0] || null;
      const quantite = instances.length;
      const aDemenager = instance ? instance.aDemenager !== false : modele.aDemenager !== false;
      if (aDemenager) volumeTotalM3 += this._volumeM3(modele, instance, pxParCm) * quantite;
      this.tbody.appendChild(this._ligne(modele, instance, quantite, pxParCm));
    });

    const trTotal = document.createElement("tr");
    trTotal.className = "vue-catalogue-total";
    const tdLabel = document.createElement("td");
    tdLabel.colSpan = 7;
    tdLabel.textContent = "Total";
    trTotal.appendChild(tdLabel);
    const tdVolume = document.createElement("td");
    tdVolume.className = "vue-catalogue-colonne-volume";
    tdVolume.textContent = `${volumeTotalM3.toFixed(2)} m³`;
    trTotal.appendChild(tdVolume);
    trTotal.appendChild(document.createElement("td"));
    this.tbody.appendChild(trTotal);
  },

  _volumeM3(modele, instance, pxParCm) {
    const largeurActuelle = instance ? instance.largeur : modele.largeur;
    const hauteurActuelle = instance ? instance.hauteur : modele.hauteur;
    const hauteurCmActuelle = instance ? instance.hauteurCm : modele.hauteurCm;
    if (typeof hauteurCmActuelle !== "number") return 0;
    const largeurCm = largeurActuelle / pxParCm;
    const profondeurCm = hauteurActuelle / pxParCm;
    return (largeurCm * profondeurCm * hauteurCmActuelle) / 1e6;
  },

  _ligne(modele, instance, quantite, pxParCm) {
    const tr = document.createElement("tr");
    tr.dataset.modeleId = modele.id;

    // Le nom ici est celui du PREFAB (modele.nom) — l'identité affichée dans
    // le catalogue et à l'ajout d'un objet. Distinct du nom de chaque
    // instance posée (auto-incrémenté par défaut, ex. "Chaise 1", "Chaise
    // 2"...), qui reste éditable individuellement depuis l'inspecteur.
    const nomActuel = modele.nom;
    const typeActuel = instance ? instance.type : (modele.type || PlannerConf.typeParDefaut);
    const largeurActuelle = instance ? instance.largeur : modele.largeur;
    const hauteurActuelle = instance ? instance.hauteur : modele.hauteur;
    const hauteurCmActuelle = instance ? instance.hauteurCm : modele.hauteurCm;

    const inputNom = document.createElement("input");
    inputNom.type = "text";
    inputNom.value = nomActuel;
    inputNom.addEventListener("change", () => {
      const valeur = inputNom.value.trim() || nomActuel;
      Catalogue.modifier(modele.id, { nom: valeur });
    });
    tr.appendChild(this._cellule(inputNom));

    // Le <select> ne peut pas afficher l'icône SVG dans ses <option> — une
    // icône à part, à jour, la montre à côté (même logique que sur le plan,
    // voir PlannerConf.iconeElement).
    const iconeType = PlannerConf.iconeElement(typeActuel, "vue-catalogue-icone-type");

    const selectType = document.createElement("select");
    PlannerConf.remplirSelectTypes(selectType);
    selectType.value = typeActuel;
    selectType.addEventListener("change", () => {
      if (instance) Meubles.definirType(instance, selectType.value);
      else Catalogue.modifier(modele.id, { type: selectType.value });
      const nouvelleIcone = PlannerConf.iconeElement(selectType.value, "vue-catalogue-icone-type");
      iconeType.replaceWith(nouvelleIcone);
    });
    const tdType = document.createElement("td");
    tdType.className = "vue-catalogue-cellule-type";
    tdType.appendChild(iconeType);
    tdType.appendChild(selectType);
    tr.appendChild(tdType);

    const inputLargeur = document.createElement("input");
    inputLargeur.type = "number";
    inputLargeur.min = "1";
    inputLargeur.step = "1";
    inputLargeur.value = Math.round(largeurActuelle / pxParCm);
    inputLargeur.addEventListener("change", () => {
      const cm = parseFloat(inputLargeur.value) || 1;
      if (instance) Meubles.redimensionner(instance, cm * pxParCm, instance.hauteur);
      else Catalogue.modifier(modele.id, { largeur: cm * pxParCm });
    });
    tr.appendChild(this._cellule(inputLargeur));

    const inputProfondeur = document.createElement("input");
    inputProfondeur.type = "number";
    inputProfondeur.min = "1";
    inputProfondeur.step = "1";
    inputProfondeur.value = Math.round(hauteurActuelle / pxParCm);
    inputProfondeur.addEventListener("change", () => {
      const cm = parseFloat(inputProfondeur.value) || 1;
      if (instance) Meubles.redimensionner(instance, instance.largeur, cm * pxParCm);
      else Catalogue.modifier(modele.id, { hauteur: cm * pxParCm });
    });
    tr.appendChild(this._cellule(inputProfondeur));

    const inputHauteurCm = document.createElement("input");
    inputHauteurCm.type = "number";
    inputHauteurCm.min = "0";
    inputHauteurCm.step = "1";
    inputHauteurCm.value = hauteurCmActuelle ?? "";
    inputHauteurCm.addEventListener("change", () => {
      const valeur = inputHauteurCm.value === "" ? null : parseFloat(inputHauteurCm.value);
      if (instance) Meubles.definirHauteurReelle(instance, valeur);
      else Catalogue.modifier(modele.id, { hauteurCm: valeur });
    });
    tr.appendChild(this._cellule(inputHauteurCm));

    const spanQuantite = document.createElement("span");
    spanQuantite.title = "Nombre d'instances posées sur le plan (dupliquer un meuble compte comme le même modèle)";
    spanQuantite.textContent = quantite;
    tr.appendChild(this._cellule(spanQuantite));

    const aDemenagerActuel = instance ? instance.aDemenager !== false : modele.aDemenager !== false;
    const inputADemenager = document.createElement("input");
    inputADemenager.type = "checkbox";
    inputADemenager.title = "Objet à déménager (à décocher pour un objet acheté sur place ou un volume fixe, ex. comptoir de cuisine) — exclu du volume total si décoché";
    inputADemenager.checked = aDemenagerActuel;
    inputADemenager.addEventListener("change", () => {
      if (instance) Meubles.definirADemenager(instance, inputADemenager.checked);
      else Catalogue.modifier(modele.id, { aDemenager: inputADemenager.checked });
    });
    tr.appendChild(this._cellule(inputADemenager));

    const spanVolume = document.createElement("span");
    spanVolume.textContent = (typeof hauteurCmActuelle === "number" && aDemenagerActuel)
      ? `${(this._volumeM3(modele, instance, pxParCm) * quantite).toFixed(2)} m³`
      : "-";
    tr.appendChild(this._cellule(spanVolume, "vue-catalogue-colonne-volume"));

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.className = "vue-catalogue-supprimer";
    boutonSupprimer.title = "Supprimer du catalogue";
    boutonSupprimer.textContent = "🗑️";
    boutonSupprimer.addEventListener("click", () => {
      if (confirm(`Supprimer "${modele.nom}" du catalogue ?`)) Catalogue.supprimer(modele.id);
    });
    tr.appendChild(this._cellule(boutonSupprimer));

    return tr;
  },

  _cellule(enfant, classe) {
    const td = document.createElement("td");
    if (classe) td.className = classe;
    td.appendChild(enfant);
    return td;
  }
};
