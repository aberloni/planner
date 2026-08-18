// Table de traduction FR/EN, maintenue à la main (pas de fetch de fichier de
// données : ça ne marche pas en ouverture directe file://, voir
// documentation/08-lancement-local.md). Chaque clé (flag) = { fr, en } ;
// utilisée via I18n.t("flag", { variable: valeur }) (js/i18n.js) pour les
// {variable} dans le texte, ou via data-i18n="flag" dans index.html.
const TRADUCTIONS = {

  // Commun (réutilisé à plusieurs endroits)
  "commun.fermer": { fr: `Fermer`, en: `Close` },
  "commun.renommer": { fr: `Renommer`, en: `Rename` },
  "commun.supprimer": { fr: `Supprimer`, en: `Delete` },
  "commun.oui": { fr: `Oui`, en: `Yes` },
  "commun.non": { fr: `Non`, en: `No` },
  "commun.total": { fr: `Total`, en: `Total` },

  // Écran de choix des projets
  "projets.titre": { fr: `Projets`, en: `Projects` },
  "projets.nouveau_bouton": { fr: `+ Nouveau projet`, en: `+ New project` },
  "projets.n_plans": { fr: `{n} plan(s)`, en: `{n} plan(s)` },
  "projets.aucun_plan": { fr: `Aucun plan pour l'instant`, en: `No plan yet` },
  "projets.modifie_le": { fr: `Modifié le {date}`, en: `Modified on {date}` },
  "projets.renommer_prompt": { fr: `Nouveau nom du projet :`, en: `New project name:` },
  "projets.supprimer_confirm": { fr: `Supprimer définitivement le projet "{nom}" et tous ses plans ?`, en: `Permanently delete the project "{nom}" and all its plans?` },
  "projets.nouveau_nom_prompt": { fr: `Nom du nouveau projet :`, en: `New project name:` },
  "projets.nouveau_nom_defaut": { fr: `Nouveau projet`, en: `New project` },
  "projets.exporter_title": { fr: `Exporter ce projet...`, en: `Export this project...` },
  "barre.changer_projet_title": { fr: `Changer de projet`, en: `Switch project` },
  "barre.projet_actuel_title": { fr: `Projet en cours`, en: `Current project` },

  // Écran de choix des plans / sidebar
  "plans.titre": { fr: `Plans`, en: `Plans` },
  "plans.retour_projets_title": { fr: `Retour aux projets`, en: `Back to projects` },
  "plans.nouveau_bouton": { fr: `+ Nouveau plan`, en: `+ New plan` },
  "plans.importer_bouton": { fr: `Importer un projet`, en: `Import a project` },
  "projets.importer_bouton": { fr: `Importer un projet...`, en: `Import a project...` },
  "app.plans_importes_projet": { fr: `{n} plan(s) importé(s) dans ce projet.`, en: `{n} plan(s) imported into this project.` },
  "plans.modifie_le": { fr: `Modifié le {date}`, en: `Modified on {date}` },
  "plans.renommer_prompt": { fr: `Nouveau nom du plan :`, en: `New plan name:` },
  "plans.supprimer_confirm": { fr: `Supprimer définitivement le plan "{nom}" ?`, en: `Permanently delete the plan "{nom}"?` },
  "plans.nouveau_nom_prompt": { fr: `Nom du nouveau plan :`, en: `New plan name:` },
  "plans.nouveau_nom_defaut": { fr: `Nouveau plan`, en: `New plan` },
  "sidebar_plans.aucun_plan": { fr: `Aucun plan pour l'instant.`, en: `No plan yet.` },

  // Barre d'outils
  "barre.changer_plan_title": { fr: `Changer de plan`, en: `Switch plan` },
  "barre.plan_actuel_title": { fr: `Plan en cours`, en: `Current plan` },
  "barre.importer_blueprint_title": { fr: `Importer un blueprint`, en: `Import a blueprint` },
  "barre.echelle_title": { fr: `Définir l'échelle du blueprint`, en: `Set the blueprint scale` },
  "barre.echelle_actuelle_title": { fr: `Échelle actuelle`, en: `Current scale` },
  "barre.origine_title": { fr: `Définir l'origine du blueprint (0,0 des règles/grille)`, en: `Set the blueprint origin (0,0 for rulers/grid)` },
  "barre.origine_actuelle_title": { fr: `Origine actuelle`, en: `Current origin` },
  "barre.proposition_active_title": { fr: `Proposition active`, en: `Active proposal` },
  "barre.menu_proposition_title": { fr: `Plan et propositions`, en: `Plan and proposals` },
  "langue.bouton_title": { fr: `Changer de langue / Switch language`, en: `Changer de langue / Switch language` },

  // Menu "Plan et propositions"
  "menu.renommer_proposition": { fr: `Renommer la proposition`, en: `Rename the proposal` },
  "menu.supprimer_proposition": { fr: `Supprimer la proposition`, en: `Delete the proposal` },
  "menu.ajouter_proposition": { fr: `Ajouter une proposition`, en: `Add a proposal` },
  "menu.ouvrir_projet": { fr: `Ouvrir un projet...`, en: `Open a project...` },
  "menu.exporter_projet": { fr: `Enregistrer sous...`, en: `Save as...` },
  "menu.changer_projet": { fr: `Changer de projet`, en: `Switch project` },

  // Écran d'accueil (aucun blueprint)
  "accueil.aucun_blueprint": { fr: `Aucun blueprint importé.`, en: `No blueprint imported.` },
  "accueil.instruction": { fr: `Cliquez sur "Importer un blueprint" (JPG/PNG) dans la barre d'outils.`, en: `Click "Import a blueprint" (JPG/PNG) in the toolbar.` },

  // Zoom / boutons ronds flottants
  "zoom.arriere_title": { fr: `Zoom arrière`, en: `Zoom out` },
  "zoom.reinitialiser_title": { fr: `Réinitialiser le zoom à 100%`, en: `Reset zoom to 100%` },
  "zoom.avant_title": { fr: `Zoom avant`, en: `Zoom in` },
  "zoom.cadrer_title": { fr: `Cadrer le plan dans la fenêtre`, en: `Fit plan to window` },
  "objets.dupliquer_title": { fr: `Dupliquer l'objet sélectionné`, en: `Duplicate the selected object` },
  "objets.mesurer_title": { fr: `Mesurer une distance sur le plan`, en: `Measure a distance on the plan` },
  "catalogue.nouveau_objet": { fr: `+ Nouvel objet...`, en: `+ New object...` },
  "catalogue.editer_catalogue_title": { fr: `Éditer le catalogue`, en: `Edit the catalog` },
  "app.exporter_png_title": { fr: `Exporter le plan en PNG (cadre en pointillé)`, en: `Export the plan as PNG (dashed frame)` },
  "app.grille_title_actif": { fr: `Grille : {n} cellules par unité de mesure (cliquer pour changer)`, en: `Grid: {n} cells per measurement unit (click to change)` },
  "app.grille_title_inactif": { fr: `Afficher la grille`, en: `Show the grid` },

  // Inspecteur
  "inspecteur.prefab_titre": { fr: `Prefab (catalogue)`, en: `Prefab (catalog)` },
  "inspecteur.prefab_partage_title": { fr: `Partagé par toutes les propositions, modifiable depuis la vue d'édition du catalogue`, en: `Shared by all proposals, editable from the catalog editing view` },
  "inspecteur.type_label": { fr: `Type :`, en: `Type:` },
  "inspecteur.modele_label": { fr: `Modèle :`, en: `Model:` },
  "inspecteur.largeur_label": { fr: `Largeur :`, en: `Width:` },
  "inspecteur.profondeur_label": { fr: `Profondeur :`, en: `Depth:` },
  "inspecteur.hauteur_reelle_label": { fr: `Hauteur réelle :`, en: `Actual height:` },
  "inspecteur.editer_dans_catalogue": { fr: `Éditer dans le catalogue`, en: `Edit in the catalog` },
  "inspecteur.cette_instance_titre": { fr: `Cette instance`, en: `This instance` },
  "inspecteur.instance_partage_title": { fr: `Propre à cet exemplaire posé, pour la proposition active uniquement`, en: `Specific to this placed instance, for the active proposal only` },
  "inspecteur.nom_label": { fr: `Nom (instance)`, en: `Name (instance)` },
  "inspecteur.forme_label": { fr: `Forme`, en: `Shape` },
  "inspecteur.forme_rectangle": { fr: `Rectangle`, en: `Rectangle` },
  "inspecteur.forme_cercle": { fr: `Cercle`, en: `Circle` },
  "inspecteur.forme_capsule": { fr: `Capsule`, en: `Capsule` },
  "inspecteur.position_label": { fr: `Position :`, en: `Position:` },
  "inspecteur.rotation_label": { fr: `Rotation :`, en: `Rotation:` },
  "inspecteur.ordre_affichage": { fr: `Ordre d'affichage`, en: `Display order` },
  "inspecteur.arriere_plan": { fr: `Arrière-plan`, en: `Background` },
  "inspecteur.normal": { fr: `Normal`, en: `Normal` },
  "inspecteur.premier_plan": { fr: `Premier plan`, en: `Foreground` },

  // Vue catalogue (plein écran)
  "catalogue_vue.titre": { fr: `Catalogue`, en: `Catalog` },
  "catalogue_page.retour_planner_title": { fr: `Retour au planner`, en: `Back to planner` },
  "catalogue_page.lien_depuis_plans": { fr: `Éditer le catalogue`, en: `Edit the catalog` },
  "catalogue_vue.importer_title": { fr: `Importer un catalogue (CSV)...`, en: `Import a catalog (CSV)...` },
  "catalogue_vue.exporter_title": { fr: `Exporter le catalogue (CSV)...`, en: `Export the catalog (CSV)...` },
  "catalogue_vue.imprimer_title": { fr: `Imprimer le détail du catalogue`, en: `Print catalog details` },
  "catalogue_vue.th_nom": { fr: `Nom`, en: `Name` },
  "catalogue_vue.th_description": { fr: `Description`, en: `Description` },
  "catalogue_vue.th_type": { fr: `Type`, en: `Type` },
  "catalogue_vue.th_largeur": { fr: `Largeur (cm)`, en: `Width (cm)` },
  "catalogue_vue.th_profondeur": { fr: `Profondeur (cm)`, en: `Depth (cm)` },
  "catalogue_vue.th_hauteur": { fr: `Hauteur (cm)`, en: `Height (cm)` },
  "catalogue_vue.th_qte": { fr: `Qté`, en: `Qty` },
  "catalogue_vue.th_volume": { fr: `Volume`, en: `Volume` },
  "catalogue_vue.onglet_a_trier_title": { fr: `Objets pas encore complètement paramétrés : type toujours "Générique" et/ou largeur/profondeur manquantes`, en: `Objects not fully configured yet: still "Generic" type and/or missing width/depth` },
  "catalogue_vue.onglet_a_trier": { fr: `À trier`, en: `To sort` },
  "catalogue_vue.onglet_a_demenager": { fr: `Déménage`, en: `Moving` },
  "catalogue_vue.onglet_non_a_demenager_title": { fr: `Type "Volume fixe" : passer un objet dans cet onglet se fait en changeant son type`, en: `"Fixed volume" type: move an item into this tab by changing its type` },
  "catalogue_vue.onglet_non_a_demenager": { fr: `Sur place`, en: `Staying` },
  "app.impression_th_volume_unitaire": { fr: `Volume unitaire`, en: `Unit volume` },
  "app.impression_th_volume_total": { fr: `Volume total`, en: `Total volume` },

  // app.js : projet / plan / blueprint
  "app.blueprint_remplace": { fr: `Blueprint remplacé (échelle, origine, meubles et habillage conservés).`, en: `Blueprint replaced (scale, origin, furniture and décor kept).` },
  "app.blueprint_importe": { fr: `Blueprint importé avec une échelle par défaut (100px = 1m). Utilisez le bouton "Échelle" pour l'ajuster.`, en: `Blueprint imported with a default scale (100px = 1m). Use the "Scale" button to adjust it.` },
  "app.plan_impossible_charger": { fr: `Impossible de charger ce plan.`, en: `Unable to load this plan.` },
  "app.sauvegarde_plan_echec": { fr: `Attention : la sauvegarde du plan a échoué. Vos derniers changements ne sont probablement pas enregistrés.\n\nRaison : {erreur}`, en: `Warning: saving the plan failed. Your latest changes are probably not saved.\n\nReason: {erreur}` },
  "app.plan_ouvert": { fr: `Plan ouvert : {nom}.`, en: `Plan opened: {nom}.` },
  "app.plan_nouveau_statut": { fr: `Nouveau plan : importez un blueprint pour commencer.`, en: `New plan: import a blueprint to get started.` },
  "app.projet_exporte": { fr: `Projet "{projet}" exporté ({n} plan(s)) : {nom}.json.`, en: `Project "{projet}" exported ({n} plan(s)): {nom}.json.` },
  "app.projet_importe": { fr: `Projet "{projet}" importé ({n} plan(s)).`, en: `Project "{projet}" imported ({n} plan(s)).` },
  "app.plan_importe_defaut": { fr: `Plan importé {n}`, en: `Imported plan {n}` },
  "app.fichier_illisible": { fr: `Impossible de lire le fichier.`, en: `Unable to read the file.` },
  "app.fichier_projet_invalide": { fr: `Fichier de projet invalide.`, en: `Invalid project file.` },
  "app.projet_ouvert_fichier": { fr: `Projet ouvert depuis un fichier.`, en: `Project opened from a file.` },
  "app.importer_blueprint_avant_export": { fr: `Importez d'abord un blueprint avant d'exporter une image.`, en: `Import a blueprint first before exporting an image.` },
  "app.importer_blueprint_avant_projet": { fr: `Importez d'abord un blueprint avant d'enregistrer un projet.`, en: `Import a blueprint first before saving a project.` },
  "app.ajouter_meuble_title_edition": { fr: `Choisir/ajouter un meuble`, en: `Choose/add a furniture item` },
  "app.ajouter_meuble_title_clean": { fr: `Ajouter un masque`, en: `Add a mask` },
  "app.nom_fichier_projet_prompt": { fr: `Nom du fichier (projet "{projet}", {n} plan(s)) :`, en: `File name (project "{projet}", {n} plan(s)):` },
  "app.nom_proposition_prompt": { fr: `Nom de la nouvelle proposition :`, en: `Name of the new proposal:` },
  "app.proposition_defaut": { fr: `Proposition {n}`, en: `Proposal {n}` },
  "app.dupliquer_disposition_confirm": { fr: `Partir de la disposition actuelle de la proposition active ?\n\nOK = dupliquer ses meubles déjà posés (positions incluses)\nAnnuler = partir d'un plan vide`, en: `Start from the active proposal's current layout?\n\nOK = duplicate its already placed furniture (including positions)\nCancel = start from an empty plan` },
  "app.nom_proposition_renommer_prompt": { fr: `Nouveau nom de la proposition :`, en: `New proposal name:` },
  "app.derniere_proposition_impossible": { fr: `Impossible de supprimer la dernière proposition restante.`, en: `Cannot delete the last remaining proposal.` },
  "app.supprimer_proposition_confirm": { fr: `Êtes-vous sûr de vouloir supprimer la proposition "{nom}" ? Sa disposition (meubles posés) sera perdue.`, en: `Are you sure you want to delete the proposal "{nom}"? Its layout (placed furniture) will be lost.` },

  // app.js : catalogue (export/import CSV, impression)
  "app.catalogue_vide_exporter": { fr: `Le catalogue est vide, rien à exporter.`, en: `The catalog is empty, nothing to export.` },
  "app.catalogue_nom_fichier_prompt": { fr: `Nom du fichier catalogue :`, en: `Catalog file name:` },
  "app.catalogue_exporte": { fr: `Catalogue exporté : {nom}.csv.`, en: `Catalog exported: {nom}.csv.` },
  "app.catalogue_fichier_invalide": { fr: `Fichier catalogue invalide (CSV attendu, colonnes : {colonnes}).`, en: `Invalid catalog file (CSV expected, columns: {colonnes}).` },
  "app.catalogue_remplace": { fr: `Catalogue remplacé (partagé par tous les plans) : {n} objet(s){avertissement}.`, en: `Catalog replaced (shared by all plans): {n} object(s){avertissement}.` },
  "app.catalogue_avertissement_types": { fr: ` ({n} type(s) non reconnu(s), repli sur générique)`, en: ` ({n} unrecognized type(s), fell back to generic)` },
  "app.catalogue_vide_imprimer": { fr: `Le catalogue est vide, rien à imprimer.`, en: `The catalog is empty, nothing to print.` },
  "app.impression_titre": { fr: `Catalogue — {id}`, en: `Catalog — {id}` },
  "app.impression_objets": { fr: `{n} objet(s)`, en: `{n} object(s)` },
  "app.impression_th_lph": { fr: `L × P × H`, en: `W × D × H` },

  // app.js : export PNG
  "app.export_png_echec": { fr: `Échec de l'export PNG.`, en: `PNG export failed.` },
  "app.image_exportee": { fr: `Image exportée : {nom}.png ({larg}×{haut}px).`, en: `Image exported: {nom}.png ({larg}×{haut}px).` },

  // Import du blueprint (js/blueprint.js)
  "blueprint.fichier_non_supporte": { fr: `Fichier non supporté : merci de choisir une image JPG ou PNG.`, en: `Unsupported file: please choose a JPG or PNG image.` },
  "blueprint.image_invalide": { fr: `Fichier image invalide.`, en: `Invalid image file.` },
  "blueprint.chemin_local_introuvable": { fr: `Image introuvable à l'emplacement attendu : {chemin}\n\nCopiez d'abord ce fichier à cet endroit (à côté de index.html), sous le même nom, puis réessayez.`, en: `Image not found at the expected location: {chemin}\n\nFirst copy this file there (next to index.html), keeping the same name, then try again.` },
  "blueprint.televersement_echec": { fr: `Échec du téléversement de l'image sur le serveur.`, en: `Failed to upload the image to the server.` },
  "app.blueprint_televersement_en_cours": { fr: `Téléversement du blueprint...`, en: `Uploading blueprint...` },

  // Catalogue (panneau + vue d'édition)
  "catalogue.objet_cree": { fr: `Objet créé dans le catalogue : {nom}. Configurez-le puis choisissez-le pour le poser.`, en: `Object created in the catalog: {nom}. Configure it, then choose it to place it.` },
  "catalogue.nom_nouvel_objet_prompt": { fr: `Nom du nouvel objet (ex. "Canapé du salon") :`, en: `Name of the new object (e.g. "Living room sofa"):` },
  "catalogue.aucun_objet": { fr: `Aucun objet pour l'instant.`, en: `No object yet.` },
  "catalogue_vue.onglet_a_trier_vide": { fr: `Aucun objet à trier.`, en: `No object to sort.` },
  "catalogue_vue.onglet_a_demenager_vide": { fr: `Aucun objet à déménager.`, en: `No object to be moved.` },
  "catalogue_vue.onglet_non_a_demenager_vide": { fr: `Aucun objet sur place.`, en: `No object staying in place.` },
  "edition_catalogue.description_placeholder": { fr: `Notes, marque, lieu d'achat...`, en: `Notes, brand, place of purchase...` },
  "edition_catalogue.quantite_title": { fr: `Nombre d'instances posées sur le plan (dupliquer un meuble compte comme le même modèle)`, en: `Number of instances placed on the plan (duplicating a furniture item counts as the same model)` },
  "edition_catalogue.supprimer_title": { fr: `Supprimer du catalogue`, en: `Remove from the catalog` },
  "edition_catalogue.supprimer_confirm": { fr: `Supprimer "{nom}" du catalogue ?`, en: `Delete "{nom}" from the catalog?` },

  // Échelle (calibration)
  "echelle.clic_premier_point": { fr: `Échelle : cliquez sur le premier point du segment de référence sur le plan.`, en: `Scale: click the first point of the reference segment on the plan.` },
  "echelle.clic_second_point": { fr: `Échelle : cliquez sur le second point du segment de référence.`, en: `Scale: click the second point of the reference segment.` },
  "echelle.indiquez_longueur": { fr: `Échelle : indiquez la longueur réelle de ce segment.`, en: `Scale: enter the actual length of this segment.` },
  "echelle.longueur_prompt": { fr: `Longueur réelle de ce segment, en centimètres :`, en: `Actual length of this segment, in centimeters:` },
  "echelle.calibration_annulee": { fr: `Échelle : calibration annulée.`, en: `Scale: calibration cancelled.` },
  "echelle.definie": { fr: `Échelle définie : {valeur} px/cm.`, en: `Scale set: {valeur} px/cm.` },

  // Mesure
  "mesure.clique_plan": { fr: `Mesurer : cliquez sur le plan pour mesurer.`, en: `Measure: click on the plan to measure.` },
  "mesure.clique_second_point": { fr: `Mesurer : cliquez sur le second point.`, en: `Measure: click the second point.` },
  "mesure.distance": { fr: `Mesurer : {texte}`, en: `Measure: {texte}` },
  "mesure.resultat": { fr: `Distance mesurée : {texte}`, en: `Measured distance: {texte}` },
  "mesure.echelle_non_definie": { fr: `Mesurer : échelle non définie, impossible de convertir en cm.`, en: `Measure: scale not set, cannot convert to cm.` },
  "mesure.echelle_non_definie_texte": { fr: `échelle non définie.`, en: `scale not set.` },

  // Origine
  "origine.clic_definir": { fr: `Origine : cliquez sur le plan pour définir le nouveau point d'origine.`, en: `Origin: click on the plan to set the new origin point.` },
  "origine.definie": { fr: `Origine définie : règles et grille recalées sur ce point.`, en: `Origin set: rulers and grid recalibrated on this point.` },

  // Mode édition/nettoyage
  "mode.nettoyage_title": { fr: `Mode nettoyage (masquer des éléments du plan) — cliquer pour repasser en édition`, en: `Cleanup mode (hide plan elements) — click to switch back to editing` },
  "mode.edition_title": { fr: `Mode édition (placer des meubles) — cliquer pour passer en nettoyage`, en: `Editing mode (place furniture) — click to switch to cleanup` },

  // Objets posés (meubles/habillage)
  "objets.libelle_meuble": { fr: `Meuble`, en: `Furniture` },
  "objets.libelle_masque": { fr: `Masque`, en: `Mask` },
  "objets.ajoute_selectionne": { fr: `{libelleDefaut} ajouté et sélectionné : {libelle}.`, en: `{libelleDefaut} added and selected: {libelle}.` },
  "objets.supprime": { fr: `Supprimé : {libelle}.`, en: `Deleted: {libelle}.` },
  "objets.type_change": { fr: `Type changé : {libelle} -> {type}.`, en: `Type changed: {libelle} -> {type}.` },
  "objets.hauteur_reelle": { fr: `Hauteur réelle : {libelle} -> {valeur} cm.`, en: `Actual height: {libelle} -> {valeur} cm.` },
  "objets.non_definie": { fr: `non définie`, en: `not set` },
  "objets.forme_changee": { fr: `Forme changée : {libelle} -> {forme}.`, en: `Shape changed: {libelle} -> {forme}.` },
  "objets.ordre_affichage_statut": { fr: `Ordre d'affichage : {libelle} -> {niveau}.`, en: `Display order: {libelle} -> {niveau}.` },
  "objets.duplique": { fr: `Dupliqué : {libelle}.`, en: `Duplicated: {libelle}.` },
  "objets.selectionne": { fr: `Sélectionné : {libelle}.`, en: `Selected: {libelle}.` },
  "objets.aucune_selection": { fr: `Aucune sélection.`, en: `No selection.` },
  "objets.renomme": { fr: `Renommé : {libelle}.`, en: `Renamed: {libelle}.` },
  "objets.redimensionne": { fr: `Redimensionné : {libelle}.`, en: `Resized: {libelle}.` },
  "objets.deplace": { fr: `Déplacé : {libelle} (sélection conservée).`, en: `Moved: {libelle} (selection kept).` },
  "objets.rotation_statut": { fr: `Rotation : {libelle} à {rotation}°.`, en: `Rotation: {libelle} at {rotation}°.` },

  // Propositions
  "propositions.ajoutee": { fr: `Proposition ajoutée et active : {nom}{suffixe}.`, en: `Proposal added and active: {nom}{suffixe}.` },
  "propositions.disposition_dupliquee": { fr: ` (disposition dupliquée)`, en: ` (layout duplicated)` },
  "propositions.renommee": { fr: `Proposition renommée : {nom}.`, en: `Proposal renamed: {nom}.` },
  "propositions.supprimee": { fr: `Proposition supprimée : {nom}.`, en: `Proposal deleted: {nom}.` },
  "propositions.active": { fr: `Proposition active : {nom}.`, en: `Active proposal: {nom}.` },

};
