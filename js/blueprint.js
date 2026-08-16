// Import du blueprint (image JPG/PNG du plan d'un étage) : lecture du fichier, extraction des dimensions.
const Blueprint = {

  // Retourne une Promise résolue avec { dataUrl, largeurPx, hauteurPx }
  charger(fichier) {
    return new Promise((resolve, reject) => {
      if (!fichier || !fichier.type.startsWith("image/")) {
        reject(new Error(I18n.t("blueprint.fichier_non_supporte")));
        return;
      }

      const lecteur = new FileReader();
      lecteur.onerror = () => reject(new Error(I18n.t("app.fichier_illisible")));
      lecteur.onload = () => {
        const dataUrl = lecteur.result;
        const image = new Image();
        image.onload = () => {
          resolve({
            dataUrl,
            largeurPx: image.naturalWidth,
            hauteurPx: image.naturalHeight
          });
        };
        image.onerror = () => reject(new Error(I18n.t("blueprint.image_invalide")));
        image.src = dataUrl;
      };
      lecteur.readAsDataURL(fichier);
    });
  }
};
