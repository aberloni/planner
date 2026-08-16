// Origine du plan : point de référence (0,0) utilisé par les règles et la
// grille, distinct du coin de l'image de fond. Se définit en cliquant un
// point sur le plan (même mécanique qu'Échelle, voir echelle.js) : stocke
// un décalage (en px image) entre le coin du fond et l'origine choisie —
// le fond, les meubles et l'échelle restent inchangés, seul l'affichage
// (règles/grille) et l'aimantation de la grille (voir grille.js) en tiennent
// compte. Tant qu'aucune origine n'a été définie, décalage = (0,0) :
// l'origine reste le coin du fond.
const Origine = {

  NS: "http://www.w3.org/2000/svg",

  svg: null,
  decalageX: 0,
  decalageY: 0,
  definie: false, // false = pas encore choisie explicitement (décalage (0,0) = coin du fond)
  actif: false,
  ecouteurs: [], // callbacks appelés quand l'origine vient d'être (re)définie

  marqueur: null,
  ligneH: null,
  ligneV: null,
  point: null,

  init(svgEl) {
    this.svg = svgEl;
    Viewport.alClicSimple((point) => this._surClic(point));
    this._creerMarqueur();
  },

  alDefinie(callback) {
    this.ecouteurs.push(callback);
  },

  demarrer() {
    if (!Viewport.largeurPlan) return;
    this.actif = true;
    this.svg.classList.add("calibration-active");
    Statut.definir(I18n.t("origine.clic_definir"));
  },

  _surClic(point) {
    if (!this.actif) return;
    this.actif = false;
    this.svg.classList.remove("calibration-active");
    this.definir(point.x, point.y);
    Statut.definir(I18n.t("origine.definie"));
  },

  definir(x, y) {
    this.decalageX = x;
    this.decalageY = y;
    this.definie = true;
    this._appliquerMarqueur();
    if (typeof Regles !== "undefined") Regles.redessiner();
    if (typeof Grille !== "undefined") Grille.redessiner();
    this.ecouteurs.forEach((callback) => callback());
  },

  // Reprend un décalage sauvegardé (restauration/import de projet) — sans
  // notifier (appelé pendant le chargement, avant que Regles/Grille soient
  // prêts à redessiner).
  charger(decalageX, decalageY) {
    this.decalageX = decalageX || 0;
    this.decalageY = decalageY || 0;
    this.definie = !!(decalageX || decalageY);
    this._appliquerMarqueur();
  },

  // Remet l'origine au coin du fond (nouveau plan importé).
  reinitialiser() {
    this.decalageX = 0;
    this.decalageY = 0;
    this.definie = false;
    this._appliquerMarqueur();
  },

  _creerMarqueur() {
    this.marqueur = document.createElementNS(this.NS, "g");
    this.marqueur.setAttribute("id", "marqueur-origine");
    this.marqueur.style.pointerEvents = "none";

    this.ligneH = document.createElementNS(this.NS, "line");
    this.ligneV = document.createElementNS(this.NS, "line");
    this.point = document.createElementNS(this.NS, "circle");
    this.ligneH.setAttribute("class", "ligne-origine");
    this.ligneV.setAttribute("class", "ligne-origine");
    this.point.setAttribute("class", "point-origine");
    this.point.setAttribute("r", 4);

    this.marqueur.appendChild(this.ligneH);
    this.marqueur.appendChild(this.ligneV);
    this.marqueur.appendChild(this.point);
    this.svg.appendChild(this.marqueur);
  },

  _appliquerMarqueur() {
    this.marqueur.style.display = this.definie ? "" : "none";
    if (!this.definie) return;

    const DEMI_TAILLE = 16; // px plan — croix fixe, indépendante du zoom
    const x = this.decalageX;
    const y = this.decalageY;
    this.ligneH.setAttribute("x1", x - DEMI_TAILLE);
    this.ligneH.setAttribute("y1", y);
    this.ligneH.setAttribute("x2", x + DEMI_TAILLE);
    this.ligneH.setAttribute("y2", y);
    this.ligneV.setAttribute("x1", x);
    this.ligneV.setAttribute("y1", y - DEMI_TAILLE);
    this.ligneV.setAttribute("x2", x);
    this.ligneV.setAttribute("y2", y + DEMI_TAILLE);
    this.point.setAttribute("cx", x);
    this.point.setAttribute("cy", y);
  }
};
