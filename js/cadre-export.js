// Cadre d'export : rectangle en pointillé délimitant la zone exportée en
// PNG (voir js/app.js, exporterPNG()). Toujours axis-aligned (pas de
// rotation) — x/y désignent le coin haut-gauche, pas le centre (contraste
// volontaire avec Meuble/Habillage, qui n'ont pas besoin de pivoter).
// Seules 2 poignées de coin (haut-droit / bas-gauche) permettent de
// redimensionner, en ancrant le coin opposé — même principe que le
// redimensionnement des objets (voir js/objets.js), mais sans la
// complexité de la rotation puisque le cadre n'en a pas.
const CadreExport = {

  NS: "http://www.w3.org/2000/svg",
  TAILLE_MIN_CM: 10,

  svg: null,
  groupe: null,
  rect: null,
  poigneeHD: null,
  poigneeBG: null,
  cadre: { x: 0, y: 0, largeur: 0, hauteur: 0 },
  ecouteurs: [],

  init(svgEl) {
    this.svg = svgEl;

    this.groupe = document.createElementNS(this.NS, "g");
    this.groupe.setAttribute("id", "cadre-export");

    this.rect = document.createElementNS(this.NS, "rect");
    this.rect.setAttribute("class", "cadre-export-rect");
    this.groupe.appendChild(this.rect);

    this.poigneeHD = this._creerPoignee();
    this.poigneeBG = this._creerPoignee();
    this.poigneeHD.addEventListener("pointerdown", (ev) => this._surPointerDownPoignee(ev, "hautDroit"));
    this.poigneeBG.addEventListener("pointerdown", (ev) => this._surPointerDownPoignee(ev, "basGauche"));

    // Ajouté en dernier : toujours au-dessus des calques et des objets.
    this.svg.appendChild(this.groupe);
  },

  alChangement(callback) {
    this.ecouteurs.push(callback);
  },

  _notifier() {
    this.ecouteurs.forEach((callback) => callback());
  },

  // Cadre par défaut : couvre tout le plan.
  reinitialiser() {
    this.cadre = { x: 0, y: 0, largeur: Viewport.largeurPlan, hauteur: Viewport.hauteurPlan };
    this._appliquer();
  },

  // Reprend un cadre sauvegardé (restauration/import de projet).
  definir(cadre) {
    if (!cadre) {
      this.reinitialiser();
      return;
    }
    this.cadre = { ...cadre };
    this._appliquer();
  },

  _creerPoignee() {
    const p = document.createElementNS(this.NS, "rect");
    p.setAttribute("width", 12);
    p.setAttribute("height", 12);
    p.setAttribute("class", "poignee-cadre-export");
    this.groupe.appendChild(p);
    return p;
  },

  _appliquer() {
    const c = this.cadre;
    this.rect.setAttribute("x", c.x);
    this.rect.setAttribute("y", c.y);
    this.rect.setAttribute("width", c.largeur);
    this.rect.setAttribute("height", c.hauteur);

    const cote = 12;
    this.poigneeHD.setAttribute("x", c.x + c.largeur - cote / 2);
    this.poigneeHD.setAttribute("y", c.y - cote / 2);
    this.poigneeBG.setAttribute("x", c.x - cote / 2);
    this.poigneeBG.setAttribute("y", c.y + c.hauteur - cote / 2);
  },

  // Glisser une poignée de coin : ancre le coin opposé (fixe), le cadre
  // devient la boîte englobante entre l'ancre et le curseur.
  _surPointerDownPoignee(evenement, quelle) {
    evenement.stopPropagation();
    evenement.preventDefault();
    const cible = evenement.currentTarget;
    cible.setPointerCapture(evenement.pointerId);

    const c = this.cadre;
    const ancre = quelle === "hautDroit"
      ? { x: c.x, y: c.y + c.hauteur }
      : { x: c.x + c.largeur, y: c.y };

    const tailleMin = this.TAILLE_MIN_CM * (Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT);

    const surMove = (ev) => {
      const point = Viewport.versCoordonneesViewBox(ev.clientX, ev.clientY);
      const x1 = Math.min(ancre.x, point.x);
      let x2 = Math.max(ancre.x, point.x);
      const y1 = Math.min(ancre.y, point.y);
      let y2 = Math.max(ancre.y, point.y);
      if (x2 - x1 < tailleMin) x2 = x1 + tailleMin;
      if (y2 - y1 < tailleMin) y2 = y1 + tailleMin;

      this.cadre = { x: x1, y: y1, largeur: x2 - x1, hauteur: y2 - y1 };
      this._appliquer();
    };

    const surUp = (ev) => {
      cible.releasePointerCapture(ev.pointerId);
      cible.removeEventListener("pointermove", surMove);
      cible.removeEventListener("pointerup", surUp);
      cible.removeEventListener("pointercancel", surUp);
      this._notifier();
    };

    cible.addEventListener("pointermove", surMove);
    cible.addEventListener("pointerup", surUp);
    cible.addEventListener("pointercancel", surUp);
  }
};
