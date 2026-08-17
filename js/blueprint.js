// Import du blueprint (image JPG/PNG du plan d'un étage). Ne stocke JAMAIS
// l'image en base64 dans le projet (ça sature vite le stockage — voir
// js/plans.js, alerte de sauvegarde) : on retourne un CHEMIN RELATIF vers
// imports/<nom-original> (dossier PLAT, pas de sous-dossier par projet —
// chaque fichier doit avoir un nom unique dans tout imports/), utilisé tel
// quel comme href de l'image SVG (voir js/viewport.js, definirPlan()) —
// même convention dans les deux modes :
// - MODE_FICHIERS (http/https) : le fichier est téléversé automatiquement
//   sur le serveur (voir php/blueprint-televerser.php), qui l'écrit dans
//   imports/.
// - MODE_LOCAL (file://) : aucune écriture disque n'est possible depuis le
//   navigateur — l'utilisateur doit avoir déjà copié le fichier dans
//   imports/ (même nom) à côté de l'app ; on vérifie juste que ce chemin
//   résout bien vers une image avant de le retenir.
const Blueprint = {

  MODE_LOCAL: "local",

  // Retourne une Promise résolue avec { chemin, largeurPx, hauteurPx }.
  // `contexte` = { mode } (voir js/plans.js).
  async charger(fichier, contexte) {
    if (!fichier || !fichier.type.startsWith("image/")) {
      throw new Error(I18n.t("blueprint.fichier_non_supporte"));
    }
    const { largeurPx, hauteurPx } = await this._dimensions(fichier);
    const chemin = contexte.mode === this.MODE_LOCAL
      ? await this._resoudreLocal(fichier)
      : await this._televerser(fichier);
    return { chemin, largeurPx, hauteurPx };
  },

  // Dimensions lues directement depuis le fichier choisi (URL objet
  // temporaire, jamais persistée) — pas besoin d'attendre le téléversement/
  // la résolution du chemin pour les connaître.
  _dimensions(fichier) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(fichier);
      const image = new Image();
      image.onload = () => {
        const largeurPx = image.naturalWidth;
        const hauteurPx = image.naturalHeight;
        URL.revokeObjectURL(url);
        resolve({ largeurPx, hauteurPx });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(I18n.t("blueprint.image_invalide")));
      };
      image.src = url;
    });
  },

  _resoudreLocal(fichier) {
    const chemin = `imports/${fichier.name}`;
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(chemin);
      image.onerror = () => reject(new Error(I18n.t("blueprint.chemin_local_introuvable", { chemin })));
      image.src = chemin;
    });
  },

  async _televerser(fichier) {
    const donnees = new FormData();
    donnees.append("fichier", fichier);
    let resultat;
    try {
      const reponse = await fetch("php/blueprint-televerser.php", {
        method: "POST",
        body: donnees
      });
      resultat = reponse.ok ? await reponse.json() : null;
    } catch (erreur) {
      resultat = null;
    }
    if (!resultat || !resultat.chemin) throw new Error(I18n.t("blueprint.televersement_echec"));
    return resultat.chemin;
  }
};
