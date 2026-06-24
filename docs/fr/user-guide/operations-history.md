# Historique des opérations

Les tâches longues (application, actualisation, installation UFW, test SSH) sont suivies dans les **journaux d'opérations** et affichées dans l'interface.

## Bannière d'opération

Pendant qu'une opération s'exécute, une bannière apparaît en haut de l'application :

- Type et statut de l'opération (RUNNING, SUCCESS, FAILED)
- Liste d'étapes extensible avec statut par étape
- Fermeture automatique après succès après un court délai

La bannière interroge les mises à jour pendant l'exécution.

## Page Historique des opérations

Barre latérale → **Historique des opérations** (`/operations`)

Deux onglets :

| Onglet | Contenu |
|--------|---------|
| **Opérations** | Journal technique — application, synchronisation, test SSH, etc. |
| **Audit** | Événements liés à la sécurité — connexion, déconnexion, export de configuration |

Les deux prennent en charge le défilement infini pour les entrées plus anciennes.

## Types d'opération

Exemples :

- `apply_rules` — application UFW
- `ufw_refresh` — actualisation du statut et des règles
- `ufw_sync` — synchronisation du brouillon avec le serveur
- `ufw_install` / `ufw_enable` — configuration UFW
- `ssh_test` — vérification de connexion
- `server_create` — nouveau serveur ajouté

## Effacer l'historique

Les administrateurs peuvent effacer l'ancien historique des opérations depuis l'interface (les événements d'audit peuvent être conservés selon la politique de rétention). L'effacement n'affecte pas l'état des serveurs ni les règles.

## Documentation associée

- [Journal d'audit et export](../administration/audit-log-and-export.md)
- [Workflow brouillon et application](../concepts/draft-apply-workflow.md)
