# Identités SSH

Une **identité SSH** stocke des identifiants de connexion réutilisables : nom d'utilisateur, méthode d'authentification et secrets chiffrés. Chaque **serveur** référence une identité.

## Méthodes d'authentification

| Méthode | Secret stocké | Usage typique |
|---------|---------------|---------------|
| **Mot de passe** | Mot de passe SSH | Lab simple ou hôtes legacy |
| **Clé privée** | Clé privée PEM | Clés de production sans passphrase |
| **Clé privée + passphrase** | Clé et passphrase | Clés privées chiffrées |

Les secrets sont chiffrés au repos avec **AES-256-GCM** via `APP_ENCRYPTION_KEY`. Ils ne sont déchiffrés qu'en mémoire lors de l'ouverture d'une connexion SSH.

## Création et modification

1. Barre latérale → **Identités SSH**
2. **Ajouter une identité** ou ouvrir une ligne existante → **Modifier**
3. Champs obligatoires : nom d'affichage, nom d'utilisateur SSH, méthode d'auth, secret(s)

Lors de la **modification**, laisser les champs mot de passe/clé vides conserve le secret existant inchangé.

La validation rejette les noms vides et les combinaisons d'auth invalides avant l'enregistrement.

## Liaison aux serveurs

Lors de la création ou modification d'un serveur, sélectionnez une identité dans la liste déroulante. Changer l'identité d'un serveur déclenche une vérification SSH à l'enregistrement si les paramètres de connexion ont changé.

## Suppression d'une identité

La suppression est bloquée tant qu'un serveur référence encore l'identité. L'interface liste les serveurs liés. Réassignez ou supprimez d'abord ces serveurs.

## Notes de sécurité

- Les secrets d'identité apparaissent dans l'**export de configuration** (JSON v2) après confirmation du mot de passe — traitez les exports comme hautement sensibles
- Faire tourner `APP_ENCRYPTION_KEY` sans ressaisir les secrets rend le ciphertext existant illisible — planifiez la rotation des clés avec soin
- Une identité peut être partagée par plusieurs serveurs (même utilisateur admin, même clé)

## Documentation associée

- [Serveurs et SSH](./servers-and-ssh.md)
- [Import et export de configuration](./import-export-config.md)
- [Modèle de sécurité](../administration/security-model.md)
