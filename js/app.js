// Point d'entrée : orchestration entre Plan, Viewport et l'UI.
(function () {
  const zoneTravail = document.getElementById("zone-travail");
  const svg = document.getElementById("viewport");
  const inputFichier = document.getElementById("input-fichier-plan");
  const btnImporter = document.getElementById("btn-importer-plan");
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
  const labelUtilisateurActif = document.getElementById("label-utilisateur-actif");
  const btnMenuUtilisateur = document.getElementById("btn-menu-utilisateur");
  const menuUtilisateur = document.getElementById("menu-utilisateur");
  const menuUtilisateurListe = document.getElementById("menu-utilisateur-liste");
  const btnAjouterUtilisateur = document.getElementById("btn-ajouter-utilisateur");
  const btnRenommerUtilisateur = document.getElementById("btn-renommer-utilisateur");
  const btnSupprimerUtilisateur = document.getElementById("btn-supprimer-utilisateur");
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
  const btnSessions = document.getElementById("btn-sessions");
  const labelSessionActuelle = document.getElementById("label-session-actuelle");
  const sidebarSessionsFond = document.getElementById("sidebar-sessions-fond");
  const sidebarSessionsFermer = document.getElementById("sidebar-sessions-fermer");
  const sidebarSessionsListe = document.getElementById("sidebar-sessions-liste");
  const sidebarSessionsNouvelle = document.getElementById("sidebar-sessions-nouvelle");

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
  Catalogue.alChangement(() => sauvegarderProjet());
  EditionCatalogue.init({
    overlay: document.getElementById("vue-catalogue"),
    tbody: document.getElementById("vue-catalogue-tbody"),
    fermer: document.getElementById("vue-catalogue-fermer"),
    nouveau: document.getElementById("vue-catalogue-nouveau")
  });
  Utilisateurs.init({
    label: labelUtilisateurActif,
    listeConteneur: menuUtilisateurListe,
    fermerMenu: () => menuUtilisateur.classList.remove("visible")
  });
  Utilisateurs.alChangement(() => sauvegarderProjet());
  Utilisateurs.alChangement(() => Catalogue.masquer());
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
    btnAjouterMeuble.title = enEdition ? "Choisir/ajouter un meuble" : "Ajouter un masque";
  }

  Mode.init(btnMode);
  Mode.alChangement(appliquerMode);
  appliquerMode(Mode.actuel); // synchronise l'état initial (pas d'événement au chargement)

  let planCourant = null; // { dataUrl, largeurPx, hauteurPx }
  let projetId = null; // identifiant unique du projet courant, nom de fichier par défaut à l'export
  let sessionActuelle = null; // session en cours (voir js/sessions.js) : { id, nom } en mode local, { fichier, nom } en mode fichiers, null avant tout choix

  function mettreAJourBoutonEchelle() {
    labelEchelle.textContent = Echelle.pxParCm ? `${Math.round(Echelle.pxParCm * 100)}px/m` : "";
  }

  Echelle.alDefinie(mettreAJourBoutonEchelle);

  // Coordonnées affichées en cm depuis le coin du fond (mêmes unités que les
  // règles/la grille) — dépend donc aussi de l'échelle, pas seulement de l'origine.
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

  // Construit l'état complet du projet (plan + habillage + utilisateurs, chacun
  // avec ses propres meubles) pour sauvegarde/export.
  function construireProjet() {
    Utilisateurs.synchroniser(); // recopie Meubles.liste dans l'utilisateur actif
    return {
      version: 1,
      id: projetId,
      nom: sessionActuelle ? sessionActuelle.nom : null,
      plan: {
        image: planCourant.dataUrl,
        largeurPx: planCourant.largeurPx,
        hauteurPx: planCourant.hauteurPx,
        echellePxParCm: Echelle.pxParCm,
        origineX: Origine.definie ? Origine.decalageX : null,
        origineY: Origine.definie ? Origine.decalageY : null
      },
      habillage: Habillage.liste,
      catalogue: Catalogue.liste,
      catalogueId: Catalogue.id,
      cadreExport: CadreExport.cadre,
      utilisateurs: Utilisateurs.liste
    };
  }

  // Sauvegarde toujours dans le filet de sécurité localStorage (marche
  // partout, y compris file://) et, si une session est active (voir
  // js/sessions.js), dans la session elle-même — localStorage en mode
  // local, sessions/*.json (via PHP) en mode fichiers.
  function sauvegarderProjet() {
    if (!planCourant) return;
    const projet = construireProjet();
    Stockage.sauvegarder(projet);
    if (sessionActuelle) {
      Sessions.sauvegarder(sessionActuelle, projet);
      Sessions.memoriserDerniere(sessionActuelle);
    }
  }

  Echelle.alDefinie(sauvegarderProjet);
  Origine.alDefinie(sauvegarderProjet);

  // Capture le cadrage actuel (position de l'origine à l'écran + niveau de
  // zoom en cm réels affichés) avant de quitter une session, pour le
  // reproduire sur la session suivante (voir appliquerCadrage) — utile
  // quand les sessions sont les étages d'un même lieu : on ne se retrouve
  // pas perdu à chaque changement de vue. `null` si aucun plan encore
  // affiché (premier chargement).
  function capturerCadrage() {
    if (!planCourant) return null;
    const vb = Viewport.viewBox;
    const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
    const origineX = Origine.definie ? Origine.decalageX : 0;
    const origineY = Origine.definie ? Origine.decalageY : 0;
    return {
      largeurCm: vb.largeur / pxParCm,
      hauteurCm: vb.hauteur / pxParCm,
      // Position de l'origine dans le viewBox, en fraction (0-1) de sa
      // largeur/hauteur — indépendante de la résolution du plan, donc
      // reproductible même si le nouveau plan a une échelle différente.
      ratioX: (origineX - vb.x) / vb.largeur,
      ratioY: (origineY - vb.y) / vb.hauteur
    };
  }

  // Reproduit un cadrage capturé par capturerCadrage() sur le plan qui vient
  // d'être chargé (Echelle/Origine déjà à jour à ce stade) : mêmes cm réels
  // affichés, origine au même endroit de l'écran.
  function appliquerCadrage(cadrage) {
    if (!cadrage) return;
    const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
    const largeur = cadrage.largeurCm * pxParCm;
    const hauteur = cadrage.hauteurCm * pxParCm;
    const origineX = Origine.definie ? Origine.decalageX : 0;
    const origineY = Origine.definie ? Origine.decalageY : 0;
    Viewport.definirViewBox({
      x: origineX - cadrage.ratioX * largeur,
      y: origineY - cadrage.ratioY * hauteur,
      largeur,
      hauteur
    });
  }

  // Applique un projet complet (restauration locale, import de fichier) : plan,
  // échelle et meubles. Remplace tout ce qui était affiché. `cadragePrecedent`
  // (voir capturerCadrage) reproduit le cadrage de la session qu'on quitte ;
  // à défaut (premier chargement), vue d'ensemble sur le cadre d'export via
  // le même algo que le bouton "Cadrer" (Viewport.cadrerSurRectangle),
  // plutôt que le recentrage 100% posé par Viewport.definirPlan.
  function appliquerProjet(projet, messageStatut, cadragePrecedent) {
    if (!projet || !projet.plan) return;

    const { image, largeurPx, hauteurPx, echellePxParCm, origineX, origineY } = projet.plan;
    planCourant = { dataUrl: image, largeurPx, hauteurPx };
    projetId = projet.id || crypto.randomUUID(); // reprend l'id existant, ou en génère un (anciens fichiers)
    Echelle.pxParCm = echellePxParCm || Echelle.PX_PAR_CM_DEFAUT;
    Origine.charger(origineX, origineY);
    Viewport.definirPlan(image, largeurPx, hauteurPx);
    zoneTravail.classList.add("plan-charge");
    Habillage.charger(projet.habillage || []);
    Catalogue.charger(projet.catalogue || [], projet.catalogueId);
    Utilisateurs.charger(projet.utilisateurs || []); // recharge aussi Meubles (utilisateur actif)
    CadreExport.definir(projet.cadreExport);
    if (cadragePrecedent) appliquerCadrage(cadragePrecedent);
    else Viewport.cadrerSurRectangle(CadreExport.cadre);
    Regles.redessiner();
    Grille.redessiner();
    mettreAJourBoutonEchelle();
    mettreAJourBoutonOrigine();
    Statut.definir(messageStatut);
    sauvegarderProjet();
  }

  async function chargerFichierPlan(fichier) {
    try {
      const { dataUrl, largeurPx, hauteurPx } = await Plan.charger(fichier);

      // Un plan était déjà chargé : on ne fait que remplacer l'image de fond,
      // sans toucher à l'échelle, aux meubles/habillage, au catalogue, aux
      // utilisateurs ni au cadre d'export — l'utilisateur n'a pas à tout
      // recaler après un simple changement d'image de fond.
      if (planCourant) {
        planCourant = { dataUrl, largeurPx, hauteurPx };
        Viewport.definirPlan(dataUrl, largeurPx, hauteurPx);
        Regles.redessiner();
        Grille.redessiner();
        sauvegarderProjet();
        Statut.definir("Plan remplacé (échelle, origine, meubles et habillage conservés).");
        return;
      }

      planCourant = { dataUrl, largeurPx, hauteurPx };
      // Nouveau projet = nouvel identifiant, sauf s'il s'agit du premier plan
      // importé dans une session locale déjà créée (reprend son id).
      projetId = (sessionActuelle && Sessions.mode === Sessions.MODE_LOCAL) ? sessionActuelle.id : crypto.randomUUID();
      Echelle.pxParCm = Echelle.PX_PAR_CM_DEFAUT;
      Origine.reinitialiser();
      Habillage.charger([]);
      Catalogue.charger([]);
      Utilisateurs.charger([]); // recrée un utilisateur unique par défaut (et vide Meubles)
      Viewport.definirPlan(dataUrl, largeurPx, hauteurPx);
      zoneTravail.classList.add("plan-charge");
      CadreExport.reinitialiser(); // cadre = tout le nouveau plan
      Regles.redessiner();
      Grille.redessiner();
      mettreAJourBoutonEchelle();
      mettreAJourBoutonOrigine();
      sauvegarderProjet();
      Statut.definir("Plan importé avec une échelle par défaut (100px = 1m). Utilisez le bouton \"Échelle\" pour l'ajuster.");
    } catch (erreur) {
      alert(erreur.message);
    }
  }

  // Au démarrage : rouvre directement la dernière session utilisée si elle
  // existe encore (voir Sessions.memoriserDerniere/derniereSessionId), sinon
  // affiche l'écran de choix (voir js/sessions.js, js/selecteur-sessions.js
  // et documentation/20-sessions.md).
  async function demarrerSelectionSession() {
    Sessions.init();
    const liste = await Sessions.lister();
    const derniereId = Sessions.derniereSessionId();
    const derniere = derniereId ? liste.find((s) => s.id === derniereId) : null;
    if (derniere) {
      ouvrirSession(derniere);
      return;
    }
    SelecteurSessions.afficher(liste, (session) => ouvrirSession(session));
  }

  async function ouvrirSession(session) {
    SelecteurSessions.masquer();

    if (session.nouvelle) {
      // Le fichier/id cible est désigné dès maintenant côté client (voir
      // js/sessions.js) : la session n'existe vraiment côté stockage qu'à
      // la première sauvegarde (après import d'un plan).
      sessionActuelle = Sessions.mode === Sessions.MODE_LOCAL
        ? { id: Sessions.creer(session.nom), nom: session.nom }
        : { fichier: `${crypto.randomUUID()}.json`, nom: session.nom };
      labelSessionActuelle.textContent = sessionActuelle.nom;
      Statut.definir("Nouvelle session : importez un plan pour commencer.");
      return;
    }

    const cadragePrecedent = capturerCadrage();
    const projet = await Sessions.charger(session);
    if (!projet) {
      alert("Impossible de charger cette session.");
      Sessions.oublierDerniere();
      location.reload();
      return;
    }
    sessionActuelle = session;
    labelSessionActuelle.textContent = sessionActuelle.nom;
    appliquerProjet(projet, `Session ouverte : ${session.nom}.`, cadragePrecedent);
  }

  function exporterProjet() {
    if (!planCourant) {
      alert("Importez d'abord un plan avant d'enregistrer un projet.");
      return;
    }
    const nomParDefaut = `session_${projetId}`;
    const nom = prompt("Nom du projet (pour le fichier) :", nomParDefaut) || nomParDefaut;
    const blob = new Blob([JSON.stringify(construireProjet(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${nom}.json`;
    lien.click();
    URL.revokeObjectURL(url);
    Statut.definir(`Projet exporté : ${nom}.json.`);
  }

  function importerFichierProjet(fichier) {
    const lecteur = new FileReader();
    lecteur.onerror = () => alert("Impossible de lire le fichier.");
    lecteur.onload = () => {
      try {
        const projet = JSON.parse(lecteur.result);
        appliquerProjet(projet, "Projet ouvert depuis un fichier.");
      } catch (erreur) {
        alert("Fichier de projet invalide.");
      }
    };
    lecteur.readAsText(fichier);
  }

  // Export/import du catalogue seul, dans un fichier séparé du projet (CSV,
  // pour rester facilement éditable dans un tableur — la session/le projet
  // reste en JSON, voir exporterProjet/importerFichierProjet) — pour
  // réutiliser une même liste d'objets sur plusieurs plans/projets sans
  // passer par "Ouvrir un projet...".
  //
  // La colonne "id" est l'identifiant technique du prefab (Meubles.liste[].
  // modeleId y fait référence) : à ne pas modifier à la main sur une ligne
  // existante, sous peine de délier les instances déjà posées de ce prefab.
  // La laisser vide sur une nouvelle ligne en génère un neuf à l'import.
  const CSV_ENTETES = ["id", "nom", "type", "largeur_cm", "profondeur_cm", "hauteur_cm", "a_demenager"];

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
      alert("Le catalogue est vide, rien à exporter.");
      return;
    }
    const nomParDefaut = `catalog_${Catalogue.id}`;
    const nom = prompt("Nom du fichier catalogue :", nomParDefaut) || nomParDefaut;
    const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
    const lignes = [CSV_ENTETES, ...Catalogue.liste.map((modele) => [
      modele.id,
      modele.nom,
      PlannerConf.trouverType(modele.type).libelle,
      Math.round(modele.largeur / pxParCm),
      Math.round(modele.hauteur / pxParCm),
      modele.hauteurCm ?? "",
      modele.aDemenager !== false ? "oui" : "non"
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
    Statut.definir(`Catalogue exporté : ${nom}.csv.`);
  }

  function importerFichierCatalogue(fichier) {
    if (!planCourant) {
      alert("Importez d'abord un plan avant d'importer un catalogue.");
      return;
    }
    const lecteur = new FileReader();
    lecteur.onerror = () => alert("Impossible de lire le fichier.");
    lecteur.onload = () => {
      try {
        const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
        const lignes = csvParser(lecteur.result);
        if (lignes.length === 0) throw new Error("fichier vide");

        const entetes = lignes[0].map((c) => c.trim().toLowerCase());
        const colonne = (nom) => entetes.indexOf(nom);
        const iId = colonne("id");
        const iNom = colonne("nom");
        const iType = colonne("type");
        const iLargeur = colonne("largeur_cm");
        const iProfondeur = colonne("profondeur_cm");
        const iHauteur = colonne("hauteur_cm");
        const iADemenager = colonne("a_demenager");
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
              type: (type || PlannerConf.trouverType(null)).id,
              largeur: (parseFloat(champs[iLargeur]) || 100) * pxParCm,
              hauteur: (parseFloat(champs[iProfondeur]) || 100) * pxParCm,
              hauteurCm: iHauteur > -1 && champs[iHauteur].trim() !== "" ? parseFloat(champs[iHauteur]) : null,
              aDemenager: iADemenager > -1 ? !/^(non|false|0)$/i.test(champs[iADemenager].trim()) : true
            };
          });

        Catalogue.charger(modeles, Catalogue.id);
        sauvegarderProjet();
        const avertissement = typesInconnus ? ` (${typesInconnus} type(s) non reconnu(s), repli sur générique)` : "";
        Statut.definir(`Catalogue remplacé : ${modeles.length} objet(s)${avertissement}.`);
      } catch (erreur) {
        alert("Fichier catalogue invalide (CSV attendu, colonnes : " + CSV_ENTETES.join(", ") + ").");
      }
    };
    lecteur.readAsText(fichier);
  }

  // Imprime le détail du catalogue en cours (nom, type, dimensions en cm) :
  // construit un tableau dans #impression-catalogue (masqué à l'écran,
  // seul visible en @media print) puis déclenche window.print().
  function imprimerCatalogue() {
    if (Catalogue.liste.length === 0) {
      alert("Le catalogue est vide, rien à imprimer.");
      return;
    }
    const pxParCm = Echelle.pxParCm || Echelle.PX_PAR_CM_DEFAUT;
    const echapper = (texte) => String(texte).replace(/[&<>"']/g, (car) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[car]));

    let volumeTotalM3 = 0;
    const lignes = EditionCatalogue._listeTrieeParType().map((modele) => {
      // Comme la vue d'édition du catalogue : si une instance est posée sur
      // le plan de l'utilisateur actif, on imprime ses valeurs actuelles
      // plutôt que la copie (potentiellement figée) du modèle.
      // Dupliquer un meuble garde le même modeleId (voir objets.js,
      // dupliquer()) : plusieurs instances peuvent partager un modèle,
      // d'où la quantité et le volume total = volume unitaire × quantité.
      const instances = EditionCatalogue._instancesPosees(modele.id);
      const instance = instances[0] || null;
      const quantite = instances.length;
      const nom = modele.nom; // nom du prefab — distinct du nom (auto-incrémenté) de chaque instance
      const typeId = instance ? instance.type : modele.type;
      const largeurPx = instance ? instance.largeur : modele.largeur;
      const profondeurPx = instance ? instance.hauteur : modele.hauteur;
      const hauteurCm = instance ? instance.hauteurCm : modele.hauteurCm;
      const aDemenager = instance ? instance.aDemenager !== false : modele.aDemenager !== false;
      const largeurCm = Math.round(largeurPx / pxParCm);
      const profondeurCm = Math.round(profondeurPx / pxParCm);
      const hauteurReelleCm = hauteurCm ?? "-";
      let volumeTexte = "-";
      if (typeof hauteurCm === "number" && aDemenager) {
        const volumeM3 = (largeurCm * profondeurCm * hauteurCm * quantite) / 1e6;
        volumeTotalM3 += volumeM3;
        volumeTexte = `${volumeM3.toFixed(2)} m³`;
      }
      return `<tr>
        <td>${PlannerConf.iconeHtml(typeId, "impression-catalogue-icone")} ${echapper(nom)}</td>
        <td>${largeurCm} × ${profondeurCm} × ${hauteurReelleCm} cm</td>
        <td>${quantite}</td>
        <td>${aDemenager ? "Oui" : "Non"}</td>
        <td>${volumeTexte}</td>
      </tr>`;
    }).join("");

    impressionCatalogue.innerHTML = `
      <h1>Catalogue — ${echapper(Catalogue.id || "")}</h1>
      <p>${Catalogue.liste.length} objet(s)</p>
      <table>
        <thead><tr><th>Nom</th><th>L × P × H</th><th>Qté</th><th>À déménager</th><th>Volume</th></tr></thead>
        <tbody>${lignes}</tbody>
        <tfoot><tr><td colspan="4"><strong>Total</strong></td><td><strong>${volumeTotalM3.toFixed(2)} m³</strong></td></tr></tfoot>
      </table>
    `;
    window.print();
  }

  // Exporte en PNG le contenu du plan (fond + habillage + meubles de
  // l'utilisateur actif) recadré sur CadreExport.cadre : clone le SVG,
  // retire tout ce qui est pur outillage d'édition (poignées, sélection,
  // le cadre lui-même), fixe son viewBox/dimensions sur le cadre, puis le
  // fait passer par une <image> + <canvas> pour obtenir un PNG (le fond du
  // plan est déjà en data URL, donc pas de souci de canvas "taintée").
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
    if (!planCourant) {
      alert("Importez d'abord un plan avant d'exporter une image.");
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
      Statut.definir(`Image exportée : ${nom}.png (${largeurPx}×${hauteurPx}px).`);
    };
    image.onerror = () => alert("Échec de l'export PNG.");
    image.src = svgDataUrl;
  }

  btnImporter.addEventListener("click", () => inputFichier.click());
  btnEchelle.addEventListener("click", () => Echelle.demarrer());
  btnOrigine.addEventListener("click", () => Origine.demarrer());
  btnExporterCatalogue.addEventListener("click", () => exporterCatalogue());
  btnImporterCatalogue.addEventListener("click", () => inputFichierCatalogue.click());
  btnImprimerCatalogue.addEventListener("click", () => imprimerCatalogue());
  btnEditerCatalogue.addEventListener("click", () => EditionCatalogue.basculer());
  btnExporterPng.addEventListener("click", () => exporterPNG());
  btnGrille.addEventListener("click", () => {
    const { actif, subdivisions } = Grille.basculer();
    btnGrille.classList.toggle("actif", actif);
    btnGrille.title = actif
      ? `Grille : ${subdivisions} cellules par unité de mesure (cliquer pour changer)`
      : "Afficher la grille";
  });

  inputFichierCatalogue.addEventListener("change", () => {
    const fichier = inputFichierCatalogue.files[0];
    if (fichier) importerFichierCatalogue(fichier);
    inputFichierCatalogue.value = "";
  });

  inputFichier.addEventListener("change", () => {
    const fichier = inputFichier.files[0];
    if (fichier) chargerFichierPlan(fichier);
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
  // Menu "Session et utilisateurs" : trois groupes séparés par un trait —
  // utilisateur actif (renommer/supprimer), liste des utilisateurs
  // (ajouter/basculer), session (ouvrir/enregistrer un projet). Ouvert par
  // btn-menu-utilisateur, refermé au choix d'une action ou clic en dehors.
  btnMenuUtilisateur.addEventListener("click", () => {
    menuUtilisateur.classList.toggle("visible");
  });
  document.addEventListener("pointerdown", (evenement) => {
    if (!menuUtilisateur.classList.contains("visible")) return;
    if (menuUtilisateur.contains(evenement.target)) return;
    if (evenement.target.closest("#btn-menu-utilisateur")) return;
    menuUtilisateur.classList.remove("visible");
  });
  btnAjouterUtilisateur.addEventListener("click", () => {
    menuUtilisateur.classList.remove("visible");
    if (!Viewport.largeurPlan) return;
    const nom = prompt("Nom du nouvel utilisateur :", `Utilisateur ${Utilisateurs.liste.length + 1}`);
    if (nom === null) return; // annulé
    const dupliquer = Meubles.liste.length > 0 && confirm(
      "Partir de la disposition actuelle de l'utilisateur actif ?\n\n" +
      "OK = dupliquer ses meubles déjà posés (positions incluses)\n" +
      "Annuler = partir d'un plan vide"
    );
    Utilisateurs.ajouter(nom.trim(), dupliquer);
  });
  btnRenommerUtilisateur.addEventListener("click", () => {
    menuUtilisateur.classList.remove("visible");
    if (!Utilisateurs.courant) return;
    const nom = prompt("Nouveau nom de l'utilisateur :", Utilisateurs.courant.nom);
    if (nom === null) return; // annulé
    Utilisateurs.renommer(nom.trim());
  });
  btnSupprimerUtilisateur.addEventListener("click", () => {
    menuUtilisateur.classList.remove("visible");
    if (!Utilisateurs.courant) return;
    if (Utilisateurs.liste.length <= 1) {
      alert("Impossible de supprimer le dernier utilisateur restant.");
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${Utilisateurs.courant.nom}" ? Sa disposition (meubles posés) sera perdue.`)) {
      Utilisateurs.supprimer();
    }
  });
  btnOuvrirProjet.addEventListener("click", () => {
    menuUtilisateur.classList.remove("visible");
    inputFichierProjet.click();
  });
  btnExporterProjet.addEventListener("click", () => {
    menuUtilisateur.classList.remove("visible");
    exporterProjet();
  });

  SelecteurSessions.init({
    overlay: document.getElementById("vue-sessions"),
    grille: document.getElementById("sessions-grille"),
    boutonNouvelle: document.getElementById("session-nouvelle")
  });

  // Sidebar (ancrée à gauche) : changer de session sans revenir à l'écran
  // d'accueil ni recharger la page (voir js/sidebar-sessions.js). La session
  // en cours est déjà sauvegardée en continu, donc aucune perte au passage
  // à une autre session.
  function idSessionActuelle() {
    return sessionActuelle ? (sessionActuelle.id || sessionActuelle.fichier) : null;
  }

  function ouvrirSidebarSessions() {
    document.body.classList.add("sidebar-sessions-ouverte");
    SidebarSessions.rafraichir(idSessionActuelle());
  }

  function fermerSidebarSessions() {
    document.body.classList.remove("sidebar-sessions-ouverte");
  }

  SidebarSessions.init({
    liste: sidebarSessionsListe,
    boutonNouvelle: sidebarSessionsNouvelle
  });
  SidebarSessions.alChoix((session) => {
    fermerSidebarSessions();
    ouvrirSession(session);
  });
  SidebarSessions.alNouvelle((nom) => {
    fermerSidebarSessions();
    ouvrirSession({ nouvelle: true, nom });
  });
  SidebarSessions.alRenommer((session, nouveauNom) => {
    if (session.id === idSessionActuelle()) {
      sessionActuelle.nom = nouveauNom;
      labelSessionActuelle.textContent = nouveauNom;
    }
  });

  sidebarSessionsFermer.addEventListener("click", fermerSidebarSessions);
  sidebarSessionsFond.addEventListener("click", fermerSidebarSessions);
  btnSessions.addEventListener("click", () => {
    if (document.body.classList.contains("sidebar-sessions-ouverte")) {
      fermerSidebarSessions();
    } else {
      ouvrirSidebarSessions();
    }
  });

  demarrerSelectionSession();
})();
