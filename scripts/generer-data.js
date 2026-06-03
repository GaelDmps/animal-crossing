/**
 * Génère js/data.js depuis les données ACNH (hémisphère nord, noms FR).
 * Usage : node scripts/generer-data.js
 */

const fs = require('fs');
const path = require('path');

const creatures = require('../node_modules/animal-crossing/lib/data/Creatures.json');
const items = require('../node_modules/animal-crossing/lib/data/Items.json');
const CONTREFACONS_FR = require('./art-contrefacons-fr');

const MOIS_CLES = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

const OMBRE_TAILLE = {
    'X-Small': '1',
    'Small': '2',
    'Medium': '3',
    'Large': '4',
    'X-Large': '5',
    'X-Large w/Fin': '6',
    'XX-Large': '6',
    Long: '4',
};

/** Tailles affichées sur le guide (réf. captures écran) */
const TAILLE_MARINE_PAR_SLUG = {
    'algue-raisin-de-mer': 'Petit',
    'anguille-de-jardin': 'Petit',
    'anemone-de-mer': 'Large',
    'balane': 'Minuscule',
    'bathynome-geant': 'Moyen',
    'bulet': 'Petit',
    'benitier-colossal': 'Géant',
    'calmar-luciole': 'Minuscule',
    'cochon-de-mer': 'Petit',
    'concombre-de-mer': 'Moyen',
    'corbeille-de-venus': 'Moyen',
    'crabe-de-dungeness': 'Moyen',
    'crabe-des-neiges': 'Large',
    'crabe-gazami': 'Moyen',
    'crabe-royal': 'Large',
    'crabe-araignee-geant': 'Géant',
    'crevette-nordique': 'Petit',
    'crevette-tigree': 'Petit',
    'crevette-mante': 'Petit',
    'etoile-de-mer': 'Petit',
    'halocynthia-roretzi': 'Petit',
    'homard': 'Large',
    'huitre': 'Petit',
    'huitre-perliere': 'Petit',
    'langouste': 'Large',
    'limace-de-mer': 'Minuscule',
    'limule': 'Moyen',
    'moule': 'Petit',
    'meduse-lune': 'Petit',
    'nautile': 'Moyen',
    'ormeau': 'Moyen',
    'oursin': 'Petit',
    'oursin-crayon': 'Moyen',
    'pieuvre-parapluie': 'Petit',
    'poulpe': 'Moyen',
    'petoncle': 'Moyen',
    'turbo': 'Petit',
    'vampire-des-abysses': 'Moyen',
    'ver-plat': 'Minuscule',
    'wakame': 'Large',
};

const PARTICULES_MIN = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'd', 'l', 'à', 'au', 'aux']);

const DEPLACEMENT_FR = {
    Stationary: 'Immobile',
    Slow: 'Lent',
    Medium: 'Assez rapide',
    Fast: 'Rapide',
    'Very fast': 'Très rapide',
    'Very slow': 'Très lent',
};

const LIEUX_FR = {
    Sea: 'Océan',
    'Sea (rainy days)': 'Océan (pluie)',
    Pier: 'Jetée',
    Pond: 'Étang',
    River: 'Rivière',
    'River (mouth)': 'Embouchure',
    'River (clifftop)': 'Rivière (falaise)',
    'On rivers/ponds': 'Rivière / étang',
    Flying: 'Volant',
    'Flying near flowers': 'Volant (fleurs)',
    'Flying near blue/purple/black flowers': 'Volant (fleurs hybrides)',
    'Flying near water': 'Volant (eau)',
    'Flying near light sources': 'Volant (lumière)',
    'On flowers': 'Fleurs',
    'On white flowers': 'Fleurs blanches',
    'On the ground': 'Sol',
    'On trees (any kind)': 'Arbres',
    'On hardwood/cedar trees': 'Arbres (feuillus / cèdre)',
    'On palm trees': 'Palmiers',
    'On tree stumps': 'Souche',
    'On rocks/bushes': 'Rochers / buissons',
    'On beach rocks': 'Rochers (plage)',
    'From hitting rocks': 'Rochers (frapper)',
    'Shaking trees': 'Secouer arbres',
    'Shaking trees (hardwood or cedar only)': 'Secouer arbres (feuillus / cèdre)',
    'On villagers': 'Villageois',
    'On rotten turnips or candy': 'Navets pourris / bonbons',
    'Pushing snowballs': 'Boule de neige',
    'Underground (dig where noise is loudest)': 'Souterrain',
    'Disguised on shoreline': 'Ligne de côte',
    'Disguised under trees': 'Sous les arbres',
};

function slugify(nom) {
    return nom
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/['']/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

function titreFr(eUfr) {
    return eUfr
        .split(/\s+/)
        .map((mot, i) => {
            const m = mot.toLowerCase();
            if (i > 0 && PARTICULES_MIN.has(m)) return m;
            return m.charAt(0).toUpperCase() + m.slice(1);
        })
        .join(' ');
}

function moisDepuisTableau(monthsArray) {
    const mois = {};
    MOIS_CLES.forEach((cle, i) => {
        mois[cle] = monthsArray.includes(i + 1);
    });
    return mois;
}

function plageHoraire(arr) {
    if (!arr || arr.length === 0) return null;
    if (arr.length >= 19) return null;

    const heures = [...new Set(arr)].sort((a, b) => a - b);
    const min = heures[0];
    const max = heures[heures.length - 1];

    const nuitTot = heures.some(h => h >= 21);
    const matinTot = heures.some(h => h <= 4);
    if (nuitTot && matinTot) {
        const nuit = heures.filter(h => h >= 21);
        const matin = heures.filter(h => h <= 4);
        return `${Math.min(...nuit)}h00-${Math.max(...matin)}h00`;
    }

    return `${min}h00-${max}h00`;
}

function formaterHeures(north, type) {
    const { time, timeArray } = north;
    const defaut = type === 'marines' ? 'Tout le temps' : 'Journée';

    if (time?.[0] === 'All day') return defaut;
    if (!timeArray || timeArray.length === 0) return defaut;

    const plages = Array.isArray(timeArray[0])
        ? timeArray.map(plageHoraire)
        : [plageHoraire(timeArray)];

    const valides = plages.filter(Boolean);
    if (valides.length === 0) return defaut;
    return valides.join(' et ');
}

function localisationFr(whereHow) {
    if (!whereHow) return '';
    return LIEUX_FR[whereHow] || whereHow;
}

function specimenDepuisCreature(c, type, id) {
    const nom = titreFr(c.translations.eUfr || c.name);
    const slug = slugify(nom);
    const north = c.hemispheres.north;
    const mois = moisDepuisTableau(north.monthsArray);
    const heures = formaterHeures(north, type);

    const base = {
        id,
        nom,
        image: `assets/images/${type}/${slug}.webp`,
        prix: c.sell,
        localisation: '',
        taille: '',
        deplacement: '',
        heures,
        obtenu: false,
        mois,
    };

    if (type === 'poissons') {
        base.prixPollux = Math.round(c.sell * 1.5);
        base.localisation = localisationFr(c.whereHow);
        base.taille = OMBRE_TAILLE[c.shadow] || '3';
    } else if (type === 'insectes') {
        base.prixPollux = Math.round(c.sell * 1.5);
        base.localisation = localisationFr(c.whereHow);
    } else if (type === 'marines') {
        base.taille = TAILLE_MARINE_PAR_SLUG[slug] || 'Moyen';
        base.deplacement = DEPLACEMENT_FR[c.movementSpeed] || c.movementSpeed || '';
    }

    return base;
}

function genererListe(sourceSheet, type) {
    return creatures
        .filter(c => c.sourceSheet === sourceSheet)
        .sort((a, b) => (a.translations.eUfr || '').localeCompare(b.translations.eUfr || '', 'fr'))
        .map((c, index) => specimenDepuisCreature(c, type, index + 1));
}

function formaterObjet(obj, indent) {
    const pad = ' '.repeat(indent);
    const pad2 = ' '.repeat(indent + 4);
    const lignes = ['{'];
    const ordre = [
        'id', 'nom', 'type', 'titreOeuvre', 'description', 'imageAuthentique', 'imageFausse',
        'image', 'prix', 'prixPollux', 'localisation', 'taille', 'deplacement', 'heures', 'obtenu', 'mois',
    ];
    const cles = ordre.filter(k => Object.prototype.hasOwnProperty.call(obj, k));
    cles.forEach((cle, i) => {
        const virgule = i < cles.length - 1 ? ',' : '';
        const val = obj[cle];
        if (cle === 'mois') {
            lignes.push(`${pad2}mois: {`);
            MOIS_CLES.forEach((m, j) => {
                const v = val[m] ? 'true' : 'false';
                const c = j < MOIS_CLES.length - 1 ? ',' : '';
                lignes.push(`${pad2}    ${m}: ${v}${c}`);
            });
            lignes.push(`${pad2}}${virgule}`);
        } else if (typeof val === 'string') {
            const esc = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            lignes.push(`${pad2}${cle}: "${esc}"${virgule}`);
        } else if (typeof val === 'number') {
            lignes.push(`${pad2}${cle}: ${val}${virgule}`);
        } else if (typeof val === 'boolean') {
            lignes.push(`${pad2}${cle}: ${val}${virgule}`);
        } else if (val === null) {
            lignes.push(`${pad2}${cle}: null${virgule}`);
        }
    });
    lignes.push(`${pad}}`);
    return lignes.join('\n');
}

function formaterTableau(nom, items, commentaire) {
    const blocs = items.map(item => formaterObjet(item, 4));
    return `const ${nom} = [\n${commentaire ? `    /* ${commentaire} */\n` : ''}${blocs.map(b => `    ${b.replace(/\n/g, '\n    ')}`).join(',\n')}\n];`;
}

function urlOeuvre(item) {
    return item.highResTexture || item.image || '';
}

function genererOeuvresArt() {
    const parNom = new Map();

    items
        .filter(i => i.sourceSheet === 'Artwork')
        .forEach(item => {
            const nom = titreFr(item.translations.eUfr || item.name);
            if (!parNom.has(nom)) {
                const cleEn = item.translations.uSen || item.name;
                parNom.set(nom, {
                    nom,
                    type: item.tag === 'Picture' ? 'peinture' : 'statue',
                    titreOeuvre: item.realArtworkTitle || '',
                    description: CONTREFACONS_FR[cleEn] || '',
                    imageAuthentique: null,
                    imageFausse: null,
                    obtenu: false,
                });
            }
            const entree = parNom.get(nom);
            const url = urlOeuvre(item);
            if (item.genuine) {
                entree.imageAuthentique = url;
                if (!entree.titreOeuvre && item.realArtworkTitle) {
                    entree.titreOeuvre = item.realArtworkTitle;
                }
                const cleEn = item.translations.uSen || item.name;
                if (!entree.description) {
                    entree.description = CONTREFACONS_FR[cleEn] || '';
                }
            } else {
                entree.imageFausse = url;
            }
        });

    return [...parNom.values()]
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
        .map((entree, index) => ({ id: index + 1, ...entree }));
}

const GROUPE_FOSSILE_FR = {
    'T. Rex': 'Tyrannosaure',
    Ankylosaurus: 'Ankylosaure',
    Archelon: 'Archelon',
    Brachiosaurus: 'Brachiosaure',
    Deinonychus: 'Deinonychus',
    Dimetrodon: 'Dimetrodon',
    Diplodocus: 'Diplodocus',
    Iguanodon: 'Iguanodon',
    Mammoth: 'Mammouth',
    Megacerops: 'Megacerops',
    Megaloceros: 'Mégacéros',
    Ophthalmosaurus: 'Ophthalmosaurus',
    Pachycephalosaurus: 'Pachycéphalosaure',
    Parasaurolophus: 'Parasaurolophus',
    Plesiosaurus: 'Plésiosaure',
    Pteranodon: 'Ptéranodon',
    Sabertooth: 'Dent de sabre',
    Spinosaurus: 'Spinosaure',
    Stegosaurus: 'Stégosaure',
    'T. Rex': 'Tyrannosaure',
    Triceratops: 'Tricératops',
};

function genererFossilesGroupes() {
    const fossils = items.filter(i => i.sourceSheet === 'Fossils');
    const parGroupe = new Map();

    fossils.forEach(f => {
        const grpEn = f.fossilGroup || f.name;
        if (!parGroupe.has(grpEn)) parGroupe.set(grpEn, []);
        parGroupe.get(grpEn).push(f);
    });

    const groupes = [];
    const isoles = [];
    let idGlobal = 0;

    parGroupe.forEach((piecesEn, grpEn) => {
        const pieces = piecesEn
            .sort((a, b) => (a.translations.eUfr || '').localeCompare(b.translations.eUfr || '', 'fr'))
            .map(f => ({
                id: ++idGlobal,
                nom: titreFr(f.translations.eUfr || f.name),
                image: f.image || '',
                prix: f.sell,
                obtenu: false,
            }));

        if (pieces.length > 1) {
            groupes.push({
                id: slugify(GROUPE_FOSSILE_FR[grpEn] || grpEn),
                nom: GROUPE_FOSSILE_FR[grpEn] || titreFr(grpEn),
                pieces,
            });
        } else {
            isoles.push(pieces[0]);
        }
    });

    isoles.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    if (isoles.length > 0) {
        groupes.unshift({
            id: 'fossiles-isoles',
            nom: 'Fossiles isolés',
            pieces: isoles,
        });
    }

    groupes.sort((a, b) => {
        if (a.id === 'fossiles-isoles') return -1;
        if (b.id === 'fossiles-isoles') return 1;
        return a.nom.localeCompare(b.nom, 'fr');
    });

    return groupes;
}

function formaterFossilesGroupes(groupes) {
    const blocs = groupes.map(groupe => {
        const pieces = groupe.pieces
            .map(p => formaterObjet(p, 8))
            .join(',\n');
        const nomEsc = groupe.nom.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `    {
        id: "${groupe.id}",
        nom: "${nomEsc}",
        pieces: [
${pieces}
        ]
    }`;
    });
    return `const fossilesGroupes = [\n${blocs.join(',\n')}\n];`;
}

const poissons = genererListe('Fish', 'poissons');
const insectes = genererListe('Insects', 'insectes');
const creaturesMarines = genererListe('Sea Creatures', 'marines');
const oeuvresArt = genererOeuvresArt();
const fossilesGroupes = genererFossilesGroupes();
const totalFossiles = fossilesGroupes.reduce((n, g) => n + g.pieces.length, 0);

const entete = `/**
 * ============================================================
 * data.js — Données de la collection Animal Crossing
 * ============================================================
 *
 * Généré automatiquement (hémisphère nord, noms FR).
 * Regénérer : node scripts/generer-data.js
 *
 * Structure commune :
 * {
 *   id          : (number)  Identifiant unique
 *   nom         : (string)  Nom du spécimen
 *   image       : (string)  Chemin vers l'image  ex: "assets/images/poissons/perche.webp"
 *   prix        : (number)  Prix chez Nook (clochettes)
 *   prixPollux  : (number)  Pollux (poissons) ou Djason (insectes) — ×1,5
 *   localisation: (string)  Où le trouver
 *   taille      : (string)  Ombre (poissons) ou taille (marines)
 *   deplacement : (string)  Créatures marines uniquement
 *   heures      : (string)  Plage horaire
 *   obtenu      : (boolean) Écrasé par localStorage au chargement
 *   mois        : (object)  true = disponible ce mois-ci
 * }
 */

/* ============================================================
   POISSONS (${poissons.length})
   ============================================================ */

`;

const milieu = `

/* ============================================================
   INSECTES (${insectes.length})
   ============================================================ */

`;

const fin = `

/* ============================================================
   CRÉATURES MARINES (${creaturesMarines.length})
   ============================================================ */

`;

const finArt = `

/* ============================================================
   ŒUVRES D'ART (${oeuvresArt.length})
   ============================================================
   Guide vraies / fausses (noms FR, images acnhcdn.com).
   imageFausse : null = pas de contrefaçon dans le jeu.
   ============================================================ */

`;

const finFossiles = `

/* ============================================================
   FOSSILES (${totalFossiles} pièces, ${fossilesGroupes.length} groupes)
   ============================================================ */

`;

const contenu =
    entete +
    formaterTableau('poissons', poissons) +
    milieu +
    formaterTableau('insectes', insectes) +
    fin +
    formaterTableau('creaturesMarines', creaturesMarines) +
    finArt +
    formaterTableau('oeuvresArt', oeuvresArt) +
    finFossiles +
    formaterFossilesGroupes(fossilesGroupes) +
    '\n';

const sortie = path.join(__dirname, '..', 'js', 'data.js');
fs.writeFileSync(sortie, contenu, 'utf8');
console.log(`✓ ${sortie}`);
console.log(`  ${poissons.length} poissons, ${insectes.length} insectes, ${creaturesMarines.length} créatures marines, ${oeuvresArt.length} œuvres d'art, ${totalFossiles} fossiles`);
