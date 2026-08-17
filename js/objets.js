// Fabrique un module de gestion d'objets rectangulaires posés dans un calque
// SVG : sélectionnables (clic simple), déplaçables, pivotables (poignée
// dédiée, paliers de 90°) et redimensionnables (poignées de coin bas-gauche/
// haut-droit). Pour les objets avec prefab (modeleId, donc Meubles),
// redimensionner reporte la nouvelle taille (cm) sur le prefab du catalogue
// ET sur toutes ses autres instances déjà posées (toutes propositions du
// plan actif) — voir redimensionner()/_propagerTailleAuxAutresInstances(),
// js/catalogue.js et documentation/17-catalogue.md.
// Utilisé pour créer Meubles (objets typés, voir js/planner.conf.js) et Habillage
// (masques blancs, sans type) — voir documentation/15-modes.md.
//
// Règle d'arbitrage clic/pan (voir documentation/07-interactions-techniques.md) :
// - clic simple (sans glisser) sur un objet -> le sélectionne (ou désélectionne
//   si on clique dans le vide), via Viewport.alClicSimple (hit-testing).
// - clic-glisser sur un objet NON sélectionné -> laissé à Viewport : ça pan le fond.
// - clic-glisser sur l'objet ACTUELLEMENT sélectionné -> intercepté ici
//   (stopPropagation dès le pointerdown) : ça déplace l'objet, pas de pan.
function creerModuleObjets(options) {
  const AVEC_TYPE = options.avecType;
  const LIBELLE_DEFAUT = options.libelleDefaut;
  const COULEUR_FIXE = options.couleurFixe || null; // utilisée si !AVEC_TYPE
  const SUPPRIMER_AU_DOUBLE_CLIC = options.supprimerAuDoubleClic || false;

  return {
    NS: "http://www.w3.org/2000/svg",
    TAILLE_DEFAUT_CM: 100, // 1m x 1m
    DISTANCE_POIGNEE: 30, // px plan, au-dessus du bord haut de l'objet

    groupe: null,
    liste: [],
    elements: new Map(), // id -> { g, rect }
    selectionnee: null,
    poignee: null, // { ligne, cercle } de rotation de l'objet sélectionné
    poigneesTaille: null, // { bg, hd } coins de redimensionnement de l'objet sélectionné
    ecouteurs: [], // callbacks appelés après un ajout/déplacement/redimensionnement/rotation/renommage
    actif: true, // si faux, n'est plus sélectionnable (géré par Mode, voir js/mode.js)

    init(groupeSvg) {
      this.groupe = groupeSvg;
      Viewport.alClicSimple((point) => this._surClicSimple(point));
      // Une recalibration de l'échelle change la conversion px -> cm pour des
      // objets déjà posés (leur taille en px ne bouge pas) : reflète-le dans
      // l'infobulle de dimensions sans attendre un redimensionnement.
      Echelle.alDefinie(() => this._actualiserToutesLesDimensions());
    },

    // Enregistre un callback appelé à chaque changement significatif de la liste
    // (utile pour resynchroniser la sauvegarde).
    alChangement(callback) {
      this.ecouteurs.push(callback);
    },

    _notifier() {
      this.ecouteurs.forEach((callback) => callback());
    },

    // Remplace intégralement la liste des objets (import de projet).
    charger(liste) {
      this._deselectionner();
      this.elements.forEach(({ g }) => g.remove());
      this.elements.clear();
      this.liste = [];

      (liste || []).forEach((donnees) => {
        const objet = { ...donnees };
        this.liste.push(objet);
        this._creerElement(objet);
      });
    },

    // Ajoute un objet 1m x 1m au centre de la zone visible actuelle.
    ajouter() {
      if (!Viewport.largeurPlan) return;

      const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
      const taille = this.TAILLE_DEFAUT_CM * pxParCm;
      const centre = Viewport.centreVisible();

      const objet = {
        id: crypto.randomUUID(),
        libelle: LIBELLE_DEFAUT,
        forme: "rectangle",
        zOrdre: "normal",
        x: centre.x,
        y: centre.y,
        largeur: taille,
        hauteur: taille,
        rotation: 0
      };
      if (AVEC_TYPE) {
        objet.type = PlannerConf.typeParDefaut;
        // Hauteur réelle (verticale, cm) : pas encore éditable ni utilisée à
        // l'affichage, juste stockée pour anticiper une évolution future
        // (ex. vue 3D — voir documentation/09-roadmap.md).
        objet.hauteurCm = null;
      }

      this.liste.splice(this._indexInsertion("normal"), 0, objet);
      this._creerElement(objet);
      this._reordonnerDom();
      this._selectionner(objet);
      Statut.definir(I18n.t("objets.ajoute_selectionne", { libelleDefaut: LIBELLE_DEFAUT, libelle: objet.libelle }));
      this._notifier();
    },

    // Ajoute une instance à partir d'un modèle du catalogue partagé (nom, type,
    // dimensions repris tels quels), au centre de la vue actuelle. `modeleId`
    // permet de retrouver de quel modèle du catalogue provient l'instance.
    // N'a de sens que pour les modules typés (Meubles) — pas de catalogue
    // pour Habillage.
    ajouterDepuisModele(modele) {
      if (!AVEC_TYPE || !Viewport.largeurPlan) return;

      // Le catalogue stocke la taille réelle en cm (donnée brute, voir
      // js/catalogue.js) ; l'instance posée est en px, convertie selon
      // l'échelle du plan actif — dérivée au contexte, jamais stockée telle
      // quelle dans le catalogue.
      const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
      const centre = Viewport.centreVisible();
      const objet = {
        id: crypto.randomUUID(),
        modeleId: modele.id,
        libelle: this._prochainNomInstance(modele),
        type: modele.type,
        forme: modele.forme || "rectangle",
        zOrdre: "normal",
        x: centre.x,
        y: centre.y,
        largeur: modele.largeur * pxParCm,
        hauteur: modele.hauteur * pxParCm,
        rotation: 0,
        hauteurCm: modele.hauteurCm ?? null // hauteur réelle (verticale) — voir ajouter()
      };

      this.liste.splice(this._indexInsertion("normal"), 0, objet);
      this._creerElement(objet);
      this._reordonnerDom();
      this._selectionner(objet);
      Statut.definir(I18n.t("objets.ajoute_selectionne", { libelleDefaut: LIBELLE_DEFAUT, libelle: objet.libelle }));
      this._notifier();
    },

    // Nom par défaut d'une instance posée depuis un modèle : identique au nom
    // du modèle tant qu'il n'y a aucune autre instance déjà posée (pas de
    // numéro qui n'apporterait rien) ; sinon suffixe "(N)", N = nombre
    // d'instances déjà posées + 1, pour les différencier (donc "Chaise",
    // "Chaise (2)", "Chaise (3)"...). Distinct du nom du modèle lui-même (le
    // "prefab", affiché dans le catalogue et à l'ajout) — voir
    // documentation/17-catalogue.md.
    _prochainNomInstance(modele) {
      const existantes = this.liste.filter((o) => o.modeleId === modele.id).length;
      return existantes === 0 ? modele.nom : `${modele.nom} (${existantes + 1})`;
    },

    _creerElement(objet) {
      const g = document.createElementNS(this.NS, "g");
      g.setAttribute("class", "objet-plan");

      const titre = document.createElementNS(this.NS, "title");
      titre.textContent = this._texteDimensions(objet);
      g.appendChild(titre);

      const rect = document.createElementNS(this.NS, "rect");
      rect.setAttribute("class", "corps-objet");
      g.appendChild(rect);

      let texteIcone = null;
      let texteNom = null;
      if (AVEC_TYPE) {
        texteIcone = this._construireIcone(objet.type);
        g.appendChild(texteIcone);

        texteNom = document.createElementNS(this.NS, "text");
        texteNom.setAttribute("class", "nom-objet");
        texteNom.setAttribute("text-anchor", "middle");
        texteNom.setAttribute("dominant-baseline", "central");
        texteNom.textContent = objet.libelle;
        g.appendChild(texteNom);
      }

      this.elements.set(objet.id, { g, rect, titre, texteIcone, texteNom });

      // Attaché au DOM avant le dimensionnement des étiquettes : getComputedTextLength()
      // (voir _ajusterNomEtiquette) a besoin que l'élément soit rendu pour mesurer le texte.
      this.groupe.appendChild(g);

      this._appliquerDimensions(rect, objet);
      this._appliquerTransform(g, objet);
      this._appliquerCouleur(rect, objet);
      this._appliquerClasseZOrdre(g, objet);
      if (texteIcone) this._appliquerTailleEtiquettes(objet, texteIcone, texteNom);
      g.addEventListener("pointerdown", (evenement) => this._surPointerDown(evenement, objet, g));

      if (SUPPRIMER_AU_DOUBLE_CLIC) {
        g.addEventListener("dblclick", (evenement) => {
          if (!this.actif) return;
          evenement.stopPropagation();
          evenement.preventDefault();
          this.supprimer(objet);
        });
      }
    },

    // Construit l'élément SVG de l'icône d'un type : <image> pointant vers le
    // SVG dédié dans icones/ (voir js/planner.conf.js, PlannerConf.icone —
    // convention icones/<id>.svg, pas de repli).
    _construireIcone(typeId) {
      const type = PlannerConf.trouverType(typeId);
      const image = document.createElementNS(this.NS, "image");
      image.setAttribute("class", "icone-objet");
      image.setAttribute("href", PlannerConf.icone(type.id));
      image.setAttribute("preserveAspectRatio", "xMidYMid meet");
      return image;
    },

    // Taille de l'icône/du nom, proportionnelle à la taille du meuble (donc
    // au zoom, comme le reste du plan — pas de vector-effect ici). Réduite
    // pour les objets en arrière-plan (zOrdre "bas"), pour rester discrète
    // (leur opacité est en plus abaissée par CSS, voir .en-arriere-plan).
    _appliquerTailleEtiquettes(objet, texteIcone, texteNom) {
      const cote = Math.min(objet.largeur, objet.hauteur);
      const discret = objet.zOrdre === "bas";
      const taille = cote * (discret ? 0.35 : 0.6);
      if (texteIcone.tagName === "image") {
        texteIcone.setAttribute("width", taille);
        texteIcone.setAttribute("height", taille);
        texteIcone.setAttribute("x", -taille / 2);
        texteIcone.setAttribute("y", -taille / 2);
      } else {
        texteIcone.setAttribute("font-size", taille);
      }
      this._ajusterNomEtiquette(objet, texteNom, this._tailleDepartNom(objet));
    },

    // Taille de police de départ du nom, proportionnelle à la taille du
    // meuble et bornée pour rester lisible — sans plancher artificiel qui
    // écraserait les écarts entre petits et grands meubles. C'est
    // _ajusterNomEtiquette qui réduit ensuite si le nom ne tient pas dans
    // la largeur disponible.
    _tailleDepartNom(objet) {
      const cote = Math.min(objet.largeur, objet.hauteur);
      const discret = objet.zOrdre === "bas";
      const TAILLE_MAX = discret ? 14 : 20;
      return Math.min(TAILLE_MAX, cote * (discret ? 0.16 : 0.22));
    },

    // Largeur réellement disponible pour le texte à l'écran : le nom est
    // contre-tourné (voir _appliquerContreRotationEtiquettes) pour rester
    // toujours horizontal, et la rotation est contrainte à 90° près (poignée
    // de rotation) — donc le côté aligné avec l'horizontale à l'écran est
    // soit `largeur` (0°/180°) soit `hauteur` (90°/270°), jamais un mélange.
    _largeurEtiquette(objet) {
      const rotation = ((objet.rotation % 180) + 180) % 180;
      return rotation === 0 ? objet.largeur : objet.hauteur;
    },

    // Fait tenir le nom dans la forme plutôt que de déborder : réduit la
    // taille de police par petits paliers jusqu'à une taille plancher, puis
    // tronque le texte avec "…" si ça ne suffit toujours pas.
    _ajusterNomEtiquette(objet, texteNom, tailleDepart) {
      const TAILLE_MIN = 7;
      const largeurDisponible = this._largeurEtiquette(objet) * 0.85;

      texteNom.textContent = objet.libelle;
      let taille = Math.max(tailleDepart, TAILLE_MIN);
      texteNom.setAttribute("font-size", taille);

      while (texteNom.getComputedTextLength() > largeurDisponible && taille - 1 >= TAILLE_MIN) {
        taille -= 1;
        texteNom.setAttribute("font-size", taille);
      }

      if (texteNom.getComputedTextLength() <= largeurDisponible) return;

      let nom = objet.libelle;
      while (nom.length > 1 && texteNom.getComputedTextLength() > largeurDisponible) {
        nom = nom.slice(0, -1);
        texteNom.textContent = nom + "…";
      }
    },

    // Marque le <g> comme "en arrière-plan" (zOrdre "bas") — voir CSS
    // .objet-plan.en-arriere-plan pour l'opacité réduite des étiquettes.
    _appliquerClasseZOrdre(g, objet) {
      g.classList.toggle("en-arriere-plan", objet.zOrdre === "bas");
    },

    // Supprime définitivement un objet (double-clic, si SUPPRIMER_AU_DOUBLE_CLIC).
    supprimer(objet) {
      if (this.selectionnee === objet) {
        this._supprimerPoignee();
        this.selectionnee = null;
        Inspecteur.masquer();
      }
      this.elements.get(objet.id).g.remove();
      this.elements.delete(objet.id);
      this.liste = this.liste.filter((o) => o !== objet);
      Statut.definir(I18n.t("objets.supprime", { libelle: objet.libelle }));
      this._notifier();
    },

    _appliquerTransform(g, objet) {
      g.setAttribute("transform", `translate(${objet.x} ${objet.y}) rotate(${objet.rotation})`);
      this._appliquerContreRotationEtiquettes(objet);
    },

    // Déplace l'objet sélectionné d'un delta (px plan) — utilisé par les
    // flèches clavier (voir inspecteur.js). Applique + notifie en un coup,
    // comme un glisser terminé.
    deplacerDe(objet, dxPx, dyPx) {
      objet.x += dxPx;
      objet.y += dyPx;
      const { g } = this.elements.get(objet.id);
      this._appliquerTransform(g, objet);
      Inspecteur.actualiserLectureSeule(objet);
      this._notifier();
    },

    // Tourne l'objet sélectionné d'un delta en degrés, aux mêmes paliers de
    // 45° que la poignée de rotation (voir _surPointerDownRotation) — utilisé
    // par Ctrl+flèches (voir inspecteur.js).
    tournerDe(objet, deltaDegres) {
      objet.rotation = ((objet.rotation + deltaDegres) % 360 + 360) % 360;
      const { g } = this.elements.get(objet.id);
      this._appliquerTransform(g, objet);
      Inspecteur.actualiserLectureSeule(objet);
      this._notifier();
    },

    // Les étiquettes (icône/nom) restent enfants du <g> pivoté, pour suivre
    // le meuble en déplacement — mais on les contre-tourne pour qu'elles
    // restent toujours lisibles à l'écran, quelle que soit la rotation.
    _appliquerContreRotationEtiquettes(objet) {
      const elements = this.elements.get(objet.id);
      if (!elements || !elements.texteIcone) return;
      const contre = `rotate(${-objet.rotation})`;
      elements.texteIcone.setAttribute("transform", contre);
      elements.texteNom.setAttribute("transform", `${contre} translate(0 ${Math.min(objet.largeur, objet.hauteur) * 0.32})`);
    },

    _appliquerCouleur(rect, objet) {
      rect.setAttribute("fill", AVEC_TYPE ? PlannerConf.trouverType(objet.type).couleur : COULEUR_FIXE);
    },

    // Change le type d'un objet (et sa couleur, dérivée du type) — appelé
    // depuis l'inspecteur. N'existe que pour les modules créés avec avecType.
    definirType(objet, typeId) {
      if (!AVEC_TYPE) return;
      objet.type = typeId;
      const elements = this.elements.get(objet.id);
      this._appliquerCouleur(elements.rect, objet);

      elements.texteIcone.setAttribute("href", PlannerConf.icone(typeId));
      this._appliquerTailleEtiquettes(objet, elements.texteIcone, elements.texteNom);
      this._appliquerContreRotationEtiquettes(objet);

      Statut.definir(I18n.t("objets.type_change", { libelle: objet.libelle, type: PlannerConf.trouverType(typeId).libelle }));

      // Garde l'icône du catalogue synchronisée : sans ça, une entrée créée
      // avec le type par défaut (générique) restait figée sur cette icône
      // même après avoir choisi le bon type sur l'instance posée.
      if (objet.modeleId && typeof Catalogue !== "undefined") {
        Catalogue.synchroniserType(objet.modeleId, typeId);
      }

      this._notifier();
    },

    // Hauteur réelle (verticale, cm) — n'affecte ni le rendu ni la taille
    // au sol, juste une donnée stockée en anticipation d'une évolution
    // future (voir documentation/04-modele-de-donnees.md). Appelé depuis
    // l'inspecteur. N'existe que pour les modules créés avec avecType.
    definirHauteurReelle(objet, cm) {
      if (!AVEC_TYPE) return;
      objet.hauteurCm = (cm === null || cm === "" || isNaN(cm)) ? null : cm;
      if (objet.modeleId) Catalogue.synchroniserHauteurCm(objet.modeleId, objet.hauteurCm);
      Statut.definir(I18n.t("objets.hauteur_reelle", { libelle: objet.libelle, valeur: objet.hauteurCm ?? I18n.t("objets.non_definie") }));
      this._notifier();
    },

    // Texte "nom\nlargeur x profondeur cm" affiché dans l'infobulle native
    // (survol de l'objet) — voir <title> dans _creerElement.
    _texteDimensions(objet) {
      const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
      const largeurCm = Math.round(objet.largeur / pxParCm);
      const profondeurCm = Math.round(objet.hauteur / pxParCm);
      return `${objet.libelle}\n${largeurCm} x ${profondeurCm} cm`;
    },

    _actualiserToutesLesDimensions() {
      this.liste.forEach((objet) => {
        const elements = this.elements.get(objet.id);
        if (elements && elements.titre) elements.titre.textContent = this._texteDimensions(objet);
      });
    },

    _appliquerDimensions(rect, objet) {
      rect.setAttribute("x", -objet.largeur / 2);
      rect.setAttribute("y", -objet.hauteur / 2);
      rect.setAttribute("width", objet.largeur);
      rect.setAttribute("height", objet.hauteur);
      this._appliquerForme(rect, objet);
    },

    // La forme se joue entièrement sur rx/ry d'un même <rect> — pas besoin de
    // changer d'élément SVG. La largeur/profondeur restent dans tous les cas
    // la bounding box de l'objet (voir documentation/04-modele-de-donnees.md) :
    // - rectangle : rx = ry = 0.
    // - cercle : rx = largeur/2, ry = hauteur/2 -> devient une ellipse inscrite
    //   dans la bounding box si largeur ≠ hauteur.
    // - capsule : rx = ry = min(largeur, hauteur)/2 -> "stade", bouts arrondis
    //   au maximum sur le petit côté.
    _appliquerForme(rect, objet) {
      const forme = objet.forme || "rectangle";
      let rayon = 0;
      if (forme === "cercle") {
        rect.setAttribute("rx", objet.largeur / 2);
        rect.setAttribute("ry", objet.hauteur / 2);
        return;
      }
      if (forme === "capsule") {
        rayon = Math.min(objet.largeur, objet.hauteur) / 2;
      }
      rect.setAttribute("rx", rayon);
      rect.setAttribute("ry", rayon);
    },

    // Change la forme d'un objet — appelé depuis l'inspecteur. Générique
    // (Meubles et Habillage), pas de restriction avecType.
    definirForme(objet, forme) {
      objet.forme = forme;
      this._appliquerForme(this.elements.get(objet.id).rect, objet);
      Statut.definir(I18n.t("objets.forme_changee", { libelle: objet.libelle, forme }));
      this._notifier();
    },

    // Ordre d'affichage (bas/normal/haut) — permet ex. de faire passer une
    // chaise sous une table. `liste` garde 3 segments contigus dans cet
    // ordre (tous les "bas", puis tous les "normal", puis tous les "haut") ;
    // au sein d'un même niveau, l'ordre relatif d'ajout est conservé. C'est
    // ce même tableau qui sert de référence au hit-testing (voir
    // _objetAuPoint) et à l'empilement visuel (voir _reordonnerDom) — les
    // deux restent donc toujours cohérents entre eux.
    RANG_Z: { bas: 0, normal: 1, haut: 2 },

    _indexInsertion(niveau) {
      const rang = this.RANG_Z[niveau];
      let i = 0;
      while (i < this.liste.length && this.RANG_Z[this.liste[i].zOrdre || "normal"] <= rang) i++;
      return i;
    },

    // Réapplique l'ordre de `liste` au DOM (appendChild déplace un nœud
    // existant à la fin — répéter dans l'ordre de la liste suffit à tout
    // réordonner, sans avoir à calculer d'insertBefore).
    _reordonnerDom() {
      this.liste.forEach((objet) => {
        this.groupe.appendChild(this.elements.get(objet.id).g);
      });
    },

    // Change le niveau d'affichage d'un objet — appelé depuis l'inspecteur.
    // Générique (Meubles et Habillage).
    definirZOrdre(objet, niveau) {
      if (!(niveau in this.RANG_Z)) return;
      const indexActuel = this.liste.indexOf(objet);
      if (indexActuel === -1) return;
      this.liste.splice(indexActuel, 1);
      objet.zOrdre = niveau;
      this.liste.splice(this._indexInsertion(niveau), 0, objet);
      this._reordonnerDom();

      const elements = this.elements.get(objet.id);
      this._appliquerClasseZOrdre(elements.g, objet);
      if (elements.texteIcone) this._appliquerTailleEtiquettes(objet, elements.texteIcone, elements.texteNom);

      Statut.definir(I18n.t("objets.ordre_affichage_statut", { libelle: objet.libelle, niveau }));
      this._notifier();
    },

    // Duplique l'objet donné : mêmes propriétés, léger décalage de position
    // pour rester visible séparément, nom suffixé "(N)" avec numérotation
    // incrémentale (voir _nomDuplique). Appelé depuis l'inspecteur/le bouton
    // dédié — générique (Meubles et Habillage).
    dupliquer(objet) {
      const decalage = 20 * (Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT);
      const copie = {
        ...objet,
        id: crypto.randomUUID(),
        libelle: this._nomDuplique(objet.libelle),
        x: objet.x + decalage,
        y: objet.y + decalage
      };

      this.liste.splice(this._indexInsertion(copie.zOrdre || "normal"), 0, copie);
      this._creerElement(copie);
      this._reordonnerDom();
      this._selectionner(copie);
      Statut.definir(I18n.t("objets.duplique", { libelle: copie.libelle }));
      this._notifier();
    },

    // Calcule "Nom (N)" : repart du nom de base (sans suffixe existant) et
    // prend le plus grand N déjà utilisé parmi les objets de même nom de
    // base, +1. Le tout premier duplicata donne donc "(2)".
    _nomDuplique(nomOriginal) {
      const base = nomOriginal.replace(/\s*\(\d+\)\s*$/, "");
      const echappe = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${echappe} \\((\\d+)\\)$`);
      let max = 1;
      this.liste.forEach((o) => {
        const correspondance = o.libelle.match(regex);
        if (correspondance) max = Math.max(max, parseInt(correspondance[1], 10));
      });
      return `${base} (${max + 1})`;
    },

    // Hit-testing sur un clic simple (Viewport ne propage ceci que si pas de drag).
    _surClicSimple(point) {
      if (!this.actif) return;
      const objet = this._objetAuPoint(point);
      if (objet) {
        this._selectionner(objet);
      } else {
        this._deselectionner();
      }
    },

    _objetAuPoint(point) {
      for (let i = this.liste.length - 1; i >= 0; i--) {
        if (this._pointDansObjet(point, this.liste[i])) return this.liste[i];
      }
      return null;
    },

    _pointDansObjet(point, objet) {
      const dx = point.x - objet.x;
      const dy = point.y - objet.y;
      const rad = (-objet.rotation * Math.PI) / 180;
      const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
      const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
      return Math.abs(localX) <= objet.largeur / 2 && Math.abs(localY) <= objet.hauteur / 2;
    },

    _selectionner(objet) {
      if (this.selectionnee === objet) return;
      this._deselectionner();
      this.selectionnee = objet;
      this.elements.get(objet.id).g.classList.add("selectionne");
      this._creerPoignee(objet);
      this._creerPoigneesTaille(objet);
      Statut.definir(I18n.t("objets.selectionne", { libelle: objet.libelle }));
      Inspecteur.afficher(objet, this);
    },

    // Alias public (utilisé par Mode pour désélectionner au changement de mode).
    deselectionner() {
      this._deselectionner();
    },

    _deselectionner() {
      if (!this.selectionnee) return;
      this.elements.get(this.selectionnee.id).g.classList.remove("selectionne");
      this._supprimerPoignee();
      this._supprimerPoigneesTaille();
      this.selectionnee = null;
      Statut.definir(I18n.t("objets.aucune_selection"));
      Inspecteur.masquer();
    },

    // Poignée de rotation : un petit cercle relié par un trait au-dessus de
    // l'objet, enfant de son <g> pour suivre automatiquement sa position/
    // rotation. Glisser la poignée fixe la rotation, contrainte à 90°.
    _creerPoignee(objet) {
      const { g } = this.elements.get(objet.id);
      const distance = objet.hauteur / 2 + this.DISTANCE_POIGNEE;

      const ligne = document.createElementNS(this.NS, "line");
      ligne.setAttribute("x1", 0);
      ligne.setAttribute("y1", -objet.hauteur / 2);
      ligne.setAttribute("x2", 0);
      ligne.setAttribute("y2", -distance);
      ligne.setAttribute("class", "ligne-poignee-rotation");

      const cercle = document.createElementNS(this.NS, "circle");
      cercle.setAttribute("cx", 0);
      cercle.setAttribute("cy", -distance);
      cercle.setAttribute("r", 7);
      cercle.setAttribute("class", "poignee-rotation");
      cercle.addEventListener("pointerdown", (evenement) => this._surPointerDownRotation(evenement, objet, g));

      g.appendChild(ligne);
      g.appendChild(cercle);
      this.poignee = { ligne, cercle };
    },

    _supprimerPoignee() {
      if (!this.poignee) return;
      this.poignee.ligne.remove();
      this.poignee.cercle.remove();
      this.poignee = null;
    },

    // Repositionne la poignée de rotation après un redimensionnement (sa
    // distance dépend de la hauteur) — et les poignées de taille elles-mêmes.
    _repositionnerPoignee(objet) {
      if (this.selectionnee !== objet) return;
      if (this.poignee) {
        const distance = objet.hauteur / 2 + this.DISTANCE_POIGNEE;
        this.poignee.ligne.setAttribute("y1", -objet.hauteur / 2);
        this.poignee.ligne.setAttribute("y2", -distance);
        this.poignee.cercle.setAttribute("cy", -distance);
      }
      this._positionnerPoigneesTaille(objet);
    },

    // Poignées de redimensionnement : deux carrés aux coins bas-gauche et
    // haut-droit, enfants du <g> pivoté de l'objet (suivent donc sa rotation
    // automatiquement, comme la poignée de rotation). Glisser l'une ancre le
    // coin opposé (fixe) — voir _surPointerDownTaille.
    TAILLE_POIGNEE_TAILLE: 10, // px plan, côté du carré

    _creerPoigneesTaille(objet) {
      const { g } = this.elements.get(objet.id);
      const bg = document.createElementNS(this.NS, "rect");
      const hd = document.createElementNS(this.NS, "rect");
      bg.setAttribute("class", "poignee-taille");
      hd.setAttribute("class", "poignee-taille");
      bg.addEventListener("pointerdown", (evenement) => this._surPointerDownTaille(evenement, objet, g, "bg"));
      hd.addEventListener("pointerdown", (evenement) => this._surPointerDownTaille(evenement, objet, g, "hd"));
      g.appendChild(bg);
      g.appendChild(hd);
      this.poigneesTaille = { bg, hd };
      this._positionnerPoigneesTaille(objet);
    },

    _positionnerPoigneesTaille(objet) {
      if (!this.poigneesTaille || this.selectionnee !== objet) return;
      const cote = this.TAILLE_POIGNEE_TAILLE;
      const { bg, hd } = this.poigneesTaille;
      bg.setAttribute("x", -objet.largeur / 2 - cote / 2);
      bg.setAttribute("y", objet.hauteur / 2 - cote / 2);
      bg.setAttribute("width", cote);
      bg.setAttribute("height", cote);
      hd.setAttribute("x", objet.largeur / 2 - cote / 2);
      hd.setAttribute("y", -objet.hauteur / 2 - cote / 2);
      hd.setAttribute("width", cote);
      hd.setAttribute("height", cote);
    },

    _supprimerPoigneesTaille() {
      if (!this.poigneesTaille) return;
      this.poigneesTaille.bg.remove();
      this.poigneesTaille.hd.remove();
      this.poigneesTaille = null;
    },

    // Renomme l'objet sélectionné (appelé depuis l'inspecteur).
    renommer(objet, nom) {
      objet.libelle = nom || LIBELLE_DEFAUT;
      const elements = this.elements.get(objet.id);
      if (elements.texteNom) {
        this._ajusterNomEtiquette(objet, elements.texteNom, this._tailleDepartNom(objet));
      }
      elements.titre.textContent = this._texteDimensions(objet);
      Statut.definir(I18n.t("objets.renomme", { libelle: objet.libelle }));
      this._notifier();
    },

    // Applique une nouvelle taille sans notifier (utilisé pendant un drag, pour
    // ne pas sauvegarder/annoncer à chaque pixel). La position/rotation ne bougent pas.
    _definirTaille(objet, largeurPx, hauteurPx) {
      objet.largeur = Math.max(1, largeurPx);
      objet.hauteur = Math.max(1, hauteurPx);
      const elements = this.elements.get(objet.id);
      this._appliquerDimensions(elements.rect, objet);
      elements.titre.textContent = this._texteDimensions(objet);
      if (elements.texteIcone) {
        this._appliquerTailleEtiquettes(objet, elements.texteIcone, elements.texteNom);
        this._appliquerContreRotationEtiquettes(objet);
      }
      this._repositionnerPoignee(objet);
      Inspecteur.actualiserTaille(objet);
    },

    // Redimensionne l'objet sélectionné, en pixels plan (appelé depuis
    // l'inspecteur ou la poignée de coin sur le plan) : applique + notifie en
    // un coup.
    redimensionner(objet, largeurPx, hauteurPx) {
      this._definirTaille(objet, largeurPx, hauteurPx);
      if (objet.modeleId && typeof Catalogue !== "undefined") {
        // Reconversion px -> cm : le catalogue ne garde que la donnée brute
        // (voir js/catalogue.js), jamais la taille en px d'un plan particulier.
        const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
        const largeurCm = objet.largeur / pxParCm;
        const hauteurCm = objet.hauteur / pxParCm;
        Catalogue.synchroniserDimensions(objet.modeleId, largeurCm, hauteurCm);
        this._propagerTailleAuxAutresInstances(objet, largeurCm, hauteurCm);
      }
      Statut.definir(I18n.t("objets.redimensionne", { libelle: objet.libelle }));
      this._notifier();
    },

    // Reporte la nouvelle taille (cm) sur toutes les AUTRES instances déjà
    // posées du même prefab, dans toutes les propositions ET tous les plans
    // du projet — le catalogue est partagé (voir js/catalogue.js), on attend
    // donc que toutes ses instances restent cohérentes en taille. N'a
    // d'effet que pour les modules avec prefab (objet.modeleId défini, donc
    // Meubles).
    _propagerTailleAuxAutresInstances(objet, largeurCm, hauteurCm) {
      if (typeof Propositions === "undefined") return;
      const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
      const largeurPx = largeurCm * pxParCm;
      const hauteurPx = hauteurCm * pxParCm;

      // Proposition/plan actifs : instances déjà affichées (DOM) — mise à
      // jour visuelle immédiate.
      this.liste.forEach((autre) => {
        if (autre === objet || autre.modeleId !== objet.modeleId) return;
        this._definirTaille(autre, largeurPx, hauteurPx);
      });

      // Toutes les autres propositions/plans : simples données tant
      // qu'inactifs (pas de DOM) — se redessineront à la bonne taille à la
      // prochaine bascule (voir js/propositions.js, Meubles.charger()).
      Propositions.liste.forEach((proposition) => {
        Object.entries(proposition.meublesParPlan || {}).forEach(([planId, meubles]) => {
          if (proposition === Propositions.courante && planId === Propositions.planId) return;
          meubles.forEach((autre) => {
            if (autre.modeleId !== objet.modeleId) return;
            autre.largeur = largeurPx;
            autre.hauteur = hauteurPx;
          });
        });
      });
    },

    // N'intercepte que le drag de l'objet déjà sélectionné ; sinon on laisse
    // l'événement remonter vers Viewport (pan, ou sélection via clic simple).
    _surPointerDown(evenement, objet, g) {
      if (this.selectionnee !== objet) return;

      evenement.stopPropagation();
      evenement.preventDefault();
      g.setPointerCapture(evenement.pointerId);

      const depart = {
        xEcran: evenement.clientX,
        yEcran: evenement.clientY,
        xObjet: objet.x,
        yObjet: objet.y
      };

      const surMove = (ev) => {
        const { echelle } = Viewport.zoneAffichage();
        let x = depart.xObjet + (ev.clientX - depart.xEcran) / echelle;
        let y = depart.yObjet + (ev.clientY - depart.yEcran) / echelle;
        // Aimantation sur le croisement de grille le plus proche (voir
        // grille.js) : n'agit que si la grille est active.
        const accroche = typeof Grille !== "undefined" ? Grille.pointAccroche(x, y) : null;
        if (accroche) { x = accroche.x; y = accroche.y; }
        objet.x = x;
        objet.y = y;
        this._appliquerTransform(g, objet);
        Inspecteur.actualiserLectureSeule(objet);
      };

      const surUp = (ev) => {
        g.releasePointerCapture(ev.pointerId);
        g.removeEventListener("pointermove", surMove);
        g.removeEventListener("pointerup", surUp);
        g.removeEventListener("pointercancel", surUp);
        Statut.definir(I18n.t("objets.deplace", { libelle: objet.libelle }));
        this._notifier();
      };

      g.addEventListener("pointermove", surMove);
      g.addEventListener("pointerup", surUp);
      g.addEventListener("pointercancel", surUp);
    },

    // Glisser la poignée de rotation : l'angle suit la direction du curseur
    // depuis le centre de l'objet, contraint au multiple de 45° le plus proche.
    _surPointerDownRotation(evenement, objet, g) {
      evenement.stopPropagation();
      evenement.preventDefault();
      const cercle = evenement.currentTarget;
      cercle.setPointerCapture(evenement.pointerId);

      const surMove = (ev) => {
        const point = Viewport.versCoordonneesViewBox(ev.clientX, ev.clientY);
        let angle = (Math.atan2(point.y - objet.y, point.x - objet.x) * 180) / Math.PI;
        angle += 90; // 0° = poignée vers le haut, au repos
        angle = Math.round(angle / 45) * 45;
        angle = ((angle % 360) + 360) % 360;

        if (angle === objet.rotation) return;
        objet.rotation = angle;
        this._appliquerTransform(g, objet);
        Inspecteur.actualiserLectureSeule(objet);
      };

      const surUp = (ev) => {
        cercle.releasePointerCapture(ev.pointerId);
        cercle.removeEventListener("pointermove", surMove);
        cercle.removeEventListener("pointerup", surUp);
        cercle.removeEventListener("pointercancel", surUp);
        Statut.definir(I18n.t("objets.rotation_statut", { libelle: objet.libelle, rotation: objet.rotation }));
        this._notifier();
      };

      cercle.addEventListener("pointermove", surMove);
      cercle.addEventListener("pointerup", surUp);
      cercle.addEventListener("pointercancel", surUp);
    },

    // Glisser une poignée de coin (bas-gauche "bg"/haut-droit "hd") :
    // redimensionne en ancrant le coin opposé, dans le repère LOCAL (tourné)
    // de l'objet — la rotation reste figée pendant tout le drag. Le coin
    // ancré est calculé une fois au pointerdown (position monde figée) ;
    // à chaque déplacement, le curseur est reprojeté dans ce repère local
    // pour en déduire largeur/hauteur (valeur absolue, bornée à un minimum)
    // et le nouveau centre (milieu ancre/coin glissé, reconverti en monde).
    _surPointerDownTaille(evenement, objet, g, coin) {
      evenement.stopPropagation();
      evenement.preventDefault();
      const poignee = evenement.currentTarget;
      poignee.setPointerCapture(evenement.pointerId);

      const rad = (objet.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Coin ancré = opposé du coin glissé, en repère local pré-rotation.
      const ancreLocale = coin === "hd"
        ? { x: -objet.largeur / 2, y: objet.hauteur / 2 } // bas-gauche
        : { x: objet.largeur / 2, y: -objet.hauteur / 2 }; // haut-droit
      const signeX = coin === "hd" ? 1 : -1;
      const signeY = coin === "hd" ? -1 : 1;

      const ancreMonde = {
        x: objet.x + ancreLocale.x * cos - ancreLocale.y * sin,
        y: objet.y + ancreLocale.x * sin + ancreLocale.y * cos
      };

      const TAILLE_MIN = 5; // px plan

      const surMove = (ev) => {
        const point = Viewport.versCoordonneesViewBox(ev.clientX, ev.clientY);
        const dxMonde = point.x - ancreMonde.x;
        const dyMonde = point.y - ancreMonde.y;

        // Repère local pré-rotation : R(-rotation) appliqué au delta monde.
        let dxLocal = dxMonde * cos + dyMonde * sin;
        let dyLocal = -dxMonde * sin + dyMonde * cos;
        dxLocal = signeX > 0 ? Math.max(TAILLE_MIN, dxLocal) : Math.min(-TAILLE_MIN, dxLocal);
        dyLocal = signeY > 0 ? Math.max(TAILLE_MIN, dyLocal) : Math.min(-TAILLE_MIN, dyLocal);

        const centreLocalX = dxLocal / 2;
        const centreLocalY = dyLocal / 2;
        objet.x = ancreMonde.x + centreLocalX * cos - centreLocalY * sin;
        objet.y = ancreMonde.y + centreLocalX * sin + centreLocalY * cos;

        this._definirTaille(objet, Math.abs(dxLocal), Math.abs(dyLocal));
        this._appliquerTransform(g, objet);
        Inspecteur.actualiserLectureSeule(objet);
      };

      const surUp = (ev) => {
        poignee.releasePointerCapture(ev.pointerId);
        poignee.removeEventListener("pointermove", surMove);
        poignee.removeEventListener("pointerup", surUp);
        poignee.removeEventListener("pointercancel", surUp);
        this.redimensionner(objet, objet.largeur, objet.hauteur);
      };

      poignee.addEventListener("pointermove", surMove);
      poignee.addEventListener("pointerup", surUp);
      poignee.addEventListener("pointercancel", surUp);
    },

  };
}
