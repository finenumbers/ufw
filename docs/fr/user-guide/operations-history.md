# Historique des opérations

Les tâches longues (application, actualisation, installation UFW, scan de ports) sont enregistrées dans les **journaux d'opérations** et affichées dans l'interface.

## Bannière d'opération

Pendant qu'une opération s'exécute, une bannière apparaît en haut de l'application :

- Type et statut de l'opération (RUNNING, SUCCESS, FAILED)
- Liste de étapes extensible avec statut par étape
- Masquage automatique en cas de succès après un court délai

La bannière interroge les mises à jour pendant l'exécution.

Si une bannière reste bloquée sur **RUNNING** ou **PENDING** après une déconnexion du navigateur, actualisez la page. Les opérations obsolètes sont effacées automatiquement par un balayage en arrière-plan (généralement sous 30–60 minutes).

## Page Opérations

Barre latérale → **Historique des opérations** (`/operations`)

Deux onglets :

| Onglet | Contenu |
|--------|---------|
| **Opérations** | Journal technique — application, sync, actualisation, scan de ports, etc. |
| **Audit** | Événements liés à la sécurité — connexion, déconnexion, export de configuration |

Les deux prennent en charge le défilement infini pour les entrées plus anciennes.

## Types d'opérations

La base de données stocke des noms de type avec point (par exemple `ufw.refresh`). L'interface les traduit avec des clés à underscore (par exemple `ufw_refresh`).

Exemples actifs :

- `apply_rules` / `apply.rules` — application UFW
- `ufw_refresh` / `ufw.refresh` — Actualiser le statut (lecture SSH en direct + sync des règles)
- `ufw_sync` / `ufw.sync` — sync initiale en arrière-plan lorsqu'aucun snapshot n'existe
- `ufw_install` / `ufw.install` — installation UFW (l'activation s'exécute dans l'installation)
- `port_scan` / `port.scan` — scan de ports externe
- `server_create` / `server.create` — nouveau serveur ajouté

Legacy (entrées historiques uniquement) :

- `ssh_test` — des versions antérieures à v0.7.4 ; n'est plus créé

## Effacer l'historique

Les administrateurs peuvent effacer l'ancien historique des opérations depuis l'interface (les événements d'audit peuvent être conservés selon la politique de rétention). L'effacement n'affecte ni l'état des serveurs ni les règles.

## Documentation associée

- [Journal d'audit et export](../administration/audit-log-and-export.md)
- [Workflow brouillon et application](../concepts/draft-apply-workflow.md)
