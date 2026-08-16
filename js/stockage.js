// Filet de sécurité : dernier projet édité, toujours écrit en localStorage
// sous une clé fixe quel que soit le mode (voir js/sessions.js) — permet de
// ne rien perdre même en cas de souci d'écriture côté session active. N'est
// jamais utilisé pour restaurer automatiquement une session au démarrage
// (voir documentation/20-sessions.md).
const Stockage = {

  CLE: "planner-projet",

  sauvegarder(projet) {
    try {
      localStorage.setItem(this.CLE, JSON.stringify(projet));
    } catch (erreur) {
      console.warn("Auto-sauvegarde locale impossible :", erreur);
    }
  },

  charger() {
    const brut = localStorage.getItem(this.CLE);
    if (!brut) return null;
    try {
      return JSON.parse(brut);
    } catch (erreur) {
      return null;
    }
  },

  effacer() {
    localStorage.removeItem(this.CLE);
  }
};
