// Propositions d'agencement : un plan peut avoir plusieurs propositions de
// disposition des meubles, chacune avec sa propre liste de meubles
// indépendante. Le blueprint et l'habillage restent communs à toutes les
// propositions — voir documentation/16-propositions.md.
//
// Bascule : Meubles.liste est toujours la liste de la proposition ACTIVE.
// Au changement de proposition, on recopie Meubles.liste vers la
// proposition qu'on quitte (_sauvegarderMeublesCourante), puis on recharge
// Meubles avec la liste de la proposition qu'on active (Meubles.charger(...)).
const Propositions = {

  liste: [], // [{ id, nom, meubles: [] }]
  courante: null,
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

  // Recopie la liste de meubles courante dans le projet avant sauvegarde/export
  // (Meubles.liste peut avoir changé depuis la dernière bascule de proposition).
  synchroniser() {
    this._sauvegarderMeublesCourante();
  },

  // Remplace intégralement la liste des propositions (import/restauration de
  // projet). Crée une proposition par défaut si la liste est vide.
  charger(liste) {
    this.liste = (liste && liste.length)
      ? liste.map((p) => ({ ...p, meubles: p.meubles || [] }))
      : [{ id: crypto.randomUUID(), nom: "Proposition 1", meubles: [] }];
    this._activer(this.liste[0]);
  },

  // Crée une nouvelle proposition et bascule dessus. `dupliquer` reprend la
  // disposition (liste de meubles + position) de la proposition active comme
  // point de départ (copie indépendante, nouveaux id) ; sinon proposition
  // vide. Dans les deux cas modeleId reste inchangé : les prefabs du
  // catalogue restent partagés, seules les instances/positions sont propres
  // à chaque proposition — voir documentation/16-propositions.md.
  ajouter(nom, dupliquer) {
    if (!Viewport.largeurPlan) return;

    const meubles = dupliquer
      ? Meubles.liste.map((objet) => ({ ...objet, id: crypto.randomUUID() }))
      : [];

    const proposition = {
      id: crypto.randomUUID(),
      nom: nom || `Proposition ${this.liste.length + 1}`,
      meubles
    };
    this._sauvegarderMeublesCourante();
    this.liste.push(proposition);
    this._activer(proposition);
    Statut.definir(`Proposition ajoutée et active : ${proposition.nom}${dupliquer ? " (disposition dupliquée)" : ""}.`);
  },

  // Renomme la proposition active (appelée depuis le menu kebab, via prompt()).
  renommer(nom) {
    if (!this.courante) return;
    this.courante.nom = nom || this.courante.nom;
    this._actualiserAffichage();
    Statut.definir(`Proposition renommée : ${this.courante.nom}.`);
    this._notifier();
  },

  // Supprime la proposition active et bascule sur une autre — appelée depuis
  // la barre d'outils, confirmation déjà faite par l'appelant. Refuse de
  // supprimer la dernière proposition restante (il en faut toujours au moins une).
  supprimer() {
    if (!this.courante || this.liste.length <= 1) return;

    const index = this.liste.indexOf(this.courante);
    const nom = this.courante.nom;
    this.liste.splice(index, 1);
    const suivante = this.liste[index] || this.liste[index - 1];
    this.courante = null; // évite que _activer resauvegarde les meubles sur la proposition supprimée
    this._activer(suivante);
    Statut.definir(`Proposition supprimée : ${nom}.`);
  },

  basculerVers(proposition) {
    if (proposition === this.courante) return;
    this._sauvegarderMeublesCourante();
    this._activer(proposition);
  },

  _sauvegarderMeublesCourante() {
    if (this.courante) this.courante.meubles = Meubles.liste;
  },

  _activer(proposition) {
    this.courante = proposition;
    Meubles.charger(proposition.meubles);
    this._actualiserAffichage();
    Statut.definir(`Proposition active : ${proposition.nom}.`);
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
