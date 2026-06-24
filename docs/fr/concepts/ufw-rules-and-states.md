# Règles UFW et états

Les règles sont normalisées dans un modèle de ligne unifié avec des champs **core** (ce qui compte pour UFW) et des champs **UI** (nom, groupe, métadonnées de couleur).

## Champs core des règles

Les colonnes typiques incluent l'action (allow/deny/reject), la direction, le protocole, les ports, les adresses source/destination et le mode de journalisation. L'ensemble exact correspond à la syntaxe expressive des règles UFW — voir le tableau des règles dans l'interface.

## États de synchronisation (couleurs des lignes)

Chaque ligne possède un **état** indiquant comment les données du brouillon local se rapportent au dernier snapshot serveur :

| État | Signification |
|------|---------------|
| **MATCHED** | Le brouillon correspond à ce qu'UFW a rapporté sur le serveur |
| **REMOTE_ONLY** | Présent dans le snapshot serveur mais absent de votre brouillon local |
| **LOCAL_ONLY** | Dans votre brouillon mais absent du serveur (sera ajouté à l'application) |
| **DRAFT_ONLY** | Modification locale non encore appliquée ; diffère de la base MATCHED |

Les couleurs aident à repérer la dérive avant l'application. Après **Resynchronisation forcée depuis le serveur**, le brouillon local se réaligne sur l'état distant.

## Empreintes

Chaque règle possède une empreinte dérivée des champs core. Utilisée pour faire correspondre les lignes entre snapshots et détecter les opérations de réordonnancement/suppression lors de la planification d'application.

## Regroupement et ordre

- **Groupes** — organisent les règles visuellement ; le nom de groupe est une métadonnée UI
- **Ordre** — l'ordre des règles UFW compte ; un réordonnancement peut nécessiter une suppression-recréation sur le serveur lors de l'application

## Formats d'import

Les règles peuvent être importées depuis **CSV**, **XLSX** ou **JSON** via la barre d'outils des règles. Les lignes importées deviennent des entrées de brouillon — une application est toujours requise pour atteindre le serveur.

## Documentation associée

- [Workflow brouillon et application](./draft-apply-workflow.md)
- [Éditer et appliquer les règles](../user-guide/edit-and-apply-rules.md)
