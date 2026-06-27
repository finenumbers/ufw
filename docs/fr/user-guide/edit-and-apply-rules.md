# Modifier et appliquer les règles

Lorsque UFW est **installé et actif** sur un serveur, le **tableau des règles** du tableau de bord permet de gérer les règles de pare-feu.

## Tableau des règles

Fonctionnalités :

- Recherche et filtres par colonne
- Sections de groupes avec développer/réduire
- Réordonnancement par glisser-déposer (l'ordre compte pour UFW)
- Couleurs de ligne selon l'[état de sync](../concepts/ufw-rules-and-states.md)
- Ajouter une ligne, modifier inline, supprimer une ligne

## Actualiser depuis le serveur

Utilisez **Actualiser le statut** sur le tableau de bord (ou l'actualisation depuis la barre d'outils des règles) pour :

1. Détecter l'état UFW via SSH
2. Charger un nouveau snapshot depuis le serveur
3. Réinitialiser le tableau des règles à partir des données distantes et des métadonnées locales

Si vous avez des **modifications non enregistrées**, l'application affiche une boîte de dialogue de confirmation avant de recharger depuis le serveur.

Utilisez cette action après des modifications manuelles sur la CLI du serveur ou après une application partielle.

## Resynchronisation forcée

Si l'interface signale une dérive ou une application partielle, utilisez **Resynchronisation forcée depuis le serveur** pour remplacer l'alignement local du brouillon par le snapshot distant réel avant de continuer l'édition.

## Importer des règles

Barre d'outils → importer CSV, XLSX ou JSON. Validez les lignes importées dans le tableau avant l'aperçu d'application.

## Workflow d'application

1. Effectuer les modifications du brouillon
2. **Aperçu d'application** — examiner les commandes prévues et le résumé des différences
3. **Confirmer** — exécution via SSH (rejetée si l'UFW distant a changé depuis l'aperçu — relancer l'aperçu)
4. Suivre la progression dans la bannière d'opération

**Enregistrer les règles** (aperçu d'application) est désactivé tant que la clé hôte SSH n'est pas **vérifiée** — exécutez d'abord **Actualiser le statut** si le serveur a été importé depuis la configuration.

Voir [Workflow brouillon et application](../concepts/draft-apply-workflow.md) pour les détails.

## Conseils de sécurité

- Conservez toujours au moins une règle autorisant SSH depuis votre réseau d'administration avant d'appliquer des règles deny
- Exécutez l'aperçu en production pendant une fenêtre de maintenance
- Consultez l'**Historique des opérations** après l'application pour le statut SUCCESS ou FAILED

## Documentation associée

- [Règles UFW et états](../concepts/ufw-rules-and-states.md)
- [Historique des opérations](./operations-history.md)
