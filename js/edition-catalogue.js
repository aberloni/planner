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
// une instance est posée sur le plan de la proposition active (Meubles.liste),
// on lit/écrit DIRECTEMENT cette instance (même objet, même fonctions
// Meubles.* que l'inspecteur) — valeurs toujours à jour, édition répercutée
// immédiatement sur le plan. Sans instance posée (modèle jamais placé, ou
// placé uniquement dans une autre proposition), on retombe sur le modèle du
// catalogue lui-même (Catalogue.modifier).
const EditionCatalogue = {

  overlay: null,
  tbody: null,
  boutonFermer: null,
  boutonNouveau: null,
  onglets: null, // NodeList des boutons d'onglet
  ongletActif: "a_demenager", // "a_demenager" | "non_a_demenager"

  init(elements) {
    this.overlay = elements.overlay;
    this.tbody = elements.tbody;
    this.boutonFermer = elements.fermer;
    this.boutonNouveau = elements.nouveau;
    this.onglets = elements.onglets;

    this.boutonFermer.addEventListener("click", () => this.masquer());
    this.overlay.addEventListener("pointerdown", (evenement) => {
      if (evenement.target === this.overlay) this.masquer();
    });
    this.boutonNouveau.addEventListener("click", () => {
      const modele = Catalogue.creerVide();
      if (modele) this.afficher(modele.id); // rendu + surlignage temporaire, voir _mettreEnAvant
    });

    this.onglets.forEach((bouton) => {
      bouton.addEventListener("click", () => {
        if (bouton.dataset.onglet === this.ongletActif) return;
        this.ongletActif = bouton.dataset.onglet;
        this.onglets.forEach((b) => b.classList.toggle("vue-catalogue-onglet-actif", b === bouton));
        this._rendre();
      });
    });

    // Différé (`setTimeout(0)`) : un `change` de champ (ex. Tab pour passer
    // au champ suivant) déclenche cette re-render pendant le `blur` — donc
    // AVANT que le navigateur ait fini de déplacer le focus vers le champ
    // suivant. Un rendu synchrone ici (tbody.innerHTML = "") détruirait ce
    // prochain champ avant qu'il ne reçoive le focus, le perdant (retombe
    // sur <body>, Tab suivant repart du début). Le différé laisse le
    // déplacement de focus natif se terminer d'abord ; _rendre() capture
    // ensuite le champ (désormais) focus et le restaure après reconstruction.
    Catalogue.alChangement(() => {
      if (this.overlay.classList.contains("visible")) window.setTimeout(() => this._rendre(), 0);
    });
  },

  // Repère quel champ de la table a le focus (ligne via modeleId, position
  // de la cellule) pour pouvoir le restaurer après reconstruction du tbody
  // — voir le commentaire sur Catalogue.alChangement ci-dessus. La sélection
  // du texte n'a pas besoin d'être capturée : le focus (ci-dessous) déclenche
  // le listener "focus" -> select() posé sur chaque champ texte/nombre, qui
  // resélectionne tout — cohérent avec Tab natif entre deux champs distincts.
  _capturerFocus() {
    const actif = document.activeElement;
    if (!actif || !this.tbody.contains(actif)) return null;
    const ligne = actif.closest("tr[data-modele-id]");
    const cellule = actif.closest("td");
    if (!ligne || !cellule) return null;
    return {
      modeleId: ligne.dataset.modeleId,
      indexCellule: Array.prototype.indexOf.call(ligne.children, cellule)
    };
  },

  _restaurerFocus(focus) {
    if (!focus) return;
    const ligne = this.tbody.querySelector(`tr[data-modele-id="${focus.modeleId}"]`);
    const cellule = ligne && ligne.children[focus.indexCellule];
    const champ = cellule && cellule.querySelector("input, select, button");
    if (champ) champ.focus();
  },

  // Sélectionne tout le texte d'un champ texte/nombre à la prise de focus
  // (clic ou Tab) — comportement attendu type tableur : prêt à être remplacé
  // en tapant, sans avoir à sélectionner/effacer à la main.
  _selectionnerAuFocus(champ) {
    champ.addEventListener("focus", () => champ.select());
  },

  // `modeleAMettreEnAvant` (optionnel) : id du prefab à faire défiler en vue
  // et surligner brièvement — utilisé quand on arrive depuis le bouton
  // "Éditer dans le catalogue" de l'inspecteur, pour retrouver la bonne
  // ligne dans la liste (potentiellement longue) sans avoir à la chercher.
  afficher(modeleAMettreEnAvant) {
    // Bascule sur l'onglet du prefab ciblé au besoin, sinon sa ligne n'existe
    // pas dans le DOM (filtrée par l'autre onglet) — voir _mettreEnAvant.
    if (modeleAMettreEnAvant) {
      const modele = Catalogue.liste.find((m) => m.id === modeleAMettreEnAvant);
      if (modele) {
        const ongletCible = this._categorie(modele);
        if (ongletCible !== this.ongletActif) {
          this.ongletActif = ongletCible;
          this.onglets.forEach((b) => b.classList.toggle("vue-catalogue-onglet-actif", b.dataset.onglet === ongletCible));
        }
      }
    }
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

  // Toutes les instances posées sur le plan de la proposition active pour ce
  // modèle (dupliquer un meuble garde le même modeleId — voir objets.js,
  // dupliquer() — donc un modèle peut avoir plusieurs instances). Vide tant
  // qu'aucun plan n'est ouvert (Meubles.liste pas encore chargée) : tout
  // retombe alors sur le prefab.
  _instancesPosees(modeleId) {
    return Meubles.liste.filter((objet) => objet.modeleId === modeleId);
  },

  // Une instance "représentative" du modèle, s'il y en a une posée — même
  // liste que celle dans laquelle l'inspecteur sélectionne. Utilisée pour
  // lire/écrire les champs (nom, type, dimensions...) de la ligne.
  _instancePosee(modeleId) {
    return this._instancesPosees(modeleId)[0] || null;
  },

  // Cache modeleId -> nombre total d'instances posées, TOUS plans/toutes
  // propositions confondus (le catalogue est global, voir js/catalogue.js —
  // "jamais utilisé" ne doit pas dépendre du seul plan actuellement ouvert).
  // null tant que jamais calculé (voir _rafraichirComptesTousPlans) : les
  // appelants retombent alors sur le compte du plan actif seul, en attendant.
  _comptesTousPlans: null,

  // Nombre d'instances d'un modèle tous plans confondus (cache) — utilisé
  // par le panneau rapide (js/catalogue.js) pour repérer les prefabs jamais
  // utilisés (mise en avant visuelle).
  instancesTousPlans(modeleId) {
    if (!this._comptesTousPlans) return this._instancesPosees(modeleId).length;
    return this._comptesTousPlans.get(modeleId) || 0;
  },

  // Parcourt Propositions.liste (déjà en mémoire, propositions au niveau du
  // projet — voir js/propositions.js) pour compter les instances de chaque
  // modèle, tous plans/toutes propositions du projet confondus. `callback`
  // est appelé une fois le cache prêt, pour re-rendre les vues qui en
  // dépendent avec des comptes à jour.
  async rafraichirComptesTousPlans(callback) {
    const comptes = new Map();
    Propositions.liste.forEach((proposition) => {
      Object.values(proposition.meublesParPlan || {}).forEach((meubles) => {
        (meubles || []).forEach((objet) => {
          if (!objet.modeleId) return;
          comptes.set(objet.modeleId, (comptes.get(objet.modeleId) || 0) + 1);
        });
      });
    });
    this._comptesTousPlans = comptes;
    if (callback) callback();
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

  // Onglet d'un modèle : "a_trier" (encore au type par défaut — voir
  // PlannerConf.typeParDefaut — OU largeur/profondeur pas encore
  // renseignées : pas encore complètement paramétré, priorité sur les deux
  // autres — un objet pas dimensionné n'est de toute façon pas posable, voir
  // js/catalogue.js), "a_demenager" ou "non_a_demenager" (Volume fixe). Une
  // instance déjà posée a toujours une taille réelle : la vérification de
  // dimensions ne s'applique qu'au prefab seul (pas encore placé).
  _categorie(modele) {
    const instance = this._instancePosee(modele.id);
    const typeActuel = instance ? instance.type : (modele.type || PlannerConf.typeParDefaut);
    const dimensionsManquantes = !instance && (typeof modele.largeur !== "number" || typeof modele.hauteur !== "number");
    if (typeActuel === PlannerConf.typeParDefaut || dimensionsManquantes) return "a_trier";
    return PlannerConf.estADemenager(typeActuel) ? "a_demenager" : "non_a_demenager";
  },

  _rendre() {
    const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
    const focus = this._capturerFocus();
    this.tbody.innerHTML = "";

    // Compte de chaque onglet, toujours à jour même si on n'affiche que
    // celui actif — sert à distinguer "catalogue vide" de "rien dans cet
    // onglet" (voir plus bas).
    const listeTriee = this._listeTrieeParType();
    const aDemenager = this.ongletActif === "a_demenager";
    const filtree = listeTriee.filter((modele) => this._categorie(modele) === this.ongletActif);

    // Entête de l'onglet "À trier" en orange tant qu'il reste des objets pas
    // complètement paramétrés dedans — repérage immédiat, même depuis un
    // autre onglet.
    const resteATrier = listeTriee.some((modele) => this._categorie(modele) === "a_trier");
    this.onglets.forEach((b) => b.classList.toggle("vue-catalogue-onglet-alerte", b.dataset.onglet === "a_trier" && resteATrier));

    if (listeTriee.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.className = "vue-catalogue-vide";
      td.textContent = I18n.t("catalogue.aucun_objet");
      tr.appendChild(td);
      this.tbody.appendChild(tr);
      return;
    }

    if (filtree.length === 0) {
      const messages = {
        a_trier: "catalogue_vue.onglet_a_trier_vide",
        a_demenager: "catalogue_vue.onglet_a_demenager_vide",
        non_a_demenager: "catalogue_vue.onglet_non_a_demenager_vide"
      };
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.className = "vue-catalogue-vide";
      td.textContent = I18n.t(messages[this.ongletActif]);
      tr.appendChild(td);
      this.tbody.appendChild(tr);
      this._restaurerFocus(focus);
      return;
    }

    let volumeTotalM3 = 0;
    filtree.forEach((modele) => {
      const instances = this._instancesPosees(modele.id);
      const instance = instances[0] || null;
      const quantite = instances.length;
      if (aDemenager) volumeTotalM3 += this._volumeM3(modele, instance, pxParCm) * quantite;
      this.tbody.appendChild(this._ligne(modele, instance, quantite, pxParCm));
    });

    // Le volume total n'a de sens que pour l'onglet "à déménager" — les
    // autres onglets ne contribuent jamais au volume à transporter.
    if (aDemenager) {
      const trTotal = document.createElement("tr");
      trTotal.className = "vue-catalogue-total";
      const tdLabel = document.createElement("td");
      tdLabel.colSpan = 7;
      tdLabel.textContent = I18n.t("commun.total");
      trTotal.appendChild(tdLabel);
      const tdVolume = document.createElement("td");
      tdVolume.className = "vue-catalogue-colonne-volume";
      tdVolume.textContent = `${volumeTotalM3.toFixed(2)} m³`;
      trTotal.appendChild(tdVolume);
      trTotal.appendChild(document.createElement("td")); // Supprimer
      this.tbody.appendChild(trTotal);
    }

    this._restaurerFocus(focus);
  },

  // `modele.largeur/hauteur` sont déjà en cm (donnée brute du catalogue,
  // voir js/catalogue.js) ; une instance posée est en px et se convertit
  // selon l'échelle du plan actif. 0 si un des trois critères manque (prefab
  // pas encore complètement dimensionné) — voir _ligne pour l'affichage.
  _volumeM3(modele, instance, pxParCm) {
    const largeurCm = instance ? instance.largeur / pxParCm : modele.largeur;
    const profondeurCm = instance ? instance.hauteur / pxParCm : modele.hauteur;
    const hauteurCmActuelle = instance ? instance.hauteurCm : modele.hauteurCm;
    if (typeof largeurCm !== "number" || typeof profondeurCm !== "number" || typeof hauteurCmActuelle !== "number") return 0;
    return (largeurCm * profondeurCm * hauteurCmActuelle) / 1e6;
  },

  // Valeur (cm) -> texte du champ : vide si non renseignée (prefab pas
  // encore dimensionné), sinon arrondie.
  _formatCm(valeur) {
    return typeof valeur === "number" ? Math.round(valeur) : "";
  },

  // Texte du champ -> valeur (cm) à stocker : null si vide (voir
  // Catalogue.creerVide), sinon le nombre saisi (1 si invalide/négatif — un
  // prefab en cours d'édition ne doit jamais retomber à une taille nulle).
  _parserCm(texte) {
    if (texte.trim() === "") return null;
    return parseFloat(texte) || 1;
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
    // modele.largeur/hauteur sont déjà en cm ; une instance posée est en px
    // (convertie selon l'échelle du plan actif) — voir js/catalogue.js.
    const largeurCmActuelle = instance ? instance.largeur / pxParCm : modele.largeur;
    const profondeurCmActuelle = instance ? instance.hauteur / pxParCm : modele.hauteur;
    const hauteurCmActuelle = instance ? instance.hauteurCm : modele.hauteurCm;

    const inputNom = document.createElement("input");
    inputNom.type = "text";
    inputNom.value = nomActuel;
    this._selectionnerAuFocus(inputNom);
    inputNom.addEventListener("change", () => {
      const valeur = inputNom.value.trim() || nomActuel;
      Catalogue.modifier(modele.id, { nom: valeur });
    });
    tr.appendChild(this._cellule(inputNom));

    const inputDescription = document.createElement("input");
    inputDescription.type = "text";
    inputDescription.placeholder = I18n.t("edition_catalogue.description_placeholder");
    inputDescription.value = modele.description || "";
    this._selectionnerAuFocus(inputDescription);
    inputDescription.addEventListener("change", () => {
      Catalogue.modifier(modele.id, { description: inputDescription.value.trim() });
    });
    tr.appendChild(this._cellule(inputDescription));

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
    inputLargeur.value = this._formatCm(largeurCmActuelle);
    this._selectionnerAuFocus(inputLargeur);
    inputLargeur.addEventListener("change", () => {
      if (instance) {
        const cm = parseFloat(inputLargeur.value) || 1;
        Meubles.redimensionner(instance, cm * pxParCm, instance.hauteur);
      } else {
        Catalogue.modifier(modele.id, { largeur: this._parserCm(inputLargeur.value) });
      }
    });
    tr.appendChild(this._cellule(inputLargeur));

    const inputProfondeur = document.createElement("input");
    inputProfondeur.type = "number";
    inputProfondeur.min = "1";
    inputProfondeur.step = "1";
    inputProfondeur.value = this._formatCm(profondeurCmActuelle);
    this._selectionnerAuFocus(inputProfondeur);
    inputProfondeur.addEventListener("change", () => {
      if (instance) {
        const cm = parseFloat(inputProfondeur.value) || 1;
        Meubles.redimensionner(instance, instance.largeur, cm * pxParCm);
      } else {
        Catalogue.modifier(modele.id, { hauteur: this._parserCm(inputProfondeur.value) });
      }
    });
    tr.appendChild(this._cellule(inputProfondeur));

    const inputHauteurCm = document.createElement("input");
    inputHauteurCm.type = "number";
    inputHauteurCm.min = "0";
    inputHauteurCm.step = "1";
    inputHauteurCm.value = hauteurCmActuelle ?? "";
    this._selectionnerAuFocus(inputHauteurCm);
    inputHauteurCm.addEventListener("change", () => {
      const valeur = inputHauteurCm.value === "" ? null : parseFloat(inputHauteurCm.value);
      if (instance) Meubles.definirHauteurReelle(instance, valeur);
      else Catalogue.modifier(modele.id, { hauteurCm: valeur });
    });
    tr.appendChild(this._cellule(inputHauteurCm));

    const spanQuantite = document.createElement("span");
    spanQuantite.title = I18n.t("edition_catalogue.quantite_title");
    spanQuantite.textContent = quantite;
    tr.appendChild(this._cellule(spanQuantite));

    // Volume (par exemplaire) dès que les 3 critères (largeur, profondeur,
    // hauteur réelle) sont renseignés — vide sinon, quel que soit le nombre
    // d'exemplaires déjà posés.
    const dimensionsCompletes = typeof largeurCmActuelle === "number" && typeof profondeurCmActuelle === "number" && typeof hauteurCmActuelle === "number";
    const spanVolume = document.createElement("span");
    spanVolume.textContent = dimensionsCompletes
      ? `${this._volumeM3(modele, instance, pxParCm).toFixed(2)} m³`
      : "";
    tr.appendChild(this._cellule(spanVolume, "vue-catalogue-colonne-volume"));

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.className = "vue-catalogue-supprimer";
    boutonSupprimer.title = I18n.t("edition_catalogue.supprimer_title");
    boutonSupprimer.innerHTML = '<img class="icone-supprimer" src="icones/ui/supprimer.svg" alt="">';
    boutonSupprimer.addEventListener("click", () => {
      if (confirm(I18n.t("edition_catalogue.supprimer_confirm", { nom: modele.nom }))) Catalogue.supprimer(modele.id);
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
