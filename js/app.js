/**
 * ============================================================
 * app.js — Logique principale de la collection Animal Crossing
 * ============================================================
 *
 * Organisation du fichier :
 *   1.  Configuration des catégories
 *   2.  État de l'application (état courant, filtres, tri)
 *   3.  Initialisation
 *   4.  Navigation (accueil ↔ catégorie)
 *   5.  Rendu de la vue catégorie
 *   6.  Construction de la grille de cartes
 *   7.  Barre de tri
 *   8.  Génération des cartes spécimens
 *   9.  Filtrage des données
 *  10.  Tri des données
 *  11.  Statistiques & barre de progression
 *  12.  Gestion du localStorage
 *  13.  Filtres & événements
 *  14.  Utilitaires
 */

/* ============================================================
   1. CONFIGURATION DES CATÉGORIES
   ============================================================
   Chaque entrée décrit une catégorie :
     - clé       : identifiant interne
     - label     : nom affiché
     - emoji     : icône
     - données   : référence au tableau de data.js
     - colonnes  : liste des colonnes à afficher dans le tableau
   ============================================================ */

/** Liste des mois dans l'ordre — utilisée partout dans le code */
const MOIS = [
    { cle: 'janvier',   label: 'Jan' },
    { cle: 'fevrier',   label: 'Fév' },
    { cle: 'mars',      label: 'Mar' },
    { cle: 'avril',     label: 'Avr' },
    { cle: 'mai',       label: 'Mai' },
    { cle: 'juin',      label: 'Jun' },
    { cle: 'juillet',   label: 'Jul' },
    { cle: 'aout',      label: 'Aoû' },
    { cle: 'septembre', label: 'Sep' },
    { cle: 'octobre',   label: 'Oct' },
    { cle: 'novembre',  label: 'Nov' },
    { cle: 'decembre',  label: 'Déc' },
];

/**
 * Définition des colonnes fixes (hors mois) pour chaque catégorie.
 * chaque entrée : { cle, label, triable }
 *   - cle     : clé dans l'objet de donnée (ou "obtenu", "image")
 *   - label   : texte de l'en-tête
 *   - triable : si true → clic sur l'en-tête déclenche un tri
 */
const CONFIG_CATEGORIES = {
    poissons: {
        label: 'Poissons',
        emoji: '🐟',
        sousTitre: 'Suivez votre collection de poissons',
        donnees: () => poissons,
        colonnes: [
            { cle: 'obtenu',       label: 'Obtenu',       triable: true  },
            { cle: 'nom',          label: 'Nom',          triable: true  },
            { cle: 'image',        label: 'Image',        triable: false },
            { cle: 'prix',         label: 'Prix (🔔)',    triable: true  },
            { cle: 'localisation', label: 'Localisation', triable: true  },
            { cle: 'taille',       label: 'Taille',       triable: true  },
            { cle: 'heures',       label: 'Heures',       triable: true  },
        ],
    },
    insectes: {
        label: 'Insectes',
        emoji: '🐞',
        sousTitre: 'Suivez votre collection d\'insectes',
        donnees: () => insectes,
        colonnes: [
            { cle: 'obtenu',       label: 'Obtenu',       triable: true  },
            { cle: 'nom',          label: 'Nom',          triable: true  },
            { cle: 'image',        label: 'Image',        triable: false },
            { cle: 'prix',         label: 'Prix (🔔)',    triable: true  },
            { cle: 'localisation', label: 'Localisation', triable: true  },
            { cle: 'heures',       label: 'Heures',       triable: true  },
        ],
    },
    marines: {
        label: 'Créatures marines',
        emoji: '🦑',
        sousTitre: 'Suivez votre collection de créatures marines',
        donnees: () => creaturesMarines,
        colonnes: [
            { cle: 'obtenu',      label: 'Obtenu',       triable: true  },
            { cle: 'nom',         label: 'Nom',          triable: true  },
            { cle: 'image',       label: 'Image',        triable: false },
            { cle: 'prix',        label: 'Prix (🔔)',    triable: true  },
            { cle: 'taille',      label: 'Taille',       triable: true  },
            { cle: 'deplacement', label: 'Déplacement',  triable: true  },
            { cle: 'heures',      label: 'Heures',       triable: true  },
        ],
    },
};

/* ============================================================
   2. ÉTAT DE L'APPLICATION
   ============================================================ */

/**
 * Objet central qui contient tout l'état courant de l'application.
 * Aucune variable globale éparpillée — tout est ici.
 */
const etat = {
    /** Catégorie actuellement affichée ('poissons' | 'insectes' | 'marines' | null) */
    categorieActive: null,

    /** Paramètres de tri { colonne: string, sens: 'asc'|'desc' } */
    tri: { colonne: 'nom', sens: 'asc' },

    /** Filtres actifs */
    filtres: {
        recherche:          '',     // texte de la barre de recherche
        afficherPossedes:   true,   // case « Possédés »
        afficherNonPossedes: true,  // case « Non possédés »
        moisActifs:         [],     // tableau de clés de mois sélectionnés
        prixMin:      '',        // prix minimum (chaîne vide = pas de filtre)
        prixMax:      '',        // prix maximum
        localisation: '',        // texte libre
        taille:       '',        // texte libre
        heures:       '',        // texte libre
        deplacement:  '',        // texte libre (créatures marines)
    },
};

/* ============================================================
   3. INITIALISATION
   ============================================================ */

/**
 * Point d'entrée — exécuté quand le DOM est prêt.
 * Attache les événements globaux et affiche la page d'accueil.
 */
document.addEventListener('DOMContentLoaded', () => {
    initialiserLightbox();
    attacherEvenementsGlobaux();
    mettreAJourCompteursCarte();
    afficherAccueil();
});

/* ============================================================
   4. NAVIGATION
   ============================================================ */

/**
 * Affiche la page d'accueil et masque la vue catégorie.
 */
function afficherAccueil() {
    etat.categorieActive = null;

    document.getElementById('page-accueil').style.display  = 'flex';
    document.getElementById('page-categorie').style.display = 'none';
    document.getElementById('page-peintures').style.display = 'none';
    document.getElementById('page-fossiles').style.display  = 'none';
    document.getElementById('btn-accueil').style.display   = 'none';

    // Mise à jour des compteurs sur les cartes d'accueil
    mettreAJourCompteursCarte();
}

/**
 * Affiche la vue d'une catégorie donnée.
 * @param {string} categorieId  Clé de catégorie ('poissons' | 'insectes' | 'marines')
 */
function afficherCategorie(categorieId) {
    const config = CONFIG_CATEGORIES[categorieId];
    if (!config) return;

    etat.categorieActive = categorieId;
    chargerFiltres(categorieId); // restaure filtres + tri sauvegardés pour cette catégorie

    document.getElementById('page-accueil').style.display  = 'none';
    document.getElementById('page-peintures').style.display = 'none';
    document.getElementById('page-fossiles').style.display  = 'none';
    document.getElementById('page-categorie').style.display = 'flex';
    document.getElementById('btn-accueil').style.display   = 'inline-block';

    const pageCat = document.getElementById('page-categorie');
    pageCat.classList.remove('animation-entree');
    // Force reflow pour rejouer l'animation
    void pageCat.offsetWidth;
    pageCat.classList.add('animation-entree');

    rendreVueCategorie(categorieId);
}

/* ============================================================
   5. RENDU DE LA VUE CATÉGORIE
   ============================================================ */

/**
 * Construit tout le contenu de la page catégorie :
 *   titre, barre de progression, panneau de filtres, grille de cartes.
 * @param {string} categorieId
 */
function rendreVueCategorie(categorieId) {
    const config    = CONFIG_CATEGORIES[categorieId];
    const pageCat   = document.getElementById('page-categorie');
    pageCat.innerHTML = ''; // réinitialise le contenu précédent

    // ── Titre ────────────────────────────────────────────────
    const titre = creerElement('h2', { className: 'categorie-titre' });
    titre.innerHTML = `<span>${config.emoji}</span> ${config.label}`;
    pageCat.appendChild(titre);

    // ── Barre de progression ─────────────────────────────────
    const barreWrapper = creerElement('div', {
        className: 'barre-progression-wrapper',
        id: 'barre-progression-wrapper',
    });
    pageCat.appendChild(barreWrapper);
    rendreProgression(categorieId, barreWrapper);

    // ── Tout cocher / tout décocher ──────────────────────────
    pageCat.appendChild(creerActionsCollectionMasse(categorieId));

    // ── Panneau de filtres ───────────────────────────────────
    const panneau = creerElement('div', {
        className: 'panneau-filtres',
        id: 'panneau-filtres',
    });
    pageCat.appendChild(panneau);
    rendrePanneauFiltres(categorieId, panneau);

    // ── Barre de tri + grille de cartes ─────────────────────
    const cartesWrapper = creerElement('div', { className: 'cartes-wrapper', id: 'cartes-wrapper' });
    pageCat.appendChild(cartesWrapper);

    rendreCartes(categorieId);
}

/* ============================================================
   6. CONSTRUCTION DE LA GRILLE DE CARTES
   ============================================================ */

/**
 * Génère la barre de tri et la grille de cartes dans #cartes-wrapper.
 * Appelée à chaque changement de filtre ou de tri.
 * @param {string} categorieId
 */
function rendreCartes(categorieId) {
    const config = CONFIG_CATEGORIES[categorieId];
    const wrapper = document.getElementById('cartes-wrapper');
    wrapper.innerHTML = '';

    wrapper.appendChild(creerBarreTri(config, categorieId));

    const donneesBrutes   = chargerEtatObtenu(categorieId, config.donnees());
    const donneesFiltrees = filtrerDonnees(donneesBrutes, categorieId);
    const donneesTried    = trierDonnees(donneesFiltrees);

    const grille = creerElement('div', { className: 'cartes-grid', id: 'cartes-grid' });

    if (donneesTried.length === 0) {
        const vide = creerElement('p', { className: 'message-vide-cartes' });
        vide.textContent = '🔍 Aucun spécimen ne correspond à vos critères de recherche.';
        wrapper.appendChild(vide);
        return;
    }

    donneesTried.forEach(specimen => {
        grille.appendChild(creerCarteSpecimen(specimen, config, categorieId));
    });

    wrapper.appendChild(grille);
}

/* ============================================================
   7. BARRE DE TRI
   ============================================================ */

/**
 * Crée la barre de boutons pour trier la grille (remplace les en-têtes du tableau).
 * @param {object} config
 * @param {string} categorieId
 * @returns {HTMLElement}
 */
function creerBarreTri(config, categorieId) {
    const barre = creerElement('div', { className: 'barre-tri' });
    const label = creerElement('span', { className: 'barre-tri-label' });
    label.textContent = 'Trier par :';
    barre.appendChild(label);

    const colonnesTriables = config.colonnes.filter(c => c.triable && c.cle !== 'obtenu');

    colonnesTriables.forEach(col => {
        const btn = creerElement('button', { type: 'button', className: 'tri-btn' });
        const actif = etat.tri.colonne === col.cle;
        if (actif) btn.classList.add('actif');
        const fleche = actif ? (etat.tri.sens === 'asc' ? ' ▲' : ' ▼') : '';
        btn.textContent = col.label + fleche;
        btn.addEventListener('click', () => basculerTri(col.cle, categorieId));
        barre.appendChild(btn);
    });

    MOIS.forEach(mois => {
        const btn = creerElement('button', { type: 'button', className: 'tri-btn tri-btn-mois' });
        const actif = etat.tri.colonne === mois.cle;
        if (actif) btn.classList.add('actif');
        const fleche = actif ? (etat.tri.sens === 'asc' ? ' ▲' : ' ▼') : '';
        btn.textContent = mois.label + fleche;
        btn.title = `Disponibilité en ${mois.label}`;
        btn.addEventListener('click', () => basculerTri(mois.cle, categorieId));
        barre.appendChild(btn);
    });

    return barre;
}

/* ============================================================
   8. GÉNÉRATION DES CARTES SPÉCIMENS
   ============================================================ */

/**
 * Crée une carte pour un spécimen.
 * @param {object} specimen
 * @param {object} config
 * @param {string} categorieId
 * @returns {HTMLElement}
 */
function creerCarteSpecimen(specimen, config, categorieId) {
    const carte = creerElement('article', { className: 'carte-specimen' });
    if (specimen.obtenu) carte.classList.add('obtenu');

    // Checkbox obtenu — coin supérieur gauche
    const checkLigne = creerElement('div', { className: 'carte-check' });
    checkLigne.appendChild(creerCheckboxObtenu(specimen, categorieId, carte));
    carte.appendChild(checkLigne);

    // Badge saisonnier — coin supérieur droit (Nouveau / Dernier mois)
    const badgeSaison = creerBadgeSaison(specimen);
    if (badgeSaison) carte.appendChild(badgeSaison);

    // Image
    const header = creerElement('div', { className: 'carte-specimen-header' });
    const cadre  = creerElement('div', { className: 'carte-image-cadre' });
    cadre.appendChild(creerVignette(specimen, categorieId, true));
    header.appendChild(cadre);
    carte.appendChild(header);

    // Nom + taille (si présente)
    const titreLigne = creerElement('div', { className: 'carte-titre-ligne' });
    const nom = creerElement('h3', { className: 'carte-nom' });
    nom.textContent = specimen.nom || '—';
    titreLigne.appendChild(nom);
    if (specimen.taille) {
        const taille = creerElement('span', { className: 'carte-taille' });
        taille.textContent = specimen.taille;
        titreLigne.appendChild(taille);
    }
    carte.appendChild(titreLigne);

    // Prix Nook / Pollux (poissons) ou Nook / Djason (insectes)
    carte.appendChild(creerBlocPrix(specimen, categorieId));

    // Infos (localisation, heures, déplacement…)
    const infos = creerElement('ul', { className: 'carte-infos' });
    if (specimen.localisation) {
        infos.appendChild(creerLigneInfo('📍', specimen.localisation));
    }
    if (specimen.heures) {
        infos.appendChild(creerLigneInfo('🕐', specimen.heures));
    }
    if (specimen.deplacement) {
        infos.appendChild(creerLigneInfo('〰️', specimen.deplacement));
    }
    if (infos.children.length > 0) carte.appendChild(infos);

    // Disponibilité par mois
    const moisBloc = creerElement('div', { className: 'carte-mois' });
    MOIS.forEach(mois => {
        const dispo = specimen.mois && specimen.mois[mois.cle];
        const pastille = creerElement('span', {
            className: dispo ? 'carte-mois-pastille dispo' : 'carte-mois-pastille',
            title: dispo ? `Disponible en ${mois.label}` : `Absent en ${mois.label}`,
        });
        pastille.textContent = mois.label;
        moisBloc.appendChild(pastille);
    });
    carte.appendChild(moisBloc);

    return carte;
}

/**
 * Index du mois calendaire courant (0 = janvier … 11 = décembre).
 */
function obtenirIndexMoisCourant() {
    return new Date().getMonth();
}

/**
 * Indique si un spécimen est disponible pour un index de mois donné.
 */
function estDisponibleMois(specimen, indexMois) {
    if (!specimen.mois) return false;
    const cle = MOIS[indexMois]?.cle;
    return cle ? specimen.mois[cle] === true : false;
}

/**
 * Détermine le badge à afficher selon la disponibilité ce mois-ci.
 * @returns {'nouveau'|'dernier-mois'|'nouveau-et-dernier'|null}
 */
function obtenirStatutSaisonnier(specimen) {
    const indexCourant = obtenirIndexMoisCourant();

    if (!estDisponibleMois(specimen, indexCourant)) return null;

    const indexPrecedent = (indexCourant + 11) % 12;
    const indexSuivant   = (indexCourant + 1) % 12;

    const estNouveau = !estDisponibleMois(specimen, indexPrecedent);
    const estDernier = !estDisponibleMois(specimen, indexSuivant);

    if (estNouveau && estDernier) return 'nouveau-et-dernier';
    if (estNouveau) return 'nouveau';
    if (estDernier) return 'dernier-mois';
    return null;
}

/**
 * Pastille « Nouveau » ou « Dernier mois » en haut à droite de la carte.
 */
function creerBadgeSaison(specimen) {
    const statut = obtenirStatutSaisonnier(specimen);
    if (!statut) return null;

    const textes = {
        nouveau:            'Nouveau',
        'dernier-mois':     'Dernier mois',
        'nouveau-et-dernier': 'Nouveau · Dernier mois',
    };

    const classes = {
        nouveau:            'carte-badge carte-badge--nouveau',
        'dernier-mois':     'carte-badge carte-badge--dernier',
        'nouveau-et-dernier': 'carte-badge carte-badge--nouveau-dernier',
    };

    const badge = creerElement('span', { className: classes[statut] });
    badge.textContent = textes[statut];
    badge.setAttribute('title', textes[statut]);
    return badge;
}

/**
 * Ligne d'info sur une carte (icône + texte).
 */
function creerLigneInfo(icone, texte) {
    const li = creerElement('li', { className: 'carte-info-item' });
    const ic = creerElement('span', { className: 'carte-info-icone' });
    ic.textContent = icone;
    li.appendChild(ic);
    li.appendChild(document.createTextNode(texte));
    return li;
}

/**
 * Bloc prix avec libellés Nook et vendeur bonus (Pollux ou Djason).
 * @param {object} specimen
 * @param {string} categorieId
 * @returns {HTMLElement}
 */
function creerBlocPrix(specimen, categorieId) {
    const bloc = creerElement('div', { className: 'carte-prix' });
    const aNook   = specimen.prix != null && specimen.prix !== '';
    const aBonus  = specimen.prixPollux != null && specimen.prixPollux !== '';
    const labelBonus = categorieId === 'insectes' ? 'Djason' : 'Pollux';

    if (aNook) {
        bloc.appendChild(creerLignePrix('Nook', specimen.prix, 'prix-nook'));
    }
    if (aBonus) {
        bloc.appendChild(creerLignePrix(labelBonus, specimen.prixPollux, 'prix-pollux'));
    }
    if (!aNook && !aBonus) {
        const vide = creerElement('div', { className: 'prix-ligne' });
        vide.textContent = 'Prix : —';
        bloc.appendChild(vide);
    }
    return bloc;
}

/**
 * Une ligne de prix : libellé + montant en clochettes.
 */
function creerLignePrix(libelle, montant, classeExtra) {
    const ligne = creerElement('div', { className: `prix-ligne ${classeExtra}` });
    const label = creerElement('span', { className: 'prix-label' });
    label.textContent = libelle;
    const valeur = creerElement('span', { className: 'prix-valeur' });
    valeur.textContent = `${Number(montant).toLocaleString('fr-FR')} 🔔`;
    ligne.appendChild(label);
    ligne.appendChild(valeur);
    return ligne;
}

/**
 * Crée la checkbox de la colonne "Obtenu".
 * Gère l'état, le localStorage et la mise à jour visuelle.
 * @param {object}      specimen      Objet spécimen
 * @param {string}      categorieId
 * @param {HTMLElement} carteEl       Carte du spécimen (pour maj classe CSS)
 * @returns {HTMLElement} <input type="checkbox">
 */
function creerCheckboxObtenu(specimen, categorieId, carteEl) {
    const checkbox = creerElement('input', { type: 'checkbox', className: 'checkbox-obtenu' });
    checkbox.checked = specimen.obtenu;
    checkbox.setAttribute('aria-label', `Marquer ${specimen.nom || 'spécimen'} comme obtenu`);

    checkbox.addEventListener('change', () => {
        // Mise à jour de l'objet en mémoire
        specimen.obtenu = checkbox.checked;

        // Persistance dans localStorage
        sauvegarderObtenu(categorieId, specimen.id, checkbox.checked);

        // Mise à jour visuelle de la carte
        carteEl.classList.toggle('obtenu', checkbox.checked);

        // Mise à jour des statistiques en temps réel
        const barreWrapper = document.getElementById('barre-progression-wrapper');
        if (barreWrapper) rendreProgression(categorieId, barreWrapper);

        // Mise à jour des compteurs sur les cartes d'accueil (si on revenait à l'accueil)
        mettreAJourCompteursCarte();
    });

    return checkbox;
}

/**
 * Crée la vignette image d'un spécimen.
 * Affiche un placeholder emoji si l'image est absente.
 * @param {object}  specimen
 * @param {string}  categorieId
 * @param {boolean} [pourCarte=false]  Utilise les styles carte si true
 * @returns {HTMLElement}
 */
function creerVignette(specimen, categorieId, pourCarte = false) {
    const classeImg = pourCarte ? 'vignette-carte' : 'vignette-img';
    const classePlaceholder = pourCarte ? 'img-placeholder img-placeholder-carte' : 'img-placeholder';

    if (specimen.image) {
        const img = creerElement('img', {
            src:       specimen.image,
            alt:       specimen.nom || '',
            className: `${classeImg} vignette-cliquable`,
            title:     `Agrandir — ${specimen.nom || ''}`,
        });
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            ouvrirLightbox(specimen.image, specimen.nom || '');
        });
        img.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                ouvrirLightbox(specimen.image, specimen.nom || '');
            }
        });
        img.setAttribute('role', 'button');
        img.setAttribute('tabindex', '0');
        // Si l'image est introuvable, on affiche un placeholder
        img.onerror = function () {
            const placeholder = creerPlaceholder(specimen, categorieId, pourCarte);
            this.parentNode.replaceChild(placeholder, this);
        };
        return img;
    }
    return creerPlaceholder(specimen, categorieId, pourCarte);
}

/**
 * Crée un div placeholder quand l'image est absente ou introuvable.
 * @param {object}  specimen
 * @param {string}  categorieId
 * @param {boolean} [pourCarte=false]
 * @returns {HTMLElement}
 */
function creerPlaceholder(specimen, categorieId, pourCarte = false) {
    const classe = pourCarte ? 'img-placeholder img-placeholder-carte' : 'img-placeholder';
    const div = creerElement('div', {
        className: classe,
        title:     specimen.nom || '',
    });

    // Placeholder neutre (pas d'emoji) quand l'image n'est pas trouvée.
    // Le but : signaler clairement qu'il manque une image, sans polluer l'UI.
    div.textContent = 'Aucune';
    return div;
}

/* ============================================================
   9. FILTRAGE DES DONNÉES
   ============================================================ */

/**
 * Applique tous les filtres actifs sur le tableau de données.
 * @param {Array}  donnees      Tableau de spécimens
 * @param {string} categorieId
 * @returns {Array} Données filtrées
 */
function filtrerDonnees(donnees, categorieId) {
    const f = etat.filtres;

    return donnees.filter(s => {
        // ── Recherche par nom ────────────────────────────────
        if (f.recherche) {
            const recherche = normaliser(f.recherche);
            if (!normaliser(s.nom).includes(recherche)) return false;
        }

        // ── Possédés / non possédés (cases à cocher) ────────
        if (!f.afficherPossedes && s.obtenu) return false;
        if (!f.afficherNonPossedes && !s.obtenu) return false;

        // ── Filtres par mois (au moins un mois sélectionné doit matcher) ──
        if (f.moisActifs.length > 0) {
            const disponibleDansUnMois = f.moisActifs.some(m => s.mois && s.mois[m]);
            if (!disponibleDansUnMois) return false;
        }

        // ── Prix minimum ─────────────────────────────────────
        if (f.prixMin !== '' && !isNaN(Number(f.prixMin))) {
            if (s.prix < Number(f.prixMin)) return false;
        }

        // ── Prix maximum ─────────────────────────────────────
        if (f.prixMax !== '' && !isNaN(Number(f.prixMax))) {
            if (s.prix > Number(f.prixMax)) return false;
        }

        // ── Localisation ─────────────────────────────────────
        if (f.localisation) {
            if (!normaliser(s.localisation || '').includes(normaliser(f.localisation))) return false;
        }

        // ── Taille ───────────────────────────────────────────
        if (f.taille) {
            if (!normaliser(s.taille || '').includes(normaliser(f.taille))) return false;
        }

        // ── Heures ───────────────────────────────────────────
        if (f.heures) {
            if (!normaliser(s.heures || '').includes(normaliser(f.heures))) return false;
        }

        // ── Déplacement (créatures marines uniquement) ───────
        if (f.deplacement) {
            if (!normaliser(s.deplacement || '').includes(normaliser(f.deplacement))) return false;
        }

        return true;
    });
}

/* ============================================================
   10. TRI DES DONNÉES
   ============================================================ */

/**
 * Trie un tableau de spécimens selon l'état de tri courant.
 * @param {Array} donnees
 * @returns {Array} Tableau trié (copie)
 */
function trierDonnees(donnees) {
    const { colonne, sens } = etat.tri;
    const coeff = sens === 'asc' ? 1 : -1;

    return [...donnees].sort((a, b) => {
        let valA = obtenirValeurPourTri(a, colonne);
        let valB = obtenirValeurPourTri(b, colonne);

        // Comparaison numérique
        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * coeff;
        }

        // Comparaison booléenne (colonne "obtenu")
        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            return (Number(valA) - Number(valB)) * coeff;
        }

        // Comparaison textuelle
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        if (valA < valB) return -1 * coeff;
        if (valA > valB) return  1 * coeff;
        return 0;
    });
}

/**
 * Extrait la valeur à comparer pour le tri selon la colonne.
 * Gère les mois (booléen) et les champs standard.
 * @param {object} specimen
 * @param {string} colonne
 * @returns {*}
 */
function obtenirValeurPourTri(specimen, colonne) {
    // Colonne mois → valeur booléenne
    const estUnMois = MOIS.some(m => m.cle === colonne);
    if (estUnMois) {
        return specimen.mois ? Boolean(specimen.mois[colonne]) : false;
    }

    // Champs standard
    switch (colonne) {
        case 'obtenu': return specimen.obtenu;
        case 'prix':   return specimen.prix || 0;
        default:       return specimen[colonne] || '';
    }
}

/**
 * Bascule le tri sur une colonne :
 *   - si déjà active → inverse le sens
 *   - sinon → tri ascendant sur cette colonne
 * Puis re-rendu du tableau.
 * @param {string} colonne
 * @param {string} categorieId
 */
function basculerTri(colonne, categorieId) {
    if (etat.tri.colonne === colonne) {
        etat.tri.sens = etat.tri.sens === 'asc' ? 'desc' : 'asc';
    } else {
        etat.tri.colonne = colonne;
        etat.tri.sens    = 'asc';
    }
    appliquerFiltre(categorieId);
}

/* ============================================================
   11. STATISTIQUES & BARRE DE PROGRESSION
   ============================================================ */

/**
 * Affiche les statistiques (obtenu / total / %) dans le wrapper fourni.
 * Met à jour la barre de progression.
 * @param {string}      categorieId
 * @param {HTMLElement} wrapper      Élément DOM dans lequel écrire
 */
function rendreProgression(categorieId, wrapper) {
    wrapper.innerHTML = ''; // vide avant de re-rendre

    const donnees   = chargerEtatObtenu(categorieId, CONFIG_CATEGORIES[categorieId].donnees());
    const total     = donnees.length;
    const obtenus   = donnees.filter(s => s.obtenu).length;
    const pourcent  = total > 0 ? Math.round((obtenus / total) * 100) : 0;

    // Texte gauche
    const texte = creerElement('span', { className: 'stats-texte' });
    texte.textContent = `${CONFIG_CATEGORIES[categorieId].label} : ${obtenus} / ${total}`;
    wrapper.appendChild(texte);

    // Barre
    const outer = creerElement('div', { className: 'barre-progression-outer' });
    const inner = creerElement('div', { className: 'barre-progression-inner' });
    inner.style.width = `${pourcent}%`;
    outer.appendChild(inner);
    wrapper.appendChild(outer);

    // Pourcentage droit
    const pct = creerElement('span', { className: 'stats-pourcentage' });
    pct.textContent = `${pourcent}%`;
    wrapper.appendChild(pct);
}

/**
 * Met à jour les petits compteurs sur les cartes d'accueil.
 * Appelée à l'initialisation et après chaque changement d'état d'obtenu.
 */
function mettreAJourCompteursCarte() {
    Object.entries(CONFIG_CATEGORIES).forEach(([id, config]) => {
        const el = document.getElementById(`compteur-${id}`);
        if (!el) return;

        const donnees  = chargerEtatObtenu(id, config.donnees());
        const total    = donnees.length;
        const obtenus  = donnees.filter(s => s.obtenu).length;
        const pourcent = total > 0 ? Math.round((obtenus / total) * 100) : 0;

        el.textContent = `${obtenus} / ${total} (${pourcent}%)`;
    });

    const compteurArt = document.getElementById('compteur-peintures');
    if (compteurArt && typeof oeuvresArt !== 'undefined') {
        const art = chargerEtatObtenu('peintures', oeuvresArt);
        const obtenus = art.filter(o => o.obtenu).length;
        const pct = art.length > 0 ? Math.round((obtenus / art.length) * 100) : 0;
        compteurArt.textContent = `${obtenus} / ${art.length} (${pct}%)`;
    }

    const compteurFossiles = document.getElementById('compteur-fossiles');
    if (compteurFossiles && typeof fossilesGroupes !== 'undefined') {
        const fossiles = chargerEtatObtenu('fossiles', tousLesFossiles());
        const obtenus = fossiles.filter(f => f.obtenu).length;
        const pct = fossiles.length > 0 ? Math.round((obtenus / fossiles.length) * 100) : 0;
        compteurFossiles.textContent = `${obtenus} / ${fossiles.length} (${pct}%)`;
    }
}

/**
 * Liste à plat de toutes les pièces de fossiles.
 * @returns {object[]}
 */
function tousLesFossiles() {
    if (typeof fossilesGroupes === 'undefined') return [];
    return fossilesGroupes.flatMap(g => g.pieces);
}

/**
 * Barre de progression pour une collection hors CONFIG_CATEGORIES.
 * @param {string} label
 * @param {object[]} donnees
 * @param {HTMLElement} wrapper
 */
function rendreProgressionLibre(label, donnees, wrapper) {
    wrapper.innerHTML = '';
    const total = donnees.length;
    const obtenus = donnees.filter(s => s.obtenu).length;
    const pourcent = total > 0 ? Math.round((obtenus / total) * 100) : 0;

    const texte = creerElement('span', { className: 'stats-texte' });
    texte.textContent = `${label} : ${obtenus} / ${total}`;
    wrapper.appendChild(texte);

    const outer = creerElement('div', { className: 'barre-progression-outer' });
    const inner = creerElement('div', { className: 'barre-progression-inner' });
    inner.style.width = `${pourcent}%`;
    outer.appendChild(inner);
    wrapper.appendChild(outer);

    const pct = creerElement('span', { className: 'stats-pourcentage' });
    pct.textContent = `${pourcent}%`;
    wrapper.appendChild(pct);
}

/**
 * Checkbox « obtenu » réutilisable (art, fossiles).
 * @param {object} item
 * @param {string} categorieId
 * @param {HTMLElement|null} ligneEl
 * @param {Function} [onChange]
 */
function creerCheckboxObtenuItem(item, categorieId, ligneEl, onChange) {
    const checkbox = creerElement('input', { type: 'checkbox', className: 'checkbox-obtenu' });
    checkbox.checked = item.obtenu;
    checkbox.setAttribute('aria-label', `Marquer ${item.nom} comme obtenu`);

    checkbox.addEventListener('change', () => {
        item.obtenu = checkbox.checked;
        sauvegarderObtenu(categorieId, item.id, checkbox.checked);
        if (ligneEl) ligneEl.classList.toggle('obtenu', checkbox.checked);
        if (onChange) onChange();
        mettreAJourCompteursCarte();
    });

    return checkbox;
}

/**
 * Boutons tout cocher / décocher pour une liste d'items.
 * @param {string} categorieId
 * @param {object[]} items
 * @param {Function} apresChangement
 */
function creerActionsCollectionListe(categorieId, items, apresChangement) {
    const wrapper = creerElement('div', { className: 'actions-collection-masse' });

    const btnCocher = creerElement('button', {
        type: 'button',
        className: 'btn-collection-masse btn-tout-cocher',
        textContent: '✓ Tout cocher',
    });
    btnCocher.addEventListener('click', () => {
        items.forEach(s => sauvegarderObtenu(categorieId, s.id, true));
        apresChangement();
        mettreAJourCompteursCarte();
    });

    const btnDecocher = creerElement('button', {
        type: 'button',
        className: 'btn-collection-masse btn-tout-decocher',
        textContent: '✕ Tout décocher',
    });
    btnDecocher.addEventListener('click', () => {
        items.forEach(s => sauvegarderObtenu(categorieId, s.id, false));
        apresChangement();
        mettreAJourCompteursCarte();
    });

    wrapper.append(btnCocher, btnDecocher);
    return wrapper;
}

/* ============================================================
   12. GESTION DU LOCALSTORAGE
   ============================================================ */

/**
 * Génère la clé localStorage pour un spécimen.
 * Format : "ac_<categorieId>_<id>"
 * @param {string} categorieId
 * @param {number} id
 * @returns {string}
 */
function cleLocalStorage(categorieId, id) {
    return `ac_${categorieId}_${id}`;
}

/**
 * Sauvegarde l'état "obtenu" d'un spécimen dans localStorage.
 * @param {string}  categorieId
 * @param {number}  id
 * @param {boolean} obtenu
 */
function sauvegarderObtenu(categorieId, id, obtenu) {
    localStorage.setItem(cleLocalStorage(categorieId, id), JSON.stringify(obtenu));
}

/**
 * Marque tous les spécimens d'une catégorie comme possédés ou non.
 * @param {string}  categorieId
 * @param {boolean} obtenu
 */
function definirTousObtenus(categorieId, obtenu) {
    const donnees = CONFIG_CATEGORIES[categorieId].donnees();
    donnees.forEach(s => sauvegarderObtenu(categorieId, s.id, obtenu));

    const barreWrapper = document.getElementById('barre-progression-wrapper');
    if (barreWrapper) rendreProgression(categorieId, barreWrapper);

    rendreCartes(categorieId);
    mettreAJourCompteursCarte();
}

/**
 * Boutons pour tout cocher ou tout décocher la catégorie.
 */
function creerActionsCollectionMasse(categorieId) {
    const wrapper = creerElement('div', { className: 'actions-collection-masse' });

    const btnCocher = creerElement('button', {
        type:      'button',
        className: 'btn-collection-masse btn-tout-cocher',
    });
    btnCocher.textContent = '✓ Tout cocher';
    btnCocher.addEventListener('click', () => definirTousObtenus(categorieId, true));

    const btnDecocher = creerElement('button', {
        type:      'button',
        className: 'btn-collection-masse btn-tout-decocher',
    });
    btnDecocher.textContent = '✕ Tout décocher';
    btnDecocher.addEventListener('click', () => definirTousObtenus(categorieId, false));

    wrapper.appendChild(btnCocher);
    wrapper.appendChild(btnDecocher);
    return wrapper;
}

/**
 * Charge l'état "obtenu" depuis localStorage et l'applique aux données.
 * Retourne une copie des données avec obtenu mis à jour.
 * @param {string} categorieId
 * @param {Array}  donnees
 * @returns {Array}
 */
function chargerEtatObtenu(categorieId, donnees) {
    return donnees.map(s => {
        const valeur = localStorage.getItem(cleLocalStorage(categorieId, s.id));
        if (valeur !== null) {
            // Copie superficielle pour ne pas muter les données sources
            return { ...s, obtenu: JSON.parse(valeur) };
        }
        return { ...s };
    });
}

/** Filtres vides par défaut */
function filtresParDefaut() {
    return {
        recherche:           '',
        afficherPossedes:    true,
        afficherNonPossedes: true,
        moisActifs:          [],
        prixMin:      '',
        prixMax:      '',
        localisation: '',
        taille:       '',
        heures:       '',
        deplacement:  '',
    };
}

/** Tri par défaut */
function triParDefaut() {
    return { colonne: 'nom', sens: 'asc' };
}

/**
 * Clé localStorage pour les filtres d'une catégorie.
 * @param {string} categorieId
 */
function cleLocalStorageFiltres(categorieId) {
    return `ac_filtres_${categorieId}`;
}

/**
 * Sauvegarde filtres et tri dans localStorage (par catégorie).
 * @param {string} categorieId
 */
function sauvegarderFiltres(categorieId) {
    if (!categorieId) return;
    localStorage.setItem(
        cleLocalStorageFiltres(categorieId),
        JSON.stringify({ filtres: etat.filtres, tri: etat.tri })
    );
}

/**
 * Restaure filtres et tri depuis localStorage, ou valeurs par défaut.
 * @param {string} categorieId
 */
function chargerFiltres(categorieId) {
    etat.filtres = filtresParDefaut();
    etat.tri = triParDefaut();

    const brut = localStorage.getItem(cleLocalStorageFiltres(categorieId));
    if (!brut) return;

    try {
        const data = JSON.parse(brut);
        if (data.filtres && typeof data.filtres === 'object') {
            etat.filtres = normaliserFiltresCharges(data.filtres);
        }
        if (data.tri?.colonne && (data.tri.sens === 'asc' || data.tri.sens === 'desc')) {
            etat.tri = { colonne: data.tri.colonne, sens: data.tri.sens };
        }
    } catch {
        // Données corrompues — on garde les défauts
    }
}

/**
 * Fusionne les filtres chargés (compat. ancien menu « statut »).
 */
function normaliserFiltresCharges(filtres) {
    const base = filtresParDefaut();
    const moisActifs = Array.isArray(filtres.moisActifs) ? [...filtres.moisActifs] : [];

    if (typeof filtres.afficherPossedes === 'boolean' || typeof filtres.afficherNonPossedes === 'boolean') {
        return {
            ...base,
            ...filtres,
            moisActifs,
            afficherPossedes: typeof filtres.afficherPossedes === 'boolean'
                ? filtres.afficherPossedes
                : true,
            afficherNonPossedes: typeof filtres.afficherNonPossedes === 'boolean'
                ? filtres.afficherNonPossedes
                : true,
        };
    }

    if (filtres.statut === 'obtenus') {
        return { ...base, ...filtres, moisActifs, afficherPossedes: true, afficherNonPossedes: false };
    }
    if (filtres.statut === 'non-obtenus') {
        return { ...base, ...filtres, moisActifs, afficherPossedes: false, afficherNonPossedes: true };
    }

    return { ...base, ...filtres, moisActifs };
}

/**
 * Persiste les filtres puis rafraîchit la grille.
 * @param {string} categorieId
 */
function appliquerFiltre(categorieId) {
    sauvegarderFiltres(categorieId);
    rendreCartes(categorieId);
}

/* ============================================================
   13. FILTRES & ÉVÉNEMENTS
   ============================================================ */

/**
 * Construit le panneau de filtres et l'injecte dans l'élément fourni.
 * @param {string}      categorieId
 * @param {HTMLElement} conteneur
 */
function rendrePanneauFiltres(categorieId, conteneur) {
    const config = CONFIG_CATEGORIES[categorieId];

    // ── Ligne 1 : recherche + statut + prix + localisation ───
    const ligne1 = creerElement('div', { className: 'filtres-ligne' });

    // Recherche
    ligne1.appendChild(creerGroupeFiltre('Rechercher', creerInputRecherche(categorieId)));

    // Possédés / non possédés (cases à cocher)
    ligne1.appendChild(creerGroupeFiltre('Collection', creerFiltresPossession(categorieId)));

    // Prix min / max
    ligne1.appendChild(creerGroupeFiltre('Prix min (🔔)', creerInputPrix('prixMin', categorieId)));
    ligne1.appendChild(creerGroupeFiltre('Prix max (🔔)', creerInputPrix('prixMax', categorieId)));

    // Localisation (poissons + insectes)
    if (categorieId === 'poissons' || categorieId === 'insectes') {
        ligne1.appendChild(creerGroupeFiltre('Localisation', creerInputTexteFiltre('localisation', 'ex: Rivière', categorieId)));
    }

    // Taille (poissons + créatures marines)
    if (categorieId === 'poissons' || categorieId === 'marines') {
        ligne1.appendChild(creerGroupeFiltre('Taille', creerInputTexteFiltre('taille', 'ex: Moyen', categorieId)));
    }

    // Heures
    ligne1.appendChild(creerGroupeFiltre('Heures', creerInputTexteFiltre('heures', 'ex: 9h–16h', categorieId)));

    // Déplacement (créatures marines uniquement)
    if (categorieId === 'marines') {
        ligne1.appendChild(creerGroupeFiltre('Déplacement', creerInputTexteFiltre('deplacement', 'ex: Lent', categorieId)));
    }

    // Bouton reset
    const btnReset = creerElement('button', { className: 'btn-reset-filtres' });
    btnReset.textContent = '✕ Réinitialiser';
    btnReset.addEventListener('click', () => reinitialiserFiltres(categorieId));
    ligne1.appendChild(btnReset);

    conteneur.appendChild(ligne1);

    // ── Ligne 2 : sélecteur de mois ──────────────────────────
    const ligneMois = creerElement('div', { className: 'filtres-ligne' });
    ligneMois.appendChild(creerGroupeFiltre('Filtrer par mois', creerSelectorMois(categorieId)));
    conteneur.appendChild(ligneMois);
}

/**
 * Crée un groupe label + contrôle de filtre.
 * @param {string}      labelTexte
 * @param {HTMLElement} controle
 * @returns {HTMLElement}
 */
function creerGroupeFiltre(labelTexte, controle) {
    const groupe = creerElement('div', { className: 'filtre-groupe' });
    const label  = creerElement('label');
    label.textContent = labelTexte;
    groupe.appendChild(label);
    groupe.appendChild(controle);
    return groupe;
}

/**
 * Input de recherche en temps réel.
 */
function creerInputRecherche(categorieId) {
    const input = creerElement('input', {
        type:        'text',
        className:   'filtre-input filtre-recherche',
        placeholder: '🔍 Rechercher un nom…',
        value:       etat.filtres.recherche,
    });
    input.addEventListener('input', () => {
        etat.filtres.recherche = input.value.trim();
        appliquerFiltre(categorieId);
    });
    return input;
}

/**
 * Cases à cocher Possédés / Non possédés.
 */
function creerFiltresPossession(categorieId) {
    const conteneur = creerElement('div', { className: 'filtre-cases-possession' });

    [
        { cle: 'afficherPossedes',    label: 'Possédés'     },
        { cle: 'afficherNonPossedes', label: 'Non possédés' },
    ].forEach(({ cle, label }) => {
        const ligne = creerElement('label', { className: 'filtre-case-label' });
        const checkbox = creerElement('input', {
            type:      'checkbox',
            className: 'filtre-case-checkbox',
        });
        checkbox.checked = etat.filtres[cle];
        checkbox.addEventListener('change', () => {
            etat.filtres[cle] = checkbox.checked;
            appliquerFiltre(categorieId);
        });
        ligne.appendChild(checkbox);
        ligne.appendChild(document.createTextNode(label));
        conteneur.appendChild(ligne);
    });

    return conteneur;
}

/**
 * Input numérique pour les prix (min ou max).
 * @param {'prixMin'|'prixMax'} cleFiltreEtat
 */
function creerInputPrix(cleFiltreEtat, categorieId) {
    const input = creerElement('input', {
        type:        'number',
        className:   'filtre-input',
        placeholder: '0',
        min:         '0',
        value:       etat.filtres[cleFiltreEtat],
    });
    input.style.width = '100px';
    input.addEventListener('input', () => {
        etat.filtres[cleFiltreEtat] = input.value;
        appliquerFiltre(categorieId);
    });
    return input;
}

/**
 * Input texte générique pour les filtres localisation / taille / heures / déplacement.
 * @param {string} cleFiltreEtat  Clé dans etat.filtres
 * @param {string} placeholder
 */
function creerInputTexteFiltre(cleFiltreEtat, placeholder, categorieId) {
    const input = creerElement('input', {
        type:        'text',
        className:   'filtre-input',
        placeholder: placeholder,
        value:       etat.filtres[cleFiltreEtat],
    });
    input.addEventListener('input', () => {
        etat.filtres[cleFiltreEtat] = input.value.trim();
        appliquerFiltre(categorieId);
    });
    return input;
}

/**
 * Grille de boutons mois (multi-sélection).
 * @param {string} categorieId
 * @returns {HTMLElement}
 */
function creerSelectorMois(categorieId) {
    const conteneur = creerElement('div', { className: 'mois-selector' });

    MOIS.forEach(mois => {
        const btn = creerElement('button', { className: 'mois-btn' });
        btn.textContent = mois.label;
        if (etat.filtres.moisActifs.includes(mois.cle)) {
            btn.classList.add('actif');
        }

        btn.addEventListener('click', () => {
            const idx = etat.filtres.moisActifs.indexOf(mois.cle);
            if (idx === -1) {
                etat.filtres.moisActifs.push(mois.cle);
                btn.classList.add('actif');
            } else {
                etat.filtres.moisActifs.splice(idx, 1);
                btn.classList.remove('actif');
            }
            appliquerFiltre(categorieId);
        });

        conteneur.appendChild(btn);
    });

    return conteneur;
}

/**
 * Réinitialise l'état des filtres en mémoire (sans toucher au DOM).
 */
function reinitialiserFiltresEtat() {
    etat.filtres = filtresParDefaut();
    etat.tri = triParDefaut();
}

/**
 * Réinitialise tous les filtres et re-rend le panneau + tableau.
 * Appelée par le bouton "Réinitialiser".
 * @param {string} categorieId
 */
function reinitialiserFiltres(categorieId) {
    reinitialiserFiltresEtat();
    sauvegarderFiltres(categorieId);

    // Recrée le panneau de filtres pour réinitialiser visuellement les contrôles
    const panneau = document.getElementById('panneau-filtres');
    if (panneau) {
        panneau.innerHTML = '';
        rendrePanneauFiltres(categorieId, panneau);
    }

    rendreCartes(categorieId);
}

/* ============================================================
   14. UTILITAIRES
   ============================================================ */

/**
 * Attache les événements globaux (bouton accueil, cartes d'accueil).
 */
function attacherEvenementsGlobaux() {
    // Bouton "Accueil" dans le header
    document.getElementById('btn-accueil').addEventListener('click', afficherAccueil);

    // Titre h1 → retour accueil
    document.getElementById('titre-principal').addEventListener('click', afficherAccueil);

    // Cartes de catégorie sur la page d'accueil
    document.querySelectorAll('.carte-categorie').forEach(carte => {
        const activer = () => {
            const id = carte.getAttribute('data-categorie');
            if (id === 'peintures') afficherPeintures();
            else if (id === 'fossiles') afficherFossiles();
            else if (id) afficherCategorie(id);
        };
        carte.addEventListener('click', activer);
        carte.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activer();
            }
        });
    });
}

/* ============================================================
   16. GUIDE DES ŒUVRES D'ART (peintures & statues)
   ============================================================ */

const etatArt = {
    recherche: '',
    type: 'tous',
    avecContrefacon: false,
    afficherPossedes: true,
    afficherNonPossedes: true,
    prixMin: '',
    prixMax: '',
};

const PRIX_OEUVRE_ART_DEFAUT = 4980;

/**
 * Affiche le guide vraies / fausses des œuvres d'art.
 */
function masquerPagesSecondaires() {
    document.getElementById('page-categorie').style.display = 'none';
    document.getElementById('page-peintures').style.display = 'none';
    document.getElementById('page-fossiles').style.display  = 'none';
}

function afficherPeintures() {
    etat.categorieActive = null;

    document.getElementById('page-accueil').style.display = 'none';
    masquerPagesSecondaires();
    document.getElementById('page-peintures').style.display = 'flex';
    document.getElementById('btn-accueil').style.display    = 'inline-block';

    const page = document.getElementById('page-peintures');
    page.classList.remove('animation-entree');
    void page.offsetWidth;
    page.classList.add('animation-entree');

    rendreGuidePeintures();
}

/**
 * Construit le guide : titre, filtres, tableau authentique / contrefaçon.
 */
function rendreGuidePeintures() {
    const page = document.getElementById('page-peintures');
    page.innerHTML = '';

    const titre = creerElement('h2', { className: 'categorie-titre' });
    titre.innerHTML = '<span>🖼️</span> Œuvres d\'art';
    page.appendChild(titre);

    const barreWrapper = creerElement('div', {
        className: 'barre-progression-wrapper',
        id: 'barre-progression-peintures',
    });
    page.appendChild(barreWrapper);
    rendreProgressionLibre('Œuvres d\'art', chargerEtatObtenu('peintures', oeuvresArt), barreWrapper);

    page.appendChild(creerActionsCollectionListe(
        'peintures',
        oeuvresArt,
        () => rendreGuidePeintures(),
    ));

    const intro = creerElement('p', { className: 'guide-art-intro' });
    intro.textContent = 'Cochez les œuvres déjà données au musée. Comparez authentique et contrefaçon — la description indique comment repérer le faux.';
    page.appendChild(intro);

    const filtres = creerElement('div', { className: 'panneau-filtres guide-art-filtres', id: 'guide-art-filtres' });
    page.appendChild(filtres);
    rendreFiltresGuideArt(filtres);

    const stats = creerElement('p', { className: 'guide-art-stats', id: 'guide-art-stats' });
    page.appendChild(stats);

    const grilleWrapper = creerElement('div', { className: 'guide-art-grille', id: 'guide-art-grille' });
    page.appendChild(grilleWrapper);

    rendreCartesGuideArt(grilleWrapper);
}

/**
 * Panneau de filtres du guide art.
 * @param {HTMLElement} conteneur
 */
function rendreFiltresGuideArt(conteneur) {
    conteneur.innerHTML = '';

    const ligneRecherche = creerElement('div', { className: 'filtre-ligne' });
    const labelRecherche = creerElement('label', { htmlFor: 'guide-art-recherche' });
    labelRecherche.textContent = 'Rechercher';
    const inputRecherche = creerElement('input', {
        type: 'search',
        id: 'guide-art-recherche',
        className: 'filtre-input',
        placeholder: 'Nom de l\'œuvre…',
        value: etatArt.recherche,
    });
    inputRecherche.addEventListener('input', () => {
        etatArt.recherche = inputRecherche.value;
        rendreCartesGuideArt(document.getElementById('guide-art-grille'));
        const barre = document.getElementById('barre-progression-peintures');
        if (barre) {
            rendreProgressionLibre('Œuvres d\'art', chargerEtatObtenu('peintures', oeuvresArt), barre);
        }
    });
    ligneRecherche.append(labelRecherche, inputRecherche);
    conteneur.appendChild(ligneRecherche);

    const ligneType = creerElement('div', { className: 'filtre-ligne filtre-ligne-type' });
    const labelType = creerElement('span', { className: 'filtre-label' });
    labelType.textContent = 'Type';
    ligneType.appendChild(labelType);

    [
        { valeur: 'tous', label: 'Toutes' },
        { valeur: 'peinture', label: 'Peintures' },
        { valeur: 'statue', label: 'Statues' },
    ].forEach(({ valeur, label }) => {
        const btn = creerElement('button', {
            type: 'button',
            className: `filtre-type-btn${etatArt.type === valeur ? ' actif' : ''}`,
            textContent: label,
        });
        btn.addEventListener('click', () => {
            etatArt.type = valeur;
            rendreGuidePeintures();
        });
        ligneType.appendChild(btn);
    });
    conteneur.appendChild(ligneType);

    const ligneOptions = creerElement('div', { className: 'filtre-ligne filtre-ligne-options' });
    const groupeCollection = creerElement('div', { className: 'filtre-groupe filtre-groupe-art' });
    groupeCollection.appendChild(creerElement('label', { textContent: 'Collection' }));
    groupeCollection.appendChild(creerFiltresPossessionArt());
    ligneOptions.appendChild(groupeCollection);
    ligneOptions.appendChild(creerGroupeFiltre('Prix min (🔔)', creerInputPrixArt('prixMin')));
    ligneOptions.appendChild(creerGroupeFiltre('Prix max (🔔)', creerInputPrixArt('prixMax')));

    const labelCb = creerElement('label', { className: 'filtre-checkbox' });
    const cb = creerElement('input', { type: 'checkbox' });
    cb.checked = etatArt.avecContrefacon;
    cb.addEventListener('change', () => {
        etatArt.avecContrefacon = cb.checked;
        rendreCartesGuideArt(document.getElementById('guide-art-grille'));
    });
    labelCb.append(cb, document.createTextNode(' Uniquement avec contrefaçon'));
    ligneOptions.appendChild(labelCb);
    conteneur.appendChild(ligneOptions);
}

/**
 * Cases Possédés / Non possédés pour le guide art.
 * @returns {HTMLElement}
 */
function creerFiltresPossessionArt() {
    const conteneur = creerElement('div', { className: 'filtre-cases-possession' });

    [
        { cle: 'afficherPossedes', label: 'Possédés' },
        { cle: 'afficherNonPossedes', label: 'Non possédés' },
    ].forEach(({ cle, label }) => {
        const ligne = creerElement('label', { className: 'filtre-case-label' });
        const checkbox = creerElement('input', {
            type: 'checkbox',
            className: 'filtre-case-checkbox',
        });
        checkbox.checked = etatArt[cle];
        checkbox.addEventListener('change', () => {
            etatArt[cle] = checkbox.checked;
            rendreCartesGuideArt(document.getElementById('guide-art-grille'));
        });
        ligne.append(checkbox, document.createTextNode(label));
        conteneur.appendChild(ligne);
    });

    return conteneur;
}

/**
 * Input numérique pour filtrer les œuvres par prix.
 * @param {'prixMin'|'prixMax'} cleFiltreEtat
 * @returns {HTMLElement}
 */
function creerInputPrixArt(cleFiltreEtat) {
    const input = creerElement('input', {
        type: 'number',
        min: '0',
        step: '1',
        className: 'filtre-input',
        placeholder: 'ex: 4980',
        value: etatArt[cleFiltreEtat],
    });
    input.addEventListener('input', () => {
        etatArt[cleFiltreEtat] = input.value;
        rendreCartesGuideArt(document.getElementById('guide-art-grille'));
    });
    return input;
}

/**
 * Prix d'achat d'une œuvre. Les données peuvent surcharger le prix standard.
 * @param {object} oeuvre
 * @returns {number}
 */
function prixOeuvreArt(oeuvre) {
    return Number(oeuvre.prix ?? PRIX_OEUVRE_ART_DEFAUT);
}

/**
 * Filtre les œuvres selon etatArt.
 * @param {object[]} [oeuvres=oeuvresArt]
 * @returns {object[]}
 */
function filtrerOeuvresArt(oeuvres = oeuvresArt) {
    let liste = [...oeuvres];

    if (etatArt.type !== 'tous') {
        liste = liste.filter(o => o.type === etatArt.type);
    }

    if (etatArt.avecContrefacon) {
        liste = liste.filter(o => o.imageFausse);
    }

    liste = liste.filter(o => {
        if (!etatArt.afficherPossedes && o.obtenu) return false;
        if (!etatArt.afficherNonPossedes && !o.obtenu) return false;
        if (etatArt.prixMin !== '' && !isNaN(Number(etatArt.prixMin))) {
            if (prixOeuvreArt(o) < Number(etatArt.prixMin)) return false;
        }
        if (etatArt.prixMax !== '' && !isNaN(Number(etatArt.prixMax))) {
            if (prixOeuvreArt(o) > Number(etatArt.prixMax)) return false;
        }
        return true;
    });

    const q = normaliser(etatArt.recherche.trim());
    if (q) {
        liste = liste.filter(o =>
            normaliser(o.nom).includes(q)
            || normaliser(o.titreOeuvre || '').includes(q)
        );
    }

    return liste;
}

/**
 * Grille de cartes œuvres (images côte à côte + description + case).
 * @param {HTMLElement} conteneur
 */
function rendreCartesGuideArt(conteneur) {
    const idsObtenus = new Map(
        chargerEtatObtenu('peintures', oeuvresArt).map(o => [o.id, o.obtenu]),
    );
    const oeuvresAvecEtat = oeuvresArt.map(o => ({
        ...o,
        obtenu: idsObtenus.get(o.id) ?? false,
    }));
    const liste = filtrerOeuvresArt(oeuvresAvecEtat);

    const stats = document.getElementById('guide-art-stats');
    if (stats) {
        const peintures = liste.filter(o => o.type === 'peinture').length;
        const statues = liste.filter(o => o.type === 'statue').length;
        stats.textContent = `${liste.length} œuvre${liste.length > 1 ? 's' : ''} affichée${liste.length > 1 ? 's' : ''} (${peintures} peinture${peintures > 1 ? 's' : ''}, ${statues} statue${statues > 1 ? 's' : ''})`;
    }

    conteneur.innerHTML = '';

    if (liste.length === 0) {
        const vide = creerElement('p', { className: 'guide-art-vide' });
        vide.textContent = 'Aucune œuvre ne correspond à vos filtres.';
        conteneur.appendChild(vide);
        return;
    }

    liste.forEach(oeuvre => conteneur.appendChild(creerCarteGuideArt(oeuvre)));
}

/**
 * Carte d'une œuvre avec case à cocher, comparaison et description.
 * @param {object} oeuvre
 * @returns {HTMLElement}
 */
function creerCarteGuideArt(oeuvre) {
    const carte = creerElement('article', {
        className: `guide-art-carte${oeuvre.obtenu ? ' obtenu' : ''}`,
    });

    const entete = creerElement('div', { className: 'guide-art-carte-entete' });
    entete.appendChild(creerCheckboxObtenuItem(oeuvre, 'peintures', carte, () => {
        const barre = document.getElementById('barre-progression-peintures');
        if (barre) {
            rendreProgressionLibre('Œuvres d\'art', chargerEtatObtenu('peintures', oeuvresArt), barre);
        }
    }));

    const titres = creerElement('div', { className: 'guide-art-carte-titres' });
    titres.appendChild(creerElement('h3', { className: 'guide-art-nom-titre', textContent: oeuvre.nom }));
    if (oeuvre.titreOeuvre) {
        titres.appendChild(creerElement('span', {
            className: 'guide-art-nom-sous',
            textContent: oeuvre.titreOeuvre,
        }));
    }
    titres.appendChild(creerElement('span', {
        className: `guide-art-badge guide-art-badge--${oeuvre.type}`,
        textContent: oeuvre.type === 'peinture' ? 'Peinture' : 'Statue',
    }));
    titres.appendChild(creerPrixGuideArt(oeuvre));
    entete.appendChild(titres);
    carte.appendChild(entete);

    const comparaison = creerElement('div', { className: 'guide-art-comparaison' });
    comparaison.appendChild(creerBlocImageArt(oeuvre.imageAuthentique, oeuvre.nom, 'Authentique', false, oeuvre.type));
    comparaison.appendChild(creerBlocImageArt(
        oeuvre.imageFausse,
        oeuvre.nom,
        'Contrefaçon',
        !oeuvre.imageFausse,
        oeuvre.type,
    ));
    carte.appendChild(comparaison);

    const desc = creerElement('p', { className: 'guide-art-description' });
    desc.textContent = oeuvre.description || '';
    carte.appendChild(desc);

    return carte;
}

/**
 * Prix affiché dans l'en-tête d'une carte œuvre.
 * @param {object} oeuvre
 * @returns {HTMLElement}
 */
function creerPrixGuideArt(oeuvre) {
    const prix = creerElement('span', { className: 'guide-art-prix' });
    prix.textContent = `${prixOeuvreArt(oeuvre).toLocaleString('fr-FR')} 🔔`;
    return prix;
}

/**
 * Bloc image (authentique ou contrefaçon) dans une carte œuvre.
 * @param {string|null} src
 * @param {string} nom
 * @param {string} variante
 * @param {boolean} [sansImage=false]
 */
function creerBlocImageArt(src, nom, variante, sansImage = false, typeOeuvre = 'peinture') {
    const bloc = creerElement('div', { className: 'guide-art-bloc-image' });
    bloc.appendChild(creerElement('span', { className: 'guide-art-bloc-label', textContent: variante }));

    if (sansImage || !src) {
        bloc.appendChild(creerElement('span', {
            className: 'guide-art-sans-faux',
            textContent: 'Pas de contrefaçon',
        }));
        return bloc;
    }

    const btn = creerElement('button', {
        type: 'button',
        className: 'guide-art-img-btn',
        'aria-label': `${variante} — ${nom}`,
    });
    const img = creerElement('img', {
        src,
        alt: `${variante} — ${nom}`,
        loading: 'lazy',
        className: typeOeuvre === 'statue' ? 'guide-art-img guide-art-img--statue' : 'guide-art-img',
    });
    btn.appendChild(img);
    btn.addEventListener('click', () => {
        ouvrirLightbox(src, `${nom} (${variante})`, { art: true, typeOeuvre });
    });
    bloc.appendChild(btn);
    return bloc;
}

/* ============================================================
   17. COLLECTION FOSSILES
   ============================================================ */

const etatFossiles = {
    recherche: '',
    afficherPossedes: true,
    afficherNonPossedes: true,
    prixMin: '',
    prixMax: '',
};

function afficherFossiles() {
    etat.categorieActive = null;

    document.getElementById('page-accueil').style.display = 'none';
    masquerPagesSecondaires();
    document.getElementById('page-fossiles').style.display = 'flex';
    document.getElementById('btn-accueil').style.display    = 'inline-block';

    const page = document.getElementById('page-fossiles');
    page.classList.remove('animation-entree');
    void page.offsetWidth;
    page.classList.add('animation-entree');

    rendrePageFossiles();
}

function rendrePageFossiles() {
    const page = document.getElementById('page-fossiles');
    page.innerHTML = '';

    const titre = creerElement('h2', { className: 'categorie-titre' });
    titre.innerHTML = '<span>🦴</span> Fossiles';
    page.appendChild(titre);

    const barreWrapper = creerElement('div', {
        className: 'barre-progression-wrapper',
        id: 'barre-progression-fossiles',
    });
    page.appendChild(barreWrapper);
    rendreProgressionLibre('Fossiles', chargerEtatObtenu('fossiles', tousLesFossiles()), barreWrapper);

    page.appendChild(creerActionsCollectionListe(
        'fossiles',
        tousLesFossiles(),
        () => rendrePageFossiles(),
    ));

    const intro = creerElement('p', { className: 'guide-art-intro' });
    intro.textContent = 'Cochez les fossiles que vous avez déjà donnés au musée.';
    page.appendChild(intro);

    const filtres = creerElement('div', { className: 'panneau-filtres' });
    rendreFiltresFossiles(filtres);
    page.appendChild(filtres);

    const groupesWrapper = creerElement('div', { className: 'fossiles-groupes', id: 'fossiles-groupes' });
    page.appendChild(groupesWrapper);
    rendreGroupesFossiles(groupesWrapper);
}

function rendreFiltresFossiles(conteneur) {
    conteneur.innerHTML = '';

    const ligne = creerElement('div', { className: 'filtres-ligne' });

    const inputRecherche = creerElement('input', {
        type: 'search',
        id: 'fossiles-recherche',
        className: 'filtre-input',
        placeholder: 'Nom du fossile…',
        value: etatFossiles.recherche,
    });
    inputRecherche.addEventListener('input', () => {
        etatFossiles.recherche = inputRecherche.value;
        rafraichirFossiles();
    });
    ligne.appendChild(creerGroupeFiltre('Rechercher', inputRecherche, 'filtre-recherche'));
    ligne.appendChild(creerGroupeFiltre('Collection', creerFiltresPossessionFossiles()));
    ligne.appendChild(creerGroupeFiltre('Prix min (🔔)', creerInputPrixFossile('prixMin')));
    ligne.appendChild(creerGroupeFiltre('Prix max (🔔)', creerInputPrixFossile('prixMax')));

    const btnReset = creerElement('button', {
        type: 'button',
        className: 'btn-reset-filtres',
        textContent: 'Réinitialiser',
    });
    btnReset.addEventListener('click', () => {
        etatFossiles.recherche = '';
        etatFossiles.afficherPossedes = true;
        etatFossiles.afficherNonPossedes = true;
        etatFossiles.prixMin = '';
        etatFossiles.prixMax = '';
        rendrePageFossiles();
    });
    ligne.appendChild(btnReset);

    conteneur.appendChild(ligne);
}

function creerFiltresPossessionFossiles() {
    const conteneur = creerElement('div', { className: 'filtre-cases-possession' });

    [
        { cle: 'afficherPossedes', label: 'Possédés' },
        { cle: 'afficherNonPossedes', label: 'Non possédés' },
    ].forEach(({ cle, label }) => {
        const ligne = creerElement('label', { className: 'filtre-case-label' });
        const checkbox = creerElement('input', {
            type: 'checkbox',
            className: 'filtre-case-checkbox',
        });
        checkbox.checked = etatFossiles[cle];
        checkbox.addEventListener('change', () => {
            etatFossiles[cle] = checkbox.checked;
            rafraichirFossiles();
        });
        ligne.append(checkbox, document.createTextNode(label));
        conteneur.appendChild(ligne);
    });

    return conteneur;
}

function creerInputPrixFossile(cleFiltreEtat) {
    const input = creerElement('input', {
        type: 'number',
        min: '0',
        step: '1',
        className: 'filtre-input',
        placeholder: 'ex: 1000',
        value: etatFossiles[cleFiltreEtat],
    });
    input.addEventListener('input', () => {
        etatFossiles[cleFiltreEtat] = input.value;
        rafraichirFossiles();
    });
    return input;
}

function rafraichirFossiles() {
    rendreGroupesFossiles(document.getElementById('fossiles-groupes'));
}

function filtrerFossiles(pieces) {
    const q = normaliser(etatFossiles.recherche.trim());
    return pieces.filter(p => {
        if (q && !normaliser(p.nom).includes(q)) return false;
        if (!etatFossiles.afficherPossedes && p.obtenu) return false;
        if (!etatFossiles.afficherNonPossedes && !p.obtenu) return false;
        if (etatFossiles.prixMin !== '' && !isNaN(Number(etatFossiles.prixMin))) {
            if (Number(p.prix || 0) < Number(etatFossiles.prixMin)) return false;
        }
        if (etatFossiles.prixMax !== '' && !isNaN(Number(etatFossiles.prixMax))) {
            if (Number(p.prix || 0) > Number(etatFossiles.prixMax)) return false;
        }
        return true;
    });
}

function rendreGroupesFossiles(conteneur) {
    const obtenusMap = new Map(
        chargerEtatObtenu('fossiles', tousLesFossiles()).map(f => [f.id, f.obtenu]),
    );

    conteneur.innerHTML = '';
    let affiches = 0;

    fossilesGroupes.forEach(groupe => {
        const pieces = filtrerFossiles(groupe.pieces.map(p => ({
            ...p,
            obtenu: obtenusMap.get(p.id) ?? false,
        })));
        if (pieces.length === 0) return;
        affiches += pieces.length;
        conteneur.appendChild(creerCartesFossileGroupe(groupe.nom, pieces));
    });

    if (affiches === 0) {
        conteneur.appendChild(creerElement('p', {
            className: 'guide-art-vide',
            textContent: 'Aucun fossile ne correspond à votre recherche.',
        }));
    }

    const barre = document.getElementById('barre-progression-fossiles');
    if (barre) {
        rendreProgressionLibre('Fossiles', chargerEtatObtenu('fossiles', tousLesFossiles()), barre);
    }
}

function creerCartesFossileGroupe(nomGroupe, pieces) {
    const section = creerElement('section', { className: 'fossile-groupe' });
    section.appendChild(creerElement('h3', { className: 'fossile-groupe-titre', textContent: nomGroupe }));

    const grille = creerElement('div', { className: 'fossiles-cartes-grid' });
    pieces.forEach(piece => grille.appendChild(creerCarteFossile(piece)));
    section.appendChild(grille);
    return section;
}

function creerCarteFossile(piece) {
    const carte = creerElement('article', { className: `fossile-carte${piece.obtenu ? ' obtenu' : ''}` });

    const check = creerElement('div', { className: 'fossile-carte-check' });
    check.appendChild(creerCheckboxObtenuItem(piece, 'fossiles', carte, () => {
        const barre = document.getElementById('barre-progression-fossiles');
        if (barre) {
            rendreProgressionLibre('Fossiles', chargerEtatObtenu('fossiles', tousLesFossiles()), barre);
        }
    }));
    carte.appendChild(check);

    const imageCadre = creerElement('div', { className: 'fossile-carte-image-cadre' });
    if (piece.image) {
        const img = creerElement('img', {
            src: piece.image,
            alt: piece.nom,
            className: 'vignette-cliquable fossile-carte-img',
            loading: 'lazy',
        });
        img.addEventListener('click', () => ouvrirLightbox(piece.image, piece.nom));
        imageCadre.appendChild(img);
    } else {
        imageCadre.appendChild(creerElement('span', {
            className: 'img-placeholder img-placeholder-carte fossile-carte-placeholder',
            textContent: 'IMG',
        }));
    }
    carte.appendChild(imageCadre);

    carte.appendChild(creerElement('h4', { className: 'fossile-carte-nom', textContent: piece.nom }));

    const prix = creerElement('div', { className: 'fossile-carte-prix' });
    prix.appendChild(creerElement('span', { className: 'prix-label', textContent: 'Prix' }));
    prix.appendChild(creerElement('span', {
        className: 'prix-valeur',
        textContent: piece.prix != null
        ? Number(piece.prix).toLocaleString('fr-FR')
        : '—',
    }));
    carte.appendChild(prix);

    return carte;
}

/* ============================================================
   15. LIGHTBOX (agrandissement d'image)
   ============================================================ */

/**
 * Attache les événements de la lightbox (une seule fois).
 */
function initialiserLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightbox.dataset.initialise === 'true') return;

    lightbox.querySelector('.lightbox-fermer').addEventListener('click', fermerLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) fermerLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('ouverte')) {
            fermerLightbox();
        }
    });

    lightbox.dataset.initialise = 'true';
}

/**
 * Ouvre la lightbox avec l'image en grand.
 * @param {string} src   URL de l'image
 * @param {string} nom   Nom du spécimen (titre)
 */
/**
 * URL agrandie pour la lightbox œuvres d'art.
 * Peintures : texture musée /art/ (haute résolution).
 * Statues : pas de /art/ sur le CDN (renvoie « No Preview ») → icône 2.0.
 * @param {string} src
 * @returns {string}
 */
function urlImageArtAgrandie(src) {
    if (!src) return src;
    if (src.includes('/art/')) return src;

    const fichier = (src.match(/\/(Ftr[^/]+\.png)(?:\?|$)/i) || [])[1] || '';
    if (fichier.startsWith('FtrArt')) {
        return `https://acnhcdn.com/art/${fichier}`;
    }

    if (src.includes('/latest/FtrIcon/')) {
        return src.replace('/latest/FtrIcon/', '/2.0/FtrIcon/');
    }

    return src;
}

/**
 * Liste d'URLs à essayer pour la lightbox (évite le placeholder « No Preview »).
 * @param {string} src
 * @returns {string[]}
 */
function urlsLightboxArt(src) {
    const urls = [];
    const ajouter = (u) => {
        if (u && !urls.includes(u)) urls.push(u);
    };

    ajouter(urlImageArtAgrandie(src));
    ajouter(src);
    if (src.includes('/latest/FtrIcon/')) {
        ajouter(src.replace('/latest/FtrIcon/', '/2.0/FtrIcon/'));
    }
    if (src.includes('/2.0/FtrIcon/')) {
        ajouter(src.replace('/2.0/FtrIcon/', '/latest/FtrIcon/'));
    }

    return urls;
}

/**
 * @param {string} src
 * @param {string} nom
 * @param {object} [options]
 * @param {boolean} [options.art]
 */
function ouvrirLightbox(src, nom, options = {}) {
    const lightbox = document.getElementById('lightbox');
    const img      = document.getElementById('lightbox-img');
    const titre    = document.getElementById('lightbox-titre');
    if (!lightbox || !img) return;

    img.alt = nom;
    titre.textContent = nom;

    const candidats = options.art ? urlsLightboxArt(src) : [src];
    let index = 0;

    const chargerSuivant = () => {
        img.onerror = null;
        img.onload = null;
        if (index >= candidats.length) return;
        img.src = candidats[index];
        index += 1;
        img.onerror = chargerSuivant;
    };

    chargerSuivant();

    const typeOeuvre = options.typeOeuvre
        || (options.art && /FtrSculpture/i.test(src) ? 'statue' : 'peinture');

    lightbox.classList.toggle('lightbox--art', !!options.art);
    lightbox.classList.toggle('lightbox--art-statue', !!options.art && typeOeuvre === 'statue');
    lightbox.classList.toggle('lightbox--art-peinture', !!options.art && typeOeuvre === 'peinture');
    lightbox.classList.add('ouverte');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    lightbox.querySelector('.lightbox-fermer').focus();
}

/**
 * Ferme la lightbox.
 */
function fermerLightbox() {
    const lightbox = document.getElementById('lightbox');
    const img      = document.getElementById('lightbox-img');
    if (!lightbox) return;

    lightbox.classList.remove('ouverte', 'lightbox--art', 'lightbox--art-statue', 'lightbox--art-peinture');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (img) {
        img.src = '';
        img.alt = '';
    }
}

/**
 * Crée un élément HTML avec des propriétés optionnelles.
 * @param {string} tag          Nom de la balise
 * @param {object} [props={}]   Propriétés à assigner (className, id, type, etc.)
 * @returns {HTMLElement}
 */
function creerElement(tag, props = {}) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([cle, valeur]) => {
        el[cle] = valeur;
    });
    return el;
}

/**
 * Normalise une chaîne pour une comparaison insensible aux accents et à la casse.
 * @param {string} str
 * @returns {string}
 */
function normaliser(str) {
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // retire les diacritiques
}
