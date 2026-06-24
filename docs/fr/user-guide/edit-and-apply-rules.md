# Éditer et appliquer les règles

Lorsque UFW est **installé et actif** sur un serveur, ouvrez l'onglet **Règles** pour gérer les règles de pare-feu.

## Tableau des règles

Fonctionnalités :

- Recherche et filtres de colonnes
- Sections de groupes avec développement/réduction
- Réordonnancement par glisser-déposer (l'ordre compte pour UFW)
- Couleurs de ligne par [état de synchronisation](../concepts/ufw-rules-and-states.md)
- Ajouter une ligne, édition inline, supprimer une ligne

## Actualiser depuis le serveur

Cliquez sur **Actualiser le statut** (ou utilisez l'actualisation du tableau de bord) pour :

1. Détecter l'état UFW
2. Charger le snapshot depuis le serveur
3. Synchroniser les états d'origine du brouillon

Utilisez ceci après des modifications manuelles sur la CLI du serveur ou après une application partielle.

## Resynchronisation forcée

Si l'interface signale une dérive ou une application partielle, utilisez **Resynchronisation forcée depuis le serveur** pour remplacer l'alignement du brouillon local par le snapshot distant réel avant de continuer l'édition.

## Importer des règles

Barre d'outils → importer CSV, XLSX ou JSON. Validez les lignes importées dans le tableau avant l'aperçu d'application.

## Workflow d'application

1. Effectuer les modifications du brouillon
2. **Enregistrer les règles** — examiner les commandes planifiées et le résumé des différences
3. **Confirmer** — exécution via SSH
4. Suivre la bannière d'opération pour la progression

Voir [Workflow brouillon et application](../concepts/draft-apply-workflow.md) pour les détails.

## Conseils de sécurité

- Conservez toujours au moins une règle autorisant SSH depuis votre réseau admin avant d'appliquer des règles deny
- Lancez l'aperçu en production pendant une fenêtre de maintenance
- Consultez l'**Historique des opérations** après l'application pour le statut SUCCESS ou FAILED

## Documentation associée

- [Règles UFW et états](../concepts/ufw-rules-and-states.md)
- [Historique des opérations](./operations-history.md)
