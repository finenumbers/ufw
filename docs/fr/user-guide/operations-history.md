# Historique des opérations

Les tâches longues — application, sync, actualisation, installation UFW, scan de ports — sont suivies dans les **journaux d'opérations** et affichées dans l'interface.

## Bannière d'opérations

Pendant l'exécution du travail, une bannière apparaît en haut :

| Élément | Description |
|---------|-------------|
| Statut | EN COURS, EN ATTENTE, SUCCÈS, ÉCHEC, PARTIEL |
| Étapes | Statut extensible par étape |
| Message | Texte de progression ou d'erreur traduit |

**SUCCÈS** se ferme automatiquement après ~10 secondes. **ÉCHEC** et **PARTIEL** restent jusqu'à fermeture.

### Comportement de polling (v0.9.2)

- Interroge ~**1 seconde** tant que l'opération est EN COURS ou EN ATTENTE
- **Arrête le polling à l'inactivité** — pas de boucle de 5 secondes en arrière-plan
- Reprend lorsqu'une nouvelle opération démarre
- À la fin, dispatch un événement pour que les pages serveur actualisent les données SSR

Voir [Opérations et concurrence](../concepts/operations-and-concurrency.md).

### Bannière bloquée

Si la bannière affiche EN COURS après déconnexion, actualisez la page. Le nettoyeur en arrière-plan marque les opérations EN COURS anciennes comme échouées dans ~30–60 minutes.

## Page Opérations

Barre latérale → **Historique des opérations** (`/operations`)

| Onglet | Contenu |
|--------|---------|
| **Journaux d'opérations** | Journal technique — application, sync, actualisation, scan de ports, échecs de création serveur |
| **Événements d'audit** | Événements de sécurité — connexion, déconnexion, export de configuration, actions UFW |

Les deux onglets supportent le défilement infini pour les entrées plus anciennes.

## Types d'opérations

La base de données stocke des noms avec points ; l'interface les traduit.

| Type | Description |
|------|-------------|
| `apply.rules` | Session d'application UFW |
| `ufw.refresh` | Actualiser le statut — SSH en direct + sync règles |
| `ufw.sync` | Sync initiale en arrière-plan sans snapshot |
| `ufw.install` | Installation et activation UFW distante |
| `port.scan` | Scan externe de ports |
| `server.create` | Création serveur avec échec SSH |

Legacy (entrées historiques uniquement) :

- `ssh_test` — pré v0.7.4 ; plus créé

## Effacer l'historique

**Effacer l'historique** retire les anciennes entrées de journal d'opérations de l'interface/base de données selon l'action de rétention. N'affecte pas les serveurs, règles ou UFW distant.

L'onglet audit peut conserver les événements selon la politique — voir [Journal d'audit et export](../administration/audit-log-and-export.md).

## Documentation associée

- [Opérations et concurrence](../concepts/operations-and-concurrency.md)
- [Workflow brouillon et application](../concepts/draft-apply-workflow.md)
- [Scan de ports](./port-scan.md)
