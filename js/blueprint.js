// Import du blueprint (image JPG/PNG du plan d'un étage) : lecture du fichier, extraction des dimensions.
const Blueprint = {

  // Retourne une Promise résolue avec { dataUrl, largeurPx, hauteurPx }
  charger(fichier) {
    return new Promise((resolve, reject) => {
      if (!fichier || !fichier.type.startsWith("image/")) {
        reject(new Error("Fichier non supporté : merci de choisir une image JPG ou PNG."));
        return;
      }

      const lecteur = new FileReader();
      lecteur.onerror = () => reject(new Error("Impossible de lire le fichier."));
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
        image.onerror = () => reject(new Error("Fichier image invalide."));
        image.src = dataUrl;
      };
      lecteur.readAsDataURL(fichier);
    });
  }
};
