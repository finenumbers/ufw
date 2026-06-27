# Historique des opérations

Les tâches longues (application, actualisation, installation UFW, test SSH) sont suivies dans les **journaux d'opération** et affichées dans l'interface.

## Bannière d'opération

Pendant qu'une opération s'exécute, une bannière apparaît en haut de l'application :

- Type d'opération et statut (RUNNING, SUCCESS, FAILED)
- Liste de étapes extensible avec statut par étape
- Fermeture automatique en cas de succès après un court délai

La bannière interroge les mises à jour pendant l'exécution.

Si une bannière reste bloquée sur **RUNNING** ou **PENDING** après une déconnexion du navigateur, actualisez la page. Les opérations obsolètes sont nettoyées automatiquement par un balayage en arrière-plan (typiquement sous 30–60 minutes).

## Page des opérations

Barre latérale → **Historique des opérations** (`/operations`)

Deux onglets :

| Onglet | Contenu |
|--------|---------|
| **Opérations** | Journal technique — application, sync, test SSH, etc. |
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

Les administrateurs peuvent effacer l'ancien historique des opérations depuis l'interface (les événements d'audit peuvent être conservés selon la politique de rétention). L'effacement n'affecte ni l'état du serveur ni les règles.

## Documentation associée

- [Journal d'audit et export](../administration/audit-log-and-export.md)
- [Workflow brouillon et application](../concepts/draft-apply-workflow.md)
