# Éditer et appliquer les règles

Lorsque UFW est **installé et actif**, le **tableau de règles** sur le tableau de bord serveur est la surface d'édition principale.

## Fonctionnalités du tableau de règles

| Fonctionnalité | Description |
|----------------|-------------|
| **Recherche** | Filtrer les lignes visibles |
| **Filtres de colonnes** | Filtrer par groupe ou nom |
| **Sections de groupes** | Développer/réduire les lignes groupées |
| **Glisser-déposer** | Réordonner les règles (l'ordre affecte UFW) |
| **Couleurs de ligne** | Indicateurs [d'état d'origine](../concepts/ufw-rules-and-states.md) |
| **Édition inline** | Double-clic ou action modifier sur la ligne |
| **Ajout / suppression** | Barre d'outils et actions de ligne |
| **Charger plus** | Défilement infini pour grands ensembles de règles |

## Actualiser depuis le serveur

**Actualiser le statut** sur le tableau de bord (ou sync depuis la barre d'outils) :

1. Détecter l'état UFW via SSH
2. Stocker un nouveau snapshot
3. Re-seeder le tableau depuis distant + métadonnées locales

Utiliser après des modifications CLI manuelles sur le serveur ou après application partielle.

Les modifications de brouillon non enregistrées déclenchent une boîte de dialogue de confirmation avant rechargement.

## Resynchronisation forcée depuis le serveur

Lorsque l'interface avertit d'une dérive ou d'une application partielle, utilisez **Resynchronisation forcée depuis le serveur** pour aligner le brouillon sur le snapshot distant réel avant d'autres modifications.

Disponible depuis la boîte de dialogue d'aperçu d'application et les avertissements associés — pas un substitut au ré-aperçu lorsque le distant a changé entre aperçu et confirmation.

## Importer des règles

Barre d'outils → importer **CSV**, **XLSX** ou **JSON** :

- Les lignes fusionnent dans le brouillon ; doublons par empreinte ignorés ou fusionnés selon les règles d'import
- Valider les lignes dans le tableau avant aperçu d'application
- L'import affecte le brouillon uniquement jusqu'à l'application

## Exporter des règles

Exporter le tableau actuel en **XLSX** pour revue hors ligne ou sauvegarde. La disposition XLSX correspond à l'ordre des colonnes d'import pour les workflows aller-retour.

## Workflow d'application

1. Éditer le brouillon
2. **Enregistrer les règles** — revoir les commandes planifiées et les comptes récapitulatifs
3. **Confirmer** — exécute via SSH (rejeté si le distant a changé depuis l'aperçu)
4. Surveiller la **bannière d'opérations** pour la progression par commande

**Enregistrer les règles** / application est désactivé jusqu'à ce que la clé hôte SSH soit **vérifiée** — exécutez d'abord **Actualiser le statut** pour les serveurs importés.

Voir [Workflow brouillon et application](../concepts/draft-apply-workflow.md).

## Conseils de sécurité

- Conserver au moins une règle autorisant SSH depuis votre réseau admin avant les règles deny
- Exécuter l'aperçu en production pendant une fenêtre de maintenance
- Consulter **Historique des opérations** après application pour SUCCÈS ou ÉCHEC

## Documentation associée

- [Règles UFW et états](../concepts/ufw-rules-and-states.md)
- [Historique des opérations](./operations-history.md)
