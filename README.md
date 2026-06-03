# 🏝️ Collection Animal Crossing: New Horizons

Site web statique pour suivre votre collection de **Poissons**, **Insectes** et **Créatures marines** dans Animal Crossing: New Horizons.

## Démarrage rapide

Ouvrez simplement `index.html` dans votre navigateur. Aucune installation, aucun serveur requis.

---

## Structure du projet

```
animal-crossing/
├── index.html              ← Page principale (ouvrir ce fichier)
├── css/
│   └── style.css           ← Tous les styles (thème Animal Crossing)
├── js/
│   ├── data.js             ← VOS DONNÉES (poissons, insectes, marines)
│   └── app.js              ← Logique de l'application (ne pas modifier sauf si besoin)
├── assets/
│   └── images/
│       ├── poissons/       ← Images des poissons
│       ├── insectes/       ← Images des insectes
│       └── marines/        ← Images des créatures marines
└── README.md
```

---

## Comment ajouter un poisson

Ouvrez `js/data.js` et ajoutez un objet dans le tableau `poissons` :

```javascript
const poissons = [
    {
        id: 1,                              // Numéro unique — incrémenter à chaque ajout
        nom: "Perche",                      // Nom du poisson
        image: "assets/images/poissons/perche.png",  // Chemin vers l'image
        prix: 300,                          // Prix en clochettes (nombre entier)
        localisation: "Rivière",            // Où le pêcher
        taille: "Moyen",                    // Taille de l'ombre dans l'eau
        deplacement: "",                    // Laisser vide pour les poissons
        heures: "Toute la journée",         // Plage horaire ex: "9h–16h"
        obtenu: false,                      // false par défaut (géré automatiquement)
        mois: {
            janvier:   true,               // true = disponible ce mois
            fevrier:   true,               // false = non disponible
            mars:      true,
            avril:     true,
            mai:       true,
            juin:      true,
            juillet:   true,
            aout:      true,
            septembre: true,
            octobre:   true,
            novembre:  true,
            decembre:  true
        }
    },
];
```

---

## Comment ajouter un insecte

Ajoutez un objet dans le tableau `insectes` de `js/data.js` :

```javascript
const insectes = [
    {
        id: 1,
        nom: "Coccinelle",
        image: "assets/images/insectes/coccinelle.png",
        prix: 200,
        localisation: "Fleurs",
        taille: "",                         // Laisser vide pour les insectes
        deplacement: "",                    // Laisser vide pour les insectes
        heures: "8h–19h",
        obtenu: false,
        mois: {
            janvier:   false,
            fevrier:   false,
            mars:      true,
            avril:     true,
            mai:       true,
            juin:      true,
            juillet:   true,
            aout:      true,
            septembre: true,
            octobre:   false,
            novembre:  false,
            decembre:  false
        }
    },
];
```

---

## Comment ajouter une créature marine

Ajoutez un objet dans le tableau `creaturesMarines` de `js/data.js` :

```javascript
const creaturesMarines = [
    {
        id: 1,
        nom: "Étoile de mer",
        image: "assets/images/marines/etoile-de-mer.png",
        prix: 500,
        localisation: "",                   // Laisser vide pour les créatures marines
        taille: "Petit",
        deplacement: "Lent",               // Modèle de déplacement observé
        heures: "Toute la journée",
        obtenu: false,
        mois: {
            janvier:   true,
            fevrier:   true,
            mars:      true,
            avril:     true,
            mai:       true,
            juin:      true,
            juillet:   true,
            aout:      true,
            septembre: true,
            octobre:   true,
            novembre:  true,
            decembre:  true
        }
    },
];
```

---

## Comment ajouter une image

1. Placez votre image dans le dossier correspondant :
   - Poissons → `assets/images/poissons/`
   - Insectes → `assets/images/insectes/`
   - Créatures marines → `assets/images/marines/`

2. Formats recommandés : **PNG** (fond transparent) ou **WebP**

3. Taille recommandée : **128×128 px** minimum

4. Dans `data.js`, renseignez le champ `image` avec le chemin relatif depuis la racine du projet :

```javascript
image: "assets/images/poissons/mon-poisson.png"
```

Si l'image est absente ou introuvable, un placeholder sera affiché automatiquement.

---

## Fonctionnalités

| Fonctionnalité              | Description |
|-----------------------------|-------------|
| ✅ Suivi de collection       | Cochez les spécimens obtenus |
| 💾 Sauvegarde automatique   | État conservé dans le navigateur (localStorage) |
| 📊 Statistiques en temps réel | Progression et pourcentage mis à jour instantanément |
| 🔍 Recherche                | Recherche en temps réel par nom |
| 🎛️ Filtres avancés          | Statut, prix, localisation, taille, heures, déplacement |
| 📅 Filtre par mois          | Multi-sélection de mois possible |
| ↕️ Tri sur toutes les colonnes | Clic sur l'en-tête pour trier, 2e clic pour inverser |
| 📱 Responsive               | Compatible mobile, tablette et desktop |

---

## Bonnes pratiques lors de l'ajout de données

- **IDs uniques** : chaque spécimen doit avoir un `id` différent **au sein de sa catégorie**. Le plus simple est d'incrémenter de 1 à chaque ajout.
- **Ne pas modifier `obtenu`** : il est géré automatiquement par localStorage.
- **Nommage des images** : utilisez des noms en minuscules, sans espaces ni accents (ex: `etoile-de-mer.png`).
- **Séparateur de milliers** : le champ `prix` est un nombre, pas une chaîne — n'ajoutez pas de guillemets.

---

## Réinitialiser la collection

Pour effacer tous les états "obtenu" et repartir de zéro, ouvrez la console du navigateur (F12) et tapez :

```javascript
localStorage.clear();
location.reload();
```
