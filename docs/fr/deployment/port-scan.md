# Scan de ports externe

UFW Remote Manager peut exécuter un **scan de ports externe** depuis le conteneur `ufw-app` vers l'adresse `host` de chaque serveur enregistré. Le pipeline utilise :

1. **Naabu** — découverte TCP sur les ports 1–65535 (`host/port/protocol/open`)
2. **Nmap** — détection de service uniquement sur les ports découverts (`-sV`, sortie XML)

Les résultats apparaissent dans un tableau **sous les règles UFW** sur la page du serveur.

## Activer

Définir dans l'environnement de l'application (Compose / Portainer) :

```env
PORT_SCAN_ENABLED=true
```

Réglages optionnels :

| Variable | Défaut | Rôle |
|----------|--------|------|
| `PORT_SCAN_MAX_NMAP_PORTS` | `500` | Nombre max de ports envoyés à l'enrichissement Nmap |
| `PORT_SCAN_NAABU_TIMEOUT_MS` | `1800000` | Délai d'expiration de la découverte complète (30 min) |
| `PORT_SCAN_NMAP_TIMEOUT_MS` | `600000` | Délai d'expiration de l'enrichissement |
| `PORT_SCAN_HISTORY_LIMIT` | `10` | Exécutions de scan stockées par serveur |

Les scans répétés sur le même serveur sont limités à **une fois toutes les 30 secondes** (fixé dans le code depuis v0.5.1). L'ancien `PORT_SCAN_RATE_LIMIT_WINDOW_MS` dans `.env` est **ignoré**.

## Exigences réseau

Le conteneur de l'application doit atteindre **les hôtes de serveurs gérés sur les ports TCP scannés**, pas seulement SSH `:22`. Assurez-vous que le routage/les règles de pare-feu autorisent la sortie depuis l'hôte Docker (ou le réseau `ufw-app`) vers les serveurs cibles.

Cette fonctionnalité scanne **uniquement les hôtes déjà enregistrés dans UFW Remote Manager** — les cibles arbitraires sont rejetées.

## Colonne couverture UFW

Chaque port ouvert est comparé au dernier snapshot UFW avec la **sémantique de scan externe** :

| Valeur | Signification |
|--------|---------------|
| **Allowed** | ALLOW/LIMIT entrant de **toute** source (`From = any`) couvre ce port |
| **Not in UFW** | Port ouvert externement mais non couvert par un ALLOW entrant public — à examiner |
| **Denied** | DENY/REJECT entrant de **toute** source cible ce port |
| **Unknown** | UFW inactif ou pas de snapshot |

Les règles en liste blanche (`From = specific IP/CIDR`, `To Port = any`) ne comptent **pas** comme autorisées pour le scan externe. Seules les règles autorisant explicitement le trafic de partout sont traitées comme exposition publique.

## Notes de sécurité

- Limité en débit (30 secondes entre scans répétés par serveur ; non configurable par env)
- Événements d'audit : `PORT_SCAN_STARTED`, `PORT_SCAN_COMPLETED`
- Les scans s'exécutent dans la file par serveur aux côtés des opérations SSH (sérialisées)
- Utilise des scans connect (`naabu -scan-type c`, `nmap -sT`) — pas de capacités raw socket requises

## Interrogation de progression

Pendant un scan, l'interface interroge un point de terminaison de statut léger (pas de relectures SSH complètes). L'intervalle d'interrogation augmente : **3s → 5s → 10s** au fil de l'exécution. La bannière d'opération affiche la progression des étapes.

## Documentation associée

- [Vue d'ensemble du déploiement](./overview.md)
- [Modèle de sécurité](../administration/security-model.md)
