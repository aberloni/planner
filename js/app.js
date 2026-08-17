// Point d'entrée : orchestration entre Blueprint, Viewport et l'UI.
(function () {
  const zoneTravail = document.getElementById("zone-travail");
  const svg = document.getElementById("viewport");
  const inputFichier = document.getElementById("input-fichier-blueprint");
  const btnImporter = document.getElementById("btn-importer-blueprint");
  const btnEchelle = document.getElementById("btn-echelle");
  const labelEchelle = document.getElementById("label-echelle");
  const btnOrigine = document.getElementById("btn-origine");
  const labelOrigine = document.getElementById("label-origine");
  const btnZoomMoins = document.getElementById("btn-zoom-moins");
  const btnZoomPlus = document.getElementById("btn-zoom-plus");
  const btnZoom100 = document.getElementById("btn-zoom-100");
  const btnCadrer = document.getElementById("btn-cadrer");
  const regleHorizontale = document.getElementById("regle-horizontale");
  const regleVerticale = document.getElementById("regle-verticale");
  const statut = document.getElementById("statut");
  const btnAjouterMeuble = document.getElementById("btn-ajouter-meuble");
  const btnMode = document.getElementById("btn-mode");
  const labelPropositionActive = document.getElementById("label-proposition-active");
  const btnMenuProposition = document.getElementById("btn-menu-proposition");
  const menuProposition = document.getElementById("menu-proposition");
  const menuPropositionListe = document.getElementById("menu-proposition-liste");
  const btnAjouterProposition = document.getElementById("btn-ajouter-proposition");
  const btnRenommerProposition = document.getElementById("btn-renommer-proposition");
  const btnSupprimerProposition = document.getElementById("btn-supprimer-proposition");
  const btnOuvrirProjet = document.getElementById("btn-ouvrir-projet");
  const btnExporterProjet = document.getElementById("btn-exporter-projet");
  const inputFichierProjet = document.getElementById("input-fichier-projet");
  const btnImporterCatalogue = document.getElementById("vue-catalogue-importer");
  const btnExporterCatalogue = document.getElementById("vue-catalogue-exporter");
  const inputFichierCatalogue = document.getElementById("input-fichier-catalogue");
  const btnImprimerCatalogue = document.getElementById("vue-catalogue-imprimer");
  const btnEditerCatalogue = document.getElementById("btn-editer-catalogue");
  const impressionCatalogue = document.getElementById("impression-catalogue");
  const btnExporterPng = document.getElementById("btn-exporter-png");
  const btnGrille = document.getElementById("btn-grille");
  const btnMesurer = document.getElementById("btn-mesurer");
  const grilleCanvas = document.getElementById("grille-canvas");
  const btnChangerProjet = document.getElementById("btn-changer-projet");
  const labelProjetActuel = document.getElementById("label-projet-actuel");
  const btnChangerPlan = document.getElementById("btn-changer-plan");
  const labelPlanActuel = document.getElementById("label-plan-actuel");
  const btnEditerCatalogueDepuisPlans = document.getElementById("btn-editer-catalogue-plans");
  const labelVueCatalogueProjet = document.getElementById("vue-catalogue-projet");
  const sidebarPlansFond = document.getElementById("sidebar-plans-fond");
  const sidebarPlansFermer = document.getElementById("sidebar-plans-fermer");
  const sidebarPlansListe = document.getElementById("sidebar-plans-liste");
  const sidebarPlansNouveau = document.getElementById("sidebar-plans-nouveau");
  const btnLangue = document.getElementById("btn-langue");

  const btnLangueIcone = document.getElementById("btn-langue-icone");
  const DRAPEAUX_LANGUE = { fr: "icones/ui/drapeau-fr.svg", en: "icones/ui/drapeau-en.svg" };
  btnLangueIcone.src = DRAPEAUX_LANGUE[I18n.langue];
  btnLangue.addEventListener("click", () => {
    I18n.basculer();
    btnLangueIcone.src = DRAPEAUX_LANGUE[I18n.langue];
  });

  document.getElementById("filigrane-version").textContent = `v${VERSION}`;

  Viewport.init(svg);
  Statut.init(statut);
  Echelle.init(svg);
  Mesure.init(svg, btnMesurer);
  Origine.init(svg);
  Regles.init(regleHorizontale, regleVerticale);
  Grille.init(grilleCanvas);
  EchelleVisuelle.init(document.getElementById("echelle-visuelle"), document.getElementById("echelle-visuelle-barre"));
  CadreExport.init(svg);
  CadreExport.alChangement(() => sauvegarderProjet());
  Inspecteur.init({
    panneau: document.getElementById("inspecteur"),
    type: document.getElementById("insp-type"),
    ligneType: document.getElementById("insp-ligne-type"),
    ligneModele: document.getElementById("insp-ligne-modele"),
    modele: document.getElementById("insp-modele"),
    nom: document.getElementById("insp-nom"),
    forme: document.getElementById("insp-forme"),
    largeur: document.getElementById("insp-largeur"),
    profondeur: document.getElementById("insp-profondeur"),
    hauteurCm: document.getElementById("insp-hauteur-cm"),
    ligneHauteurCm: document.getElementById("insp-ligne-hauteur-cm"),
    ouvrirCatalogue: document.getElementById("insp-ouvrir-catalogue"),
    position: document.getElementById("insp-position"),
    rotation: document.getElementById("insp-rotation"),
    zOrdre: document.getElementById("insp-z-ordre"),
    supprimer: document.getElementById("insp-supprimer"),
    dupliquer: document.getElementById("btn-dupliquer")
  });
  Meubles.init(Viewport.calques.meubles);
  Meubles.alChangement(() => sauvegarderProjet());
  Habillage.init(Viewport.calques.habillage);
  Habillage.alChangement(() => sauvegarderProjet());
  Catalogue.init({
    panneau: document.getElementById("panneau-catalogue"),
    liste: document.getElementById("catalogue-liste"),
    boutonNouveau: document.getElementById("btn-nouveau-modele")
  });
  // Le catalogue est GLOBAL (partagé par tous les plans, voir
  // js/catalogue-stockage.js), donc sauvegardé à part, jamais dans le
  // Projet du plan courant.
  Catalogue.alChangement(() => sauvegarderCatalogue());
  EditionCatalogue.init({
    overlay: document.getElementById("vue-catalogue"),
    tbody: document.getElementById("vue-catalogue-tbody"),
    fermer: document.getElementById("vue-catalogue-fermer"),
    nouveau: document.getElementById("vue-catalogue-nouveau"),
    onglets: document.querySelectorAll(".vue-catalogue-onglet")
  });
  Propositions.init({
    label: labelPropositionActive,
    listeConteneur: menuPropositionListe,
    fermerMenu: () => menuProposition.classList.remove("visible")
  });
  Propositions.alChangement(() => sauvegarderProjet());
  Propositions.alChangement(() => Catalogue.masquer());
  Viewport.alChangement(() => Regles.redessiner());
  Viewport.alChangement(() => Grille.redessiner());
  Viewport.alChangement(() => {
    btnZoom100.textContent = `${Math.round(Viewport.zoomActuel() * 100)}%`;
  });

  function appliquerMode(mode) {
    const enEdition = mode === Mode.EDITION;
    Viewport.calques.meubles.style.display = enEdition ? "" : "none";
    Meubles.actif = enEdition;
    Habillage.actif = !enEdition;
    Viewport.calques.meubles.classList.toggle("verrouille", !enEdition);
    Viewport.calques.habillage.classList.toggle("verrouille", enEdition);
    if (!enEdition) Meubles.deselectionner();
    if (enEdition) Habillage.deselectionner();
    Catalogue.masquer();
    btnAjouterMeuble.title = enEdition ? I18n.t("app.ajouter_meuble_title_edition") : I18n.t("app.ajouter_meuble_title_clean");
  }

  Mode.init(btnMode);
  Mode.alChangement(appliquerMode);
  appliquerMode(Mode.actuel); // synchronise l'état initial (pas d'événement au chargement)

  let blueprintActuel = null; // { chemin, largeurPx, hauteurPx } — chemin RELATIF (imports/<projetId>/<nom>), jamais de contenu embarqué, voir js/blueprint.js
  let projetId = null; // identifiant unique DU PLAN courant (nom de fichier par défaut à l'export) — pas à confondre avec projetActuel (le PROJET, voir js/projets.js)
  let projetActuel = null; // projet en cours (voir js/projets.js) : { id, nom }, null avant tout choix
  let planActuel = null; // plan en cours (voir js/plans.js) : { id, nom } en mode local, { fichier, nom } en mode fichiers, null avant tout choix

  function mettreAJourBoutonEchelle() {
    labelEchelle.textContent = Echelle.pxParCm ? `${Math.round(Echelle.pxParCm * 100)}px/m` : "";
  }

  Echelle.alDefinie(mettreAJourBoutonEchelle);

  // Coordonnées affichées en cm depuis le coin du blueprint (mêmes unités
  // que les règles/la grille) — dépend donc aussi de l'échelle, pas
  // seulement de l'origine.
  function mettreAJourBoutonOrigine() {
    if (!Origine.definie || !Echelle.pxParCm) {
      labelOrigine.textContent = "";
      return;
    }
    const xCm = Math.round(Origine.decalageX / Echelle.pxParCm);
    const yCm = Math.round(Origine.decalageY / Echelle.pxParCm);
    labelOrigine.textContent = `(${xCm}, ${yCm}) cm`;
  }

  Origine.alDefinie(mettreAJourBoutonOrigine);
  Echelle.alDefinie(mettreAJourBoutonOrigine);

  // Construit l'état complet du plan (blueprint + habillage) pour
  // sauvegarde/export. Les propositions ne sont PAS incluses : elles sont
  // au niveau du projet, partagées par tous ses plans — voir
  // js/propositions.js/js/propositions-stockage.js.
  function construireProjet() {
    Propositions.synchroniser(); // recopie Meubles.liste dans la proposition active, pour ce plan
    return {
      version: 1,
      id: projetId,
      nom: planActuel ? planActuel.nom : null,
      plan: {
        cheminImage: blueprintActuel.chemin,
        largeurPx: blueprintActuel.largeurPx,
        hauteurPx: blueprintActuel.hauteurPx,
        echellePxParCm: Echelle.pxParCm,
        origineX: Origine.definie ? Origine.decalageX : null,
        origineY: Origine.definie ? Origine.decalageY : null
      },
      habillage: Habillage.liste,
      cadreExport: CadreExport.cadre
    };
  }

  // Sauvegarde toujours dans le filet de sécurité localStorage (marche
  // partout, y compris file://) et, si un plan est actif (voir
  // js/plans.js), dans le plan lui-même — localStorage en mode local,
  // plans/*.json (via PHP) en mode fichiers. Le catalogue N'EST PAS inclus
  // ici : il est global (partagé par tous les plans), sauvegardé à part
  // par sauvegarderCatalogue() — voir js/catalogue-stockage.js. Les
  // propositions non plus : global au projet aussi, sauvegardées à part par
  // PropositionsStockage (voir js/propositions-stockage.js), mais à chaque
  // sauvegarde de plan (contrairement au catalogue) car leurs meubles
  // changent à chaque édition.
  function sauvegarderProjet() {
    if (!blueprintActuel) return;
    const projet = construireProjet();
    Stockage.sauvegarder(projet);
    if (planActuel) Plans.sauvegarder(planActuel, projet);
    PropositionsStockage.sauvegarder(Propositions.liste);
  }

  function sauvegarderCatalogue() {
    CatalogueStockage.sauvegarder(Catalogue.id, Catalogue.liste);
  }

  Echelle.alDefinie(sauvegarderProjet);
  Origine.alDefinie(sauvegarderProjet);

  // Applique un projet complet (restauration locale, import de fichier) :
  // blueprint, échelle et meubles. Remplace tout ce qui était affiché.
  // Vue d'ensemble systématique sur le cadre d'export via le même algo que
  // le bouton "Cadrer" (Viewport.cadrerSurRectangle) à chaque changement de
  // plan, plutôt que de tenter de reproduire le cadrage du plan précédent.
  function appliquerProjet(projet, messageStatut) {
    if (!projet || !projet.plan) return;

    const { cheminImage, largeurPx, hauteurPx, echellePxParCm, origineX, origineY } = projet.plan;
    blueprintActuel = { chemin: cheminImage, largeurPx, hauteurPx };
    projetId = projet.id || crypto.randomUUID(); // reprend l'id existant, ou en génère un (anciens fichiers)
    Echelle.pxParCm = echellePxParCm || Echelle.PX_PAR_CM_DEFAUT;
    Origine.charger(origineX, origineY);
    Viewport.definirPlan(cheminImage, largeurPx, hauteurPx);
    zoneTravail.classList.add("blueprint-charge");
    Habillage.charger(projet.habillage || []);
    // Le catalogue est global (voir js/catalogue-stockage.js), pas rechargé
    // ici. Un éventuel catalogue embarqué (ancien format, incompatible) est
    // ignoré — pas de migration, voir documentation/17-catalogue.md. Les
    // propositions non plus : global au projet, déjà chargées à son
    // ouverture (voir chargerPropositionsProjet) — on affiche juste celles
    // de CE plan (garde la même proposition active par id).
    Propositions.activerPourPlan(idPlanActuel());
    CadreExport.definir(projet.cadreExport);
    Viewport.cadrerSurRectangle(CadreExport.cadre);
    Regles.redessiner();
    Grille.redessiner();
    mettreAJourBoutonEchelle();
    mettreAJourBoutonOrigine();
    Statut.definir(messageStatut);
    sauvegarderProjet();
  }

  async function chargerFichierBlueprint(fichier) {
    try {
      const { chemin, largeurPx, hauteurPx } = await Blueprint.charger(fichier, { mode: Plans.mode });

      // Un blueprint était déjà chargé : on ne fait que remplacer l'image de
      // fond, sans toucher à l'échelle, aux meubles/habillage, au catalogue,
      // aux propositions ni au cadre d'export — l'utilisateur n'a pas à tout
      // recaler après un simple changement d'image de fond.
      if (blueprintActuel) {
        blueprintActuel = { chemin, largeurPx, hauteurPx };
        Viewport.definirPlan(chemin, largeurPx, hauteurPx);
        Regles.redessiner();
        Grille.redessiner();
        sauvegarderProjet();
        Statut.definir(I18n.t("app.blueprint_remplace"));
        return;
      }

      blueprintActuel = { chemin, largeurPx, hauteurPx };
      // Nouveau projet = nouvel identifiant, sauf s'il s'agit du premier
      // blueprint importé dans un plan local déjà créé (reprend son id).
      projetId = (planActuel && Plans.mode === Plans.MODE_LOCAL) ? planActuel.id : crypto.randomUUID();
      Echelle.pxParCm = Echelle.PX_PAR_CM_DEFAUT;
      Origine.reinitialiser();
      Habillage.charger([]);
      // Catalogue et propositions non touchés : globaux, partagés par tous
      // les plans (voir js/catalogue-stockage.js/js/propositions.js), pas
      // remis à zéro pour un nouveau plan. Meubles vide naturellement : ce
      // nouveau plan n'a encore aucune donnée dans meublesParPlan.
      Propositions.activerPourPlan(idPlanActuel());
      Viewport.definirPlan(chemin, largeurPx, hauteurPx);
      zoneTravail.classList.add("blueprint-charge");
      CadreExport.reinitialiser(); // cadre = tout le nouveau blueprint
      Regles.redessiner();
      Grille.redessiner();
      mettreAJourBoutonEchelle();
      mettreAJourBoutonOrigine();
      sauvegarderProjet();
      Statut.definir(I18n.t("app.blueprint_importe"));
    } catch (erreur) {
      alert(erreur.message);
    }
  }

  // Charge le catalogue du projet donné une seule fois à son ouverture —
  // voir js/catalogue-stockage.js. Pas de migration depuis les anciens
  // catalogues embarqués par plan : rien de sauvegardé encore = catalogue
  // vide, on repart de zéro.
  async function chargerCatalogueProjet(projetIdCible, projetNom) {
    CatalogueStockage.init(projetIdCible);
    const donnees = await CatalogueStockage.charger();
    Catalogue.charger(donnees ? donnees.catalogue : [], donnees ? donnees.id : null);
    console.log("[debug] catalogue chargé (index.html)", {
      projetId: projetIdCible,
      projetNom,
      catalogueId: Catalogue.id,
      nbObjets: Catalogue.liste.length,
      objetsIds: Catalogue.liste.map((m) => m.id)
    });
  }

  // Au démarrage : rouvre directement le dernier projet utilisé s'il existe
  // encore (voir Projets.memoriserDernier/dernierProjetId), sinon affiche
  // l'écran de choix (voir js/projets.js, js/selecteur-projets.js et
  // documentation/21-projets.md).
  async function demarrerSelectionProjet() {
    Projets.init();
    const liste = await Projets.lister();
    const dernierId = Projets.dernierProjetId();
    const dernier = dernierId ? liste.find((p) => p.id === dernierId) : null;
    if (dernier) {
      ouvrirProjet(dernier);
      return;
    }
    SelecteurProjets.afficher(liste, (projet) => ouvrirProjet(projet));
  }

  // Ouvre un projet : scope Plans/CatalogueStockage dessus, puis affiche
  // toujours l'écran de choix de plan (voir js/plans.js,
  // js/selecteur-plans.js et documentation/20-plans.md) — pas de reprise
  // automatique du dernier plan utilisé. `projet.nouveau` (voir
  // js/selecteur-projets.js) : le crée d'abord.
  async function ouvrirProjet(projet) {
    if (projet.nouveau) projet = Projets.creer(projet.nom);

    projetActuel = projet;
    labelProjetActuel.textContent = projet.nom;
    labelVueCatalogueProjet.textContent = `— ${projet.nom}`;
    Projets.memoriserDernier(projet);

    console.log("[debug] projet ouvert (index.html)", { projetId: projet.id, projetNom: projet.nom });
    Plans.init(projet.id);
    await chargerCatalogueProjet(projet.id, projet.nom);
    await Propositions.chargerProjet(projet.id);

    const liste = await Plans.lister();

    // masquer()/afficher() juste après, sans await entre les deux : évite un
    // flash de l'app vide entre les deux écrans de choix.
    SelecteurProjets.masquer();
    SelecteurPlans.afficher(liste, (plan) => ouvrirPlan(plan));
  }

  // Verrou : bloque toute nouvelle ouverture de plan tant qu'une précédente
  // n'est pas terminée (ex. double-clic ou clic sur un autre plan pendant le
  // chargement) — sans ça, deux chargements pouvaient se chevaucher et le
  // plus lent à répondre (souvent en MODE_FICHIERS, latence réseau
  // variable) écrasait l'affichage en dernier, même s'il correspondait à un
  // clic plus ancien, donnant parfois un blueprint qui ne correspond pas au
  // plan affiché dans la barre d'outils.
  let chargementPlanEnCours = false;

  async function ouvrirPlan(plan) {
    if (chargementPlanEnCours) return;
    SelecteurPlans.masquer();
    // #zone-travail passe de display:none à visible ici : les canvas
    // (règles/grille) avaient une taille nulle tant qu'ils étaient cachés,
    // il faut les re-mesurer maintenant (pas seulement au resize fenêtre).
    Regles.redimensionner();
    Grille.redimensionner();

    if (plan.nouveau) {
      // Le fichier/id cible est désigné dès maintenant côté client (voir
      // js/plans.js) : le plan n'existe vraiment côté stockage qu'à la
      // première sauvegarde (après import d'un blueprint).
      planActuel = Plans.mode === Plans.MODE_LOCAL
        ? { id: Plans.creer(plan.nom), nom: plan.nom }
        : { fichier: `${crypto.randomUUID()}.json`, nom: plan.nom };
      labelPlanActuel.textContent = planActuel.nom;
      Statut.definir(I18n.t("app.plan_nouveau_statut"));
      inputFichier.click(); // ouvre tout de suite le sélecteur d'image, sinon l'écran vide ("Aucun blueprint importé") passe pour un plantage
      return;
    }

    chargementPlanEnCours = true;
    sidebarPlansListe.classList.add("chargement");
    try {
      const projet = await Plans.charger(plan);

      if (!projet) {
        alert(I18n.t("app.plan_impossible_charger"));
        SelecteurPlans.afficher(await Plans.lister(), (p) => ouvrirPlan(p));
        return;
      }
      planActuel = plan;
      labelPlanActuel.textContent = planActuel.nom;
      appliquerProjet(projet, I18n.t("app.plan_ouvert", { nom: plan.nom }));
      console.log("[debug] plan ouvert (index.html)", {
        planId: plan.id || plan.fichier,
        planNom: plan.nom,
        projetId: projetActuel ? projetActuel.id : null,
        catalogueId: Catalogue.id,
        nbObjetsCatalogue: Catalogue.liste.length
      });
    } finally {
      chargementPlanEnCours = false;
      sidebarPlansListe.classList.remove("chargement");
    }
  }

  // Exporte le PROJET complet (tous ses plans + son catalogue) en un seul
  // fichier — voir importerFichierProjet pour la lecture. Plans/Catalogue
  // sont déjà scopés au projet ouvert (voir ouvrirProjet), donc Plans.lister()
  // et Catalogue.liste ne portent que sur lui.
  async function exporterProjet() {
    if (!blueprintActuel) {
      alert(I18n.t("app.importer_blueprint_avant_projet"));
      return;
    }
    const liste = await Plans.lister();
    const plans = [];
    for (const plan of liste) {
      const estActif = (plan.id && planActuel && plan.id === planActuel.id)
        || (plan.fichier && planActuel && plan.fichier === planActuel.fichier);
      // Le plan actuellement ouvert peut avoir des changements pas encore
      // resauvegardés côté stockage (rare, mais évite une course) : on
      // reprend l'état en mémoire plutôt que de le relire.
      const projet = estActif ? construireProjet() : await Plans.charger(plan);
      if (projet) plans.push(projet);
    }

    // Le plan actif peut avoir des meubles pas encore resynchronisés dans sa
    // proposition active (voir construireProjet) : fait avant d'exporter
    // Propositions.liste, sinon l'export figerait un état périmé.
    Propositions.synchroniser();

    const nomProjet = projetActuel ? projetActuel.nom : "";
    const nomParDefaut = `projet_${nomProjet.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "export"}`;
    const nom = prompt(I18n.t("app.nom_fichier_projet_prompt", { projet: nomProjet, n: plans.length }), nomParDefaut) || nomParDefaut;
    const paquet = { version: 1, projetNom: nomProjet, catalogue: Catalogue.liste, catalogueId: Catalogue.id, propositions: Propositions.liste, plans };
    telechargerJson(paquet, nom);
    Statut.definir(I18n.t("app.projet_exporte", { projet: nomProjet, n: plans.length, nom }));
  }

  function telechargerJson(donnees, nom) {
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${nom}.json`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  // Exporte un projet PAR SON ID depuis l'écran d'accueil (voir
  // js/selecteur-projets.js, action "Exporter"), sans l'ouvrir — tout est lu
  // directement depuis le stockage (aucun état en mémoire à reprendre,
  // contrairement à exporterProjet() pour le projet couramment ouvert). Sans
  // risque de re-scoper Plans/CatalogueStockage/PropositionsStockage : on
  // est forcément sur l'écran d'accueil, donc aucun projet n'est ouvert.
  async function exporterProjetParId(projet) {
    Plans.init(projet.id);
    CatalogueStockage.init(projet.id);
    PropositionsStockage.init(projet.id);

    const donneesCatalogue = await CatalogueStockage.charger();
    const liste = await Plans.lister();
    const plans = [];
    for (const plan of liste) {
      const donneesPlan = await Plans.charger(plan);
      if (donneesPlan) plans.push(donneesPlan);
    }
    const propositions = await PropositionsStockage.charger();

    const nomParDefaut = `projet_${projet.nom.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "export"}`;
    const nom = prompt(I18n.t("app.nom_fichier_projet_prompt", { projet: projet.nom, n: plans.length }), nomParDefaut) || nomParDefaut;
    const paquet = {
      version: 1,
      projetNom: projet.nom,
      catalogue: donneesCatalogue ? donneesCatalogue.catalogue : [],
      catalogueId: donneesCatalogue ? donneesCatalogue.id : null,
      propositions,
      plans
    };
    telechargerJson(paquet, nom);
  }

  // Persiste un plan importé (nouvelle entrée) sans l'ouvrir, pour
  // importerPaquetPlans() — même principe que la branche "nouveau plan" de
  // ouvrirPlan (fichier/id désigné côté client), mais projet déjà connu.
  async function importerPlanSansOuvrir(projet, nomParDefaut) {
    const nom = projet.nom || nomParDefaut;
    const cible = Plans.mode === Plans.MODE_LOCAL
      ? { id: Plans.creer(nom), nom }
      : { fichier: `${crypto.randomUUID()}.json`, nom };
    projet.id = cible.id || projet.id;
    projet.nom = nom;
    await Plans.sauvegarder(cible, projet);
    return cible;
  }

  // Importe le paquet produit par exporterProjet() : crée un TOUT NOUVEAU
  // projet (jamais d'écrasement d'un projet existant), y installe son
  // catalogue, persiste chaque plan comme nouvelle entrée, puis ouvre le
  // premier — symétrique de l'export, un projet importé reste indépendant
  // de tout projet déjà présent. Appelable aussi bien depuis l'écran
  // d'accueil (aucun projet ouvert, voir importerFichierProjetDepuisAccueil)
  // que depuis le menu d'un projet déjà ouvert (voir importerFichierProjet)
  // — masquer() est sans effet si l'écran de choix de projet n'est pas affiché.
  async function importerPaquetPlans(paquet) {
    SelecteurProjets.masquer();
    const nomProjet = paquet.projetNom || I18n.t("projets.nouveau_nom_defaut");
    const nouveauProjet = Projets.creer(nomProjet);

    Plans.init(nouveauProjet.id);
    await chargerCatalogueProjet(nouveauProjet.id, nouveauProjet.nom);
    if (Array.isArray(paquet.catalogue) && paquet.catalogue.length) {
      Catalogue.charger(paquet.catalogue, paquet.catalogueId || null);
      sauvegarderCatalogue();
    }
    await Propositions.chargerProjet(nouveauProjet.id);
    if (Array.isArray(paquet.propositions) && paquet.propositions.length) {
      Propositions.liste = paquet.propositions.map((p) => ({ ...p, meublesParPlan: p.meublesParPlan || {} }));
      PropositionsStockage.sauvegarder(Propositions.liste);
    }

    let premier = null;
    for (let i = 0; i < paquet.plans.length; i++) {
      const projet = paquet.plans[i];
      const cible = await importerPlanSansOuvrir(projet, I18n.t("app.plan_importe_defaut", { n: i + 1 }));
      if (i === 0) premier = { ...cible, nom: projet.nom };
    }

    projetActuel = nouveauProjet;
    labelProjetActuel.textContent = nouveauProjet.nom;
    labelVueCatalogueProjet.textContent = `— ${nouveauProjet.nom}`;
    Projets.memoriserDernier(nouveauProjet);

    Statut.definir(I18n.t("app.projet_importe", { projet: nomProjet, n: paquet.plans.length }));
    if (premier) ouvrirPlan(premier);
  }

  // Importe des plans déjà exportés ailleurs (fichier "Enregistrer sous..."
  // — paquet multi-plans OU plan isolé au format historique, voir
  // documentation/20-plans.md) DANS LE PROJET COURANT — contrairement à
  // importerFichierProjet/importerPaquetPlans, qui créent toujours un
  // nouveau projet. Appelé depuis l'écran de choix de plan (voir
  // js/selecteur-plans.js, "Importer des plans...").
  function importerPlansVersProjetCourant(fichier) {
    const lecteur = new FileReader();
    lecteur.onerror = () => alert(I18n.t("app.fichier_illisible"));
    lecteur.onload = async () => {
      try {
        const donnees = JSON.parse(lecteur.result);
        const plansAImporter = Array.isArray(donnees.plans) ? donnees.plans : [donnees];
        if (!plansAImporter.length || !plansAImporter.every((p) => p && p.plan)) {
          throw new Error("format invalide");
        }

        if (Array.isArray(donnees.catalogue) && donnees.catalogue.length) {
          const ajoutes = Catalogue.fusionner(donnees.catalogue);
          if (ajoutes) sauvegarderCatalogue();
        }

        for (let i = 0; i < plansAImporter.length; i++) {
          await importerPlanSansOuvrir(plansAImporter[i], I18n.t("app.plan_importe_defaut", { n: i + 1 }));
        }

        await SelecteurPlans.rafraichir();
        alert(I18n.t("app.plans_importes_projet", { n: plansAImporter.length }));
      } catch (erreur) {
        alert(I18n.t("app.fichier_projet_invalide"));
      }
    };
    lecteur.readAsText(fichier);
  }

  function importerFichierProjet(fichier) {
    const lecteur = new FileReader();
    lecteur.onerror = () => alert(I18n.t("app.fichier_illisible"));
    lecteur.onload = () => {
      try {
        const projet = JSON.parse(lecteur.result);
        if (Array.isArray(projet.plans)) {
          importerPaquetPlans(projet);
          return;
        }
        appliquerProjet(projet, I18n.t("app.projet_ouvert_fichier"));
      } catch (erreur) {
        alert(I18n.t("app.fichier_projet_invalide"));
      }
    };
    lecteur.readAsText(fichier);
  }

  // Importe un projet complet depuis l'écran d'accueil (voir
  // js/selecteur-projets.js, "Importer un projet...") — AUCUN projet ouvert
  // à ce stade, donc seul le format "paquet multi-plans" (produit par
  // exporterProjet()) a un sens ici ; contrairement à importerFichierProjet
  // (menu d'un projet déjà ouvert), pas de repli sur le format historique
  // "plan isolé", qui suppose justement un projet déjà ouvert pour l'accueillir.
  function importerFichierProjetDepuisAccueil(fichier) {
    const lecteur = new FileReader();
    lecteur.onerror = () => alert(I18n.t("app.fichier_illisible"));
    lecteur.onload = () => {
      try {
        const projet = JSON.parse(lecteur.result);
        if (!Array.isArray(projet.plans)) throw new Error("format invalide");
        importerPaquetPlans(projet);
      } catch (erreur) {
        alert(I18n.t("app.fichier_projet_invalide"));
      }
    };
    lecteur.readAsText(fichier);
  }

  // Export/import du catalogue seul, dans un fichier séparé du projet (CSV,
  // pour rester facilement éditable dans un tableur — le plan/le projet
  // reste en JSON, voir exporterProjet/importerFichierProjet) — pour
  // réutiliser une même liste d'objets sur plusieurs plans/projets sans
  // passer par "Ouvrir un projet...".
  //
  // La colonne "id" est l'identifiant technique du prefab (Meubles.liste[].
  // modeleId y fait référence) : à ne pas modifier à la main sur une ligne
  // existante, sous peine de délier les instances déjà posées de ce prefab.
  // La laisser vide sur une nouvelle ligne en génère un neuf à l'import.
  const CSV_ENTETES = ["id", "nom", "description", "type", "largeur_cm", "profondeur_cm", "hauteur_cm"];

  function csvEchapperChamp(valeur) {
    const texte = String(valeur ?? "");
    return /["\n,]/.test(texte) ? `"${texte.replace(/"/g, "\"\"")}"` : texte;
  }

  // Parseur CSV minimal (RFC 4180 : champs entre guillemets, virgules et
  // retours à la ligne échappés par des guillemets doublés).
  function csvParser(texte) {
    const lignes = [];
    let ligne = [];
    let champ = "";
    let dansGuillemets = false;
    for (let i = 0; i < texte.length; i++) {
      const car = texte[i];
      if (dansGuillemets) {
        if (car === "\"") {
          if (texte[i + 1] === "\"") { champ += "\""; i++; } else dansGuillemets = false;
        } else {
          champ += car;
        }
      } else if (car === "\"") {
        dansGuillemets = true;
      } else if (car === ",") {
        ligne.push(champ);
        champ = "";
      } else if (car === "\n" || car === "\r") {
        if (car === "\r" && texte[i + 1] === "\n") i++;
        ligne.push(champ);
        champ = "";
        lignes.push(ligne);
        ligne = [];
      } else {
        champ += car;
      }
    }
    if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne); }
    return lignes.filter((l) => l.length > 1 || l[0] !== "");
  }

  // Type par libellé (affiché aux utilisateurs, plus facile à retaper qu'un
  // id technique) ou par id (repli, ex. réimport d'un export déjà en id) —
  // comparaison insensible à la casse.
  function trouverTypeParTexte(texte) {
    if (!texte || !texte.trim()) return null;
    const normalise = texte.trim().toLowerCase();
    return PlannerConf.typesObjets.find((t) => t.libelle.toLowerCase() === normalise || t.id.toLowerCase() === normalise) || null;
  }

  function exporterCatalogue() {
    if (Catalogue.liste.length === 0) {
      alert(I18n.t("app.catalogue_vide_exporter"));
      return;
    }
    const nomParDefaut = `catalog_${Catalogue.id}`;
    const nom = prompt(I18n.t("app.catalogue_nom_fichier_prompt"), nomParDefaut) || nomParDefaut;
    // modele.largeur/hauteur sont déjà en cm (donnée brute, voir js/catalogue.js) :
    // aucune conversion d'échelle nécessaire à l'export.
    const lignes = [CSV_ENTETES, ...Catalogue.liste.map((modele) => [
      modele.id,
      modele.nom,
      modele.description || "",
      PlannerConf.trouverType(modele.type).libelle,
      typeof modele.largeur === "number" ? Math.round(modele.largeur) : "",
      typeof modele.hauteur === "number" ? Math.round(modele.hauteur) : "",
      modele.hauteurCm ?? ""
    ])];
    const csv = lignes.map((ligne) => ligne.map(csvEchapperChamp).join(",")).join("\r\n");
    // BOM UTF-8 : Excel n'ouvre correctement les accents en CSV qu'avec ce préfixe.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${nom}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
    Statut.definir(I18n.t("app.catalogue_exporte", { nom }));
  }

  function importerFichierCatalogue(fichier) {
    const lecteur = new FileReader();
    lecteur.onerror = () => alert(I18n.t("app.fichier_illisible"));
    lecteur.onload = () => {
      try {
        const lignes = csvParser(lecteur.result);
        if (lignes.length === 0) throw new Error("fichier vide");

        const entetes = lignes[0].map((c) => c.trim().toLowerCase());
        const colonne = (nom) => entetes.indexOf(nom);
        const iId = colonne("id");
        const iNom = colonne("nom");
        const iDescription = colonne("description");
        const iType = colonne("type");
        const iLargeur = colonne("largeur_cm");
        const iProfondeur = colonne("profondeur_cm");
        const iHauteur = colonne("hauteur_cm");
        if (iNom === -1) throw new Error("colonne nom manquante");

        let typesInconnus = 0;
        const modeles = lignes.slice(1)
          .filter((champs) => champs.some((c) => c.trim() !== ""))
          .map((champs) => {
            const typeTexte = iType > -1 ? champs[iType] : "";
            const type = trouverTypeParTexte(typeTexte);
            if (typeTexte.trim() && !type) typesInconnus++;
            const idExistant = iId > -1 ? champs[iId].trim() : "";
            return {
              id: idExistant || crypto.randomUUID(),
              nom: (champs[iNom] || "").trim() || "Sans nom",
              description: iDescription > -1 ? (champs[iDescription] || "").trim() : "",
              type: (type || PlannerConf.trouverType(null)).id,
              largeur: parseFloat(champs[iLargeur]) || 100,
              hauteur: parseFloat(champs[iProfondeur]) || 100,
              hauteurCm: iHauteur > -1 && champs[iHauteur].trim() !== "" ? parseFloat(champs[iHauteur]) : null
            };
          });

        Catalogue.charger(modeles, Catalogue.id);
        sauvegarderCatalogue();
        const avertissement = typesInconnus ? I18n.t("app.catalogue_avertissement_types", { n: typesInconnus }) : "";
        Statut.definir(I18n.t("app.catalogue_remplace", { n: modeles.length, avertissement }));
      } catch (erreur) {
        alert(I18n.t("app.catalogue_fichier_invalide", { colonnes: CSV_ENTETES.join(", ") }));
      }
    };
    lecteur.readAsText(fichier);
  }

  // Imprime le catalogue "à déménager" (nom, type, dimensions en cm) : TOUS
  // les objets de cette catégorie (voir EditionCatalogue._categorie), posés
  // ou non — accessible depuis l'écran de choix de plan (aucun plan/aucune
  // instance posée dans ce contexte), pas seulement depuis un plan ouvert.
  // Construit un tableau dans #impression-catalogue (masqué à l'écran, seul
  // visible en @media print) puis déclenche window.print().
  async function imprimerCatalogue() {
    const aDemenager = Catalogue.liste.filter((modele) => EditionCatalogue._categorie(modele) === "a_demenager");
    if (aDemenager.length === 0) {
      alert(I18n.t("app.catalogue_vide_imprimer"));
      return;
    }
    // Quantité posée TOUS PLANS du projet confondus (voir panneau rapide,
    // js/catalogue.js) — pas seulement le plan actif, souvent aucun ici.
    await EditionCatalogue.rafraichirComptesTousPlans();
    const echapper = (texte) => String(texte).replace(/[&<>"']/g, (car) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[car]));

    let volumeTotalM3 = 0;
    let nbLignes = 0;
    const lignes = EditionCatalogue._listeTrieeParType()
      .filter((modele) => EditionCatalogue._categorie(modele) === "a_demenager")
      .map((modele) => {
        const quantite = EditionCatalogue.instancesTousPlans(modele.id);
        // Toujours les dimensions du prefab (donnée canonique du catalogue,
        // voir js/catalogue.js) — pas celles d'une instance en particulier,
        // qui peut avoir été redimensionnée indépendamment sur un plan.
        const dimensionsCompletes = typeof modele.largeur === "number" && typeof modele.hauteur === "number" && typeof modele.hauteurCm === "number";
        nbLignes++;
        const descriptionHtml = modele.description
          ? `<div class="impression-catalogue-description">${echapper(modele.description)}</div>`
          : "";
        if (!dimensionsCompletes) {
          return `<tr>
            <td>${PlannerConf.iconeHtml(modele.type, "impression-catalogue-icone")} ${echapper(modele.nom)}${descriptionHtml}</td>
            <td>-</td>
            <td>${quantite}</td>
            <td>-</td>
            <td>-</td>
          </tr>`;
        }
        const largeurCm = Math.round(modele.largeur);
        const profondeurCm = Math.round(modele.hauteur);
        const volumeUnitaireM3 = (modele.largeur * modele.hauteur * modele.hauteurCm) / 1e6;
        const volumeTotalPrefabM3 = volumeUnitaireM3 * quantite;
        volumeTotalM3 += volumeTotalPrefabM3;
        return `<tr>
          <td>${PlannerConf.iconeHtml(modele.type, "impression-catalogue-icone")} ${echapper(modele.nom)}${descriptionHtml}</td>
          <td>${largeurCm} × ${profondeurCm} × ${modele.hauteurCm} cm</td>
          <td>${quantite}</td>
          <td>${volumeUnitaireM3.toFixed(2)} m³</td>
          <td>${volumeTotalPrefabM3.toFixed(2)} m³</td>
        </tr>`;
      }).join("");

    impressionCatalogue.innerHTML = `
      <h1>${I18n.t("app.impression_titre", { id: echapper(Catalogue.id || "") })}</h1>
      <p>${I18n.t("app.impression_objets", { n: nbLignes })}</p>
      <table>
        <thead><tr><th>${I18n.t("catalogue_vue.th_nom")}</th><th>${I18n.t("app.impression_th_lph")}</th><th>${I18n.t("catalogue_vue.th_qte")}</th><th>${I18n.t("app.impression_th_volume_unitaire")}</th><th>${I18n.t("app.impression_th_volume_total")}</th></tr></thead>
        <tbody>${lignes}</tbody>
        <tfoot><tr><td colspan="4"><strong>${I18n.t("commun.total")}</strong></td><td><strong>${volumeTotalM3.toFixed(2)} m³</strong></td></tr></tfoot>
      </table>
    `;
    window.print();
  }

  // Exporte en PNG le contenu du plan (blueprint + habillage + meubles de la
  // proposition active) recadré sur CadreExport.cadre : clone le SVG,
  // retire tout ce qui est pur outillage d'édition (poignées, sélection,
  // le cadre lui-même), fixe son viewBox/dimensions sur le cadre, puis le
  // fait passer par une <image> + <canvas> pour obtenir un PNG (le
  // blueprint est déjà en data URL, donc pas de souci de canvas "taintée").
  //
  // FACTEUR_RESOLUTION_PNG : le viewBox reste en unités du plan (1 unité ≈
  // 1px de l'image importée), mais width/height du SVG (donc du canvas de
  // rendu) sont multipliés par ce facteur — le texte/les formes vectorielles
  // sortent nets à cette résolution ; seul le fond (photo importée) ne gagne
  // pas de détail réel au-delà de sa résolution d'origine, mais reste net
  // (juste ré-échantillonné), pas pixelisé.
  const FACTEUR_RESOLUTION_PNG = 3;

  // Nom de fichier par défaut pour l'export PNG : "AAAA-MM-JJ_HHmmss", plus
  // lisible et trié chronologiquement qu'un uid de projet.
  function horodatageFichier() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function exporterPNG() {
    if (!blueprintActuel) {
      alert(I18n.t("app.importer_blueprint_avant_export"));
      return;
    }

    const clone = svg.cloneNode(true);
    clone.querySelectorAll(
      "#cadre-export, .poignee-rotation, .ligne-poignee-rotation, #calibration-overlay"
    ).forEach((el) => el.remove());
    clone.querySelectorAll(".selectionne").forEach((el) => el.classList.remove("selectionne"));
    // Le calque meubles peut avoir un display:none inline (mode Décor en
    // cours, voir appliquerMode) : l'export doit toujours montrer les deux
    // calques, quel que soit le mode affiché à l'écran.
    clone.querySelectorAll("#calque-meubles, #calque-habillage").forEach((el) => {
      el.style.display = "";
    });

    const c = CadreExport.cadre;
    const largeurUnites = Math.max(1, Math.round(c.largeur));
    const hauteurUnites = Math.max(1, Math.round(c.hauteur));
    const largeurPx = largeurUnites * FACTEUR_RESOLUTION_PNG;
    const hauteurPx = hauteurUnites * FACTEUR_RESOLUTION_PNG;

    clone.setAttribute("viewBox", `${c.x} ${c.y} ${largeurUnites} ${hauteurUnites}`);
    clone.setAttribute("width", largeurPx);
    clone.setAttribute("height", hauteurPx);

    const svgTexte = new XMLSerializer().serializeToString(clone);
    const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgTexte);

    const nom = horodatageFichier();

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = largeurPx;
      canvas.height = hauteurPx;
      canvas.getContext("2d").drawImage(image, 0, 0, largeurPx, hauteurPx);

      const lien = document.createElement("a");
      lien.href = canvas.toDataURL("image/png");
      lien.download = `${nom}.png`;
      lien.click();
      Statut.definir(I18n.t("app.image_exportee", { nom, larg: largeurPx, haut: hauteurPx }));
    };
    image.onerror = () => alert(I18n.t("app.export_png_echec"));
    image.src = svgDataUrl;
  }

  btnImporter.addEventListener("click", () => inputFichier.click());
  btnEchelle.addEventListener("click", () => Echelle.demarrer());
  btnOrigine.addEventListener("click", () => Origine.demarrer());
  btnExporterCatalogue.addEventListener("click", () => exporterCatalogue());
  btnImporterCatalogue.addEventListener("click", () => inputFichierCatalogue.click());
  btnImprimerCatalogue.addEventListener("click", () => imprimerCatalogue());
  btnEditerCatalogue.addEventListener("click", () => EditionCatalogue.basculer());
  // Depuis l'écran de choix de plan (voir js/selecteur-plans.js) : ouvre le
  // même overlay d'édition, en mémoire depuis l'ouverture du projet (voir
  // chargerCatalogueProjet) — pas de page séparée (catalog.html a été
  // retiré : en file://, chaque page HTML a son propre localStorage isolé,
  // une page séparée ne pouvait donc pas relire/sauvegarder le même
  // catalogue de façon fiable en mode local).
  btnEditerCatalogueDepuisPlans.addEventListener("click", () => EditionCatalogue.afficher());
  btnExporterPng.addEventListener("click", () => exporterPNG());
  btnGrille.addEventListener("click", () => {
    const { actif, subdivisions } = Grille.basculer();
    btnGrille.classList.toggle("actif", actif);
    btnGrille.title = actif
      ? I18n.t("app.grille_title_actif", { n: subdivisions })
      : I18n.t("app.grille_title_inactif");
  });

  inputFichierCatalogue.addEventListener("change", () => {
    const fichier = inputFichierCatalogue.files[0];
    if (fichier) importerFichierCatalogue(fichier);
    inputFichierCatalogue.value = "";
  });

  inputFichier.addEventListener("change", () => {
    const fichier = inputFichier.files[0];
    if (fichier) chargerFichierBlueprint(fichier);
    inputFichier.value = "";
  });

  inputFichierProjet.addEventListener("change", () => {
    const fichier = inputFichierProjet.files[0];
    if (fichier) importerFichierProjet(fichier);
    inputFichierProjet.value = "";
  });

  btnZoomMoins.addEventListener("click", () => Viewport.zoomBouton(-0.1));
  btnZoomPlus.addEventListener("click", () => Viewport.zoomBouton(0.1));
  btnZoom100.addEventListener("click", () => Viewport.zoomA100());
  btnCadrer.addEventListener("click", () => Viewport.cadrerSurRectangle(CadreExport.cadre));
  btnAjouterMeuble.addEventListener("click", () => {
    if (Mode.actuel === Mode.EDITION) Catalogue.basculer();
    else Habillage.ajouter();
  });
  // Menu "Plan et propositions" : trois groupes séparés par un trait —
  // proposition active (renommer/supprimer), liste des propositions
  // (ajouter/basculer), projet (ouvrir/enregistrer). Ouvert par
  // btn-menu-proposition, refermé au choix d'une action ou clic en dehors.
  btnMenuProposition.addEventListener("click", () => {
    menuProposition.classList.toggle("visible");
  });
  document.addEventListener("pointerdown", (evenement) => {
    if (!menuProposition.classList.contains("visible")) return;
    if (menuProposition.contains(evenement.target)) return;
    if (evenement.target.closest("#btn-menu-proposition")) return;
    menuProposition.classList.remove("visible");
  });
  btnAjouterProposition.addEventListener("click", () => {
    menuProposition.classList.remove("visible");
    if (!Viewport.largeurPlan) return;
    const nom = prompt(I18n.t("app.nom_proposition_prompt"), I18n.t("app.proposition_defaut", { n: Propositions.liste.length + 1 }));
    if (nom === null) return; // annulé
    const dupliquer = Meubles.liste.length > 0 && confirm(I18n.t("app.dupliquer_disposition_confirm"));
    Propositions.ajouter(nom.trim(), dupliquer);
  });
  btnRenommerProposition.addEventListener("click", () => {
    menuProposition.classList.remove("visible");
    if (!Propositions.courante) return;
    const nom = prompt(I18n.t("app.nom_proposition_renommer_prompt"), Propositions.courante.nom);
    if (nom === null) return; // annulé
    Propositions.renommer(nom.trim());
  });
  btnSupprimerProposition.addEventListener("click", () => {
    menuProposition.classList.remove("visible");
    if (!Propositions.courante) return;
    if (Propositions.liste.length <= 1) {
      alert(I18n.t("app.derniere_proposition_impossible"));
      return;
    }
    if (confirm(I18n.t("app.supprimer_proposition_confirm", { nom: Propositions.courante.nom }))) {
      Propositions.supprimer();
    }
  });
  btnOuvrirProjet.addEventListener("click", () => {
    menuProposition.classList.remove("visible");
    inputFichierProjet.click();
  });
  btnExporterProjet.addEventListener("click", () => {
    menuProposition.classList.remove("visible");
    exporterProjet();
  });

  SelecteurProjets.init({
    overlay: document.getElementById("vue-projets"),
    grille: document.getElementById("projets-grille"),
    boutonNouveau: document.getElementById("projet-nouveau"),
    boutonImporter: document.getElementById("projets-importer"),
    inputImporter: document.getElementById("input-fichier-projets-importer")
  });
  SelecteurProjets.alImporter((fichier) => importerFichierProjetDepuisAccueil(fichier));
  SelecteurProjets.alExporter((projet) => exporterProjetParId(projet));

  SelecteurPlans.init({
    overlay: document.getElementById("vue-plans"),
    grille: document.getElementById("plans-grille"),
    boutonNouveau: document.getElementById("plan-nouveau"),
    boutonImporter: document.getElementById("plans-importer"),
    inputImporter: document.getElementById("input-fichier-plans-importer")
  });
  SelecteurPlans.alImporter((fichier) => importerPlansVersProjetCourant(fichier));

  // Sidebar (ancrée à gauche) : changer de plan sans revenir à l'écran
  // d'accueil ni recharger la page (voir js/sidebar-plans.js). Le plan en
  // cours est déjà sauvegardé en continu, donc aucune perte au passage à un
  // autre plan.
  function idPlanActuel() {
    return planActuel ? (planActuel.id || planActuel.fichier) : null;
  }

  function ouvrirSidebarPlans() {
    document.body.classList.add("sidebar-plans-ouverte");
    // Synchronise le plan actif dans Propositions AVANT de rafraîchir la
    // sidebar (voir js/sidebar-plans.js), sinon son compte d'éléments
    // placés resterait celui de la dernière bascule, pas l'état courant.
    Propositions.synchroniser();
    SidebarPlans.rafraichir(idPlanActuel());
  }

  function fermerSidebarPlans() {
    document.body.classList.remove("sidebar-plans-ouverte");
  }

  SidebarPlans.init({
    liste: sidebarPlansListe,
    boutonNouveau: sidebarPlansNouveau
  });
  SidebarPlans.alChoix((plan) => {
    fermerSidebarPlans();
    ouvrirPlan(plan);
  });
  SidebarPlans.alNouveau((nom) => {
    fermerSidebarPlans();
    ouvrirPlan({ nouveau: true, nom });
  });
  SidebarPlans.alRenommer((plan, nouveauNom) => {
    if (plan.id === idPlanActuel()) {
      planActuel.nom = nouveauNom;
      labelPlanActuel.textContent = nouveauNom;
    }
  });

  // Retour à l'écran de choix de projet, depuis le bas de la sidebar : pas
  // de mécanisme équivalent à la sidebar pour les projets — on recharge
  // simplement la page (le plan/projet en cours est déjà sauvegardé en
  // continu, donc aucune perte).
  btnChangerProjet.addEventListener("click", () => {
    Projets.oublierDernier();
    location.reload();
  });

  sidebarPlansFermer.addEventListener("click", fermerSidebarPlans);
  sidebarPlansFond.addEventListener("click", fermerSidebarPlans);
  btnChangerPlan.addEventListener("click", () => {
    if (document.body.classList.contains("sidebar-plans-ouverte")) {
      fermerSidebarPlans();
    } else {
      ouvrirSidebarPlans();
    }
  });

  demarrerSelectionProjet();
})();
