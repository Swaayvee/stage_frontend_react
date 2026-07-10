export const merchantAddress = '15 Rue de la Republique, 69002 Lyon'

export const deliveryModes = {
  home: {
    id: 'home',
    name: 'A domicile',
    label: 'A domicile - Interne',
    description: 'Remise directe a votre adresse par un livreur interne.',
    delay: 'Sous 24h',
    price: '4,90 EUR',
    tone: 'blue',
  },
  relay: {
    id: 'relay',
    name: 'Point relais',
    label: 'Point relais - Interne',
    description: 'Depot en relais, puis retrait quand cela vous arrange.',
    delay: 'Sous 48h',
    price: '3,50 EUR',
    tone: 'green',
  },
  carrier: {
    id: 'carrier',
    name: 'Transporteur tiers',
    label: 'Transporteur tiers',
    description: 'Prestataire externe pour les livraisons longues distances.',
    delay: 'J+1 a J+2',
    price: '8,90 EUR',
    tone: 'purple',
  },
}

export const relayPoints = [
  {
    id: 'bron',
    name: 'Carrefour City Bron',
    address: '24 Rue Victor Hugo, 69500 Bron',
    availability: 'Ouvert - Lun-Sam 8h-21h',
    hint: 'Deja utilise',
    distance: '1.2 km',
    distanceKm: 1.2,
  },
  {
    id: 'bellecour',
    name: 'Tabac Presse Bellecour',
    address: '5 Place Bellecour, 69002 Lyon',
    availability: 'Ouvert - Lun-Sam 7h-20h',
    hint: 'Proche du domicile',
    distance: '850 m',
    distanceKm: 0.85,
  },
  {
    id: 'centre',
    name: 'Pharmacie du Centre',
    address: '3 Rue Merciere, 69002 Lyon',
    availability: 'Ferme - Ouvre lundi 9h',
    hint: 'Proche du travail',
    distance: '1.8 km',
    distanceKm: 1.8,
  },
]

export const carriers = [
  { id: 'chronopost', name: 'Chronopost', delay: 'Livraison J+1 avant 13h', type: 'carrier' },
  { id: 'colissimo', name: 'Colissimo', delay: 'Livraison J+2', type: 'carrier' },
  { id: 'dhl', name: 'DHL Express', delay: 'Meme jour si commande avant 11h', type: 'carrier' },
]

export const internalCouriers = [
  { id: 'lucas', name: 'Lucas Dubois', availability: 'Disponible maintenant', zone: 'Lyon centre', type: 'internal' },
  { id: 'nadia', name: 'Nadia Leroy', availability: 'Disponible dans 25 min', zone: 'Bron / Villeurbanne', type: 'internal' },
  { id: 'mehdi', name: 'Mehdi Caron', availability: 'Tournee de l apres-midi', zone: 'Bordeaux', type: 'internal' },
]

const baseTrackingSteps = [
  {
    id: 'created',
    title: 'Demande creee',
    description: 'Le mode de livraison a ete transmis au commercant.',
    time: "Aujourd'hui - 09:00",
    status: 'done',
  },
  {
    id: 'validated',
    title: 'Demande validee',
    description: 'Le commercant a confirme la commande et lance la preparation.',
    time: "Aujourd'hui - 09:15",
    status: 'done',
  },
  {
    id: 'assigned',
    title: 'Livreur affecte',
    description: 'Lucas D. a recupere le colis aupres du commercant.',
    time: "Aujourd'hui - 10:30",
    status: 'done',
  },
  {
    id: 'notified',
    title: 'Notification envoyee',
    description: 'Le client a ete informe par email et SMS.',
    time: "Aujourd'hui - 10:32",
    status: 'done',
  },
  {
    id: 'transit',
    title: 'En cours de livraison',
    description: 'Le livreur est en route vers l adresse de livraison.',
    time: "Aujourd'hui - 12:22",
    status: 'active',
  },
  {
    id: 'received',
    title: 'Confirmation de reception',
    description: 'Le client confirmera la reception apres remise du colis.',
    time: 'Estime - 14h30',
    status: 'pending',
  },
]

const makeSteps = (overrides = {}) =>
  baseTrackingSteps.map((step) => ({
    ...step,
    ...(overrides[step.id] ?? {}),
  }))

export const deliveries = [
  {
    id: '042',
    fullId: 'LIV-2025-042',
    shortId: '#042',
    order: 'CMD-2025-042',
    customer: 'Marie Dupont',
    merchant: 'Mon Commerce',
    merchantAddress,
    address: '12 Rue des Fleurs, 69001 Lyon',
    city: 'Lyon',
    destinationType: 'home',
    destinationLabel: 'A domicile',
    handlingType: 'internal',
    handlingLabel: 'Livreur interne',
    distanceKm: 2.4,
    status: 'En cours',
    statusLabel: 'En transit',
    tone: 'blue',
    eta: '14h30',
    updatedAt: 'il y a 8 min',
    completedDaysAgo: null,
    progress: 62,
    needsAssignment: false,
    assignedId: 'lucas',
    items: [
      { name: 'Robe ete lin', quantity: 1, vignette: '👗', color: '#6C8EFF' },
      { name: 'Ceinture cuir', quantity: 1, vignette: '👜', color: '#A78BFA' },
    ],
    courier: {
      name: 'Lucas Dubois',
      shortName: 'Lucas D.',
      rating: '4.9',
      deliveries: 234,
      distance: '2.4 km',
    },
    assignmentOptions: {
      internal: [
        { id: 'lucas', distanceKm: 2.4, eta: '35 min' },
        { id: 'nadia', distanceKm: 3.8, eta: '50 min' },
      ],
      carrier: [
        { id: 'chronopost', distanceKm: 2.4, eta: 'J+1' },
        { id: 'colissimo', distanceKm: 2.4, eta: 'J+2' },
      ],
    },
    trackingSteps: makeSteps(),
  },
  {
    id: '041',
    fullId: 'LIV-2025-041',
    shortId: '#041',
    order: 'CMD-2025-041',
    customer: 'Jean Martin',
    merchant: 'Mon Commerce',
    merchantAddress,
    address: 'Point relais - Carrefour City Bron',
    relayId: 'bron',
    city: 'Bron',
    destinationType: 'relay',
    destinationLabel: 'Point relais',
    handlingType: 'internal',
    handlingLabel: 'Livreur interne',
    distanceKm: 1.2,
    status: 'Livre',
    statusLabel: 'Livre en point relais',
    tone: 'green',
    eta: 'Livre a 11h42',
    updatedAt: 'il y a 12 min',
    completedDaysAgo: 0,
    progress: 100,
    needsAssignment: false,
    assignedId: 'nadia',
    items: [
      { name: 'Chaussures running', quantity: 1, vignette: '👟', color: '#34D399' },
    ],
    courier: {
      name: 'Nadia Leroy',
      shortName: 'Nadia L.',
      rating: '4.8',
      deliveries: 181,
      distance: '1.2 km',
    },
    assignmentOptions: {
      internal: [
        { id: 'nadia', distanceKm: 1.2, eta: '25 min' },
        { id: 'lucas', distanceKm: 4.1, eta: '55 min' },
      ],
      carrier: [
        { id: 'colissimo', distanceKm: 1.2, eta: 'J+2' },
      ],
    },
    trackingSteps: makeSteps({
      transit: {
        status: 'done',
        title: 'Depot au point relais',
        description: 'Nadia L. a depose le colis au point relais choisi.',
        time: "Aujourd'hui - 11:32",
      },
      received: {
        status: 'done',
        title: 'Disponible au retrait',
        description: 'Le colis est disponible chez Carrefour City Bron.',
        time: "Aujourd'hui - 11:42",
      },
    }),
  },
  {
    id: '040',
    fullId: 'LIV-2025-040',
    shortId: '#040',
    order: 'CMD-2025-040',
    customer: 'Sophie Bernard',
    merchant: 'Mon Commerce',
    merchantAddress,
    address: '45 Avenue Gambetta, 75020 Paris',
    city: 'Paris',
    destinationType: 'home',
    destinationLabel: 'A domicile',
    handlingType: null,
    handlingLabel: 'A affecter',
    distanceKm: 465,
    status: 'En attente',
    statusLabel: 'En attente transporteur',
    tone: 'amber',
    eta: 'Demain 13h',
    updatedAt: 'il y a 1h08',
    completedDaysAgo: null,
    progress: 45,
    needsAssignment: true,
    assignedId: null,
    items: [
      { name: 'Manteau hiver', quantity: 1, vignette: '🧥', color: '#F59E0B' },
      { name: 'Echarpe laine', quantity: 2, vignette: '🧣', color: '#6C8EFF' },
    ],
    courier: {
      name: 'Non affecte',
      shortName: '—',
      rating: '—',
      deliveries: 0,
      distance: '465 km',
    },
    assignmentOptions: {
      internal: [
        { id: 'mehdi', distanceKm: 465, eta: 'Hors zone' },
      ],
      carrier: [
        { id: 'chronopost', distanceKm: 465, eta: 'J+1 avant 13h' },
        { id: 'colissimo', distanceKm: 465, eta: 'J+2' },
        { id: 'dhl', distanceKm: 465, eta: 'Express' },
      ],
    },
    trackingSteps: makeSteps({
      assigned: {
        status: 'active',
        title: 'En attente d affectation',
        description: 'Le commercant doit choisir un livreur interne ou un transporteur tiers.',
        time: "Aujourd'hui - 11:14",
      },
      notified: {
        status: 'pending',
        title: 'Notification d expedition',
        description: 'Le client sera notifie quand le transporteur aura scanne le colis.',
        time: 'En attente',
      },
      transit: {
        status: 'pending',
        title: 'Transit transporteur',
        description: 'Le colis passera par le reseau du transporteur tiers.',
        time: 'Prevu ce soir',
      },
    }),
  },
  {
    id: '039',
    fullId: 'LIV-2025-039',
    shortId: '#039',
    order: 'CMD-2025-039',
    customer: 'Thomas Roux',
    merchant: 'Mon Commerce',
    merchantAddress,
    address: '8 Bd Victor Hugo, 06000 Nice',
    city: 'Nice',
    destinationType: 'home',
    destinationLabel: 'A domicile',
    handlingType: 'carrier',
    handlingLabel: 'Transporteur tiers',
    distanceKm: 472,
    status: 'Incident',
    statusLabel: 'Incident adresse',
    tone: 'red',
    eta: 'A reprogrammer',
    updatedAt: 'il y a 2h15',
    completedDaysAgo: null,
    progress: 70,
    needsAssignment: false,
    assignedId: 'dhl',
    items: [
      { name: 'Tablette 10"', quantity: 1, vignette: '📱', color: '#A78BFA' },
    ],
    courier: {
      name: 'DHL Express',
      shortName: 'DHL',
      rating: 'Express',
      deliveries: 0,
      distance: '472 km',
    },
    assignmentOptions: {
      internal: [],
      carrier: [
        { id: 'dhl', distanceKm: 472, eta: 'Express' },
        { id: 'chronopost', distanceKm: 472, eta: 'J+1' },
      ],
    },
    trackingSteps: makeSteps({
      transit: {
        status: 'active',
        title: 'Incident de livraison',
        description: 'Le transporteur signale une adresse introuvable. Une action est requise.',
        time: "Aujourd'hui - 12:07",
      },
      received: {
        status: 'pending',
        title: 'Nouvelle tentative',
        description: 'La livraison sera reprogrammee apres correction des informations.',
        time: 'A definir',
      },
    }),
  },
  {
    id: '038',
    fullId: 'LIV-2025-038',
    shortId: '#038',
    order: 'CMD-2025-038',
    customer: 'Claire Morel',
    merchant: 'Mon Commerce',
    merchantAddress,
    address: '3 Rue de la Paix, 33000 Bordeaux',
    city: 'Bordeaux',
    destinationType: 'home',
    destinationLabel: 'A domicile',
    handlingType: 'internal',
    handlingLabel: 'Livreur interne',
    distanceKm: 432,
    status: 'Livre',
    statusLabel: 'Reception confirmee',
    tone: 'green',
    eta: 'Livre hier 11h15',
    updatedAt: 'hier',
    completedDaysAgo: 1,
    progress: 100,
    needsAssignment: false,
    assignedId: 'mehdi',
    items: [
      { name: 'Kit soin visage', quantity: 1, vignette: '🧴', color: '#34D399' },
      { name: 'Creme hydratante', quantity: 2, vignette: '✨', color: '#6C8EFF' },
    ],
    courier: {
      name: 'Mehdi Caron',
      shortName: 'Mehdi C.',
      rating: '4.7',
      deliveries: 148,
      distance: '432 km',
    },
    assignmentOptions: {
      internal: [
        { id: 'mehdi', distanceKm: 432, eta: 'Tournee regionale' },
      ],
      carrier: [
        { id: 'chronopost', distanceKm: 432, eta: 'J+1' },
      ],
    },
    trackingSteps: makeSteps({
      transit: {
        status: 'done',
        title: 'Livraison effectuee',
        description: 'Mehdi C. a remis le colis a Claire Morel.',
        time: 'Hier - 11:12',
      },
      received: {
        status: 'done',
        title: 'Reception confirmee',
        description: 'La reception a ete confirmee par le client.',
        time: 'Hier - 11:15',
      },
    }),
  },
  {
    id: '034',
    fullId: 'LIV-2025-034',
    shortId: '#034',
    order: 'CMD-2025-034',
    customer: 'Amine Petit',
    merchant: 'Mon Commerce',
    merchantAddress,
    address: '19 Rue Massena, 06000 Nice',
    city: 'Nice',
    destinationType: 'relay',
    destinationLabel: 'Point relais',
    handlingType: 'internal',
    handlingLabel: 'Livreur interne',
    distanceKm: 472,
    status: 'Livre',
    statusLabel: 'Archivee',
    tone: 'green',
    eta: 'Livre il y a 16j',
    updatedAt: 'il y a 16j',
    completedDaysAgo: 16,
    progress: 100,
    needsAssignment: false,
    assignedId: 'nadia',
    items: [
      { name: 'Livre cuisine', quantity: 1, vignette: '📚', color: '#F59E0B' },
    ],
    courier: {
      name: 'Nadia Leroy',
      shortName: 'Nadia L.',
      rating: '4.8',
      deliveries: 181,
      distance: '472 km',
    },
    assignmentOptions: {
      internal: [
        { id: 'nadia', distanceKm: 472, eta: 'Tournee regionale' },
      ],
      carrier: [
        { id: 'colissimo', distanceKm: 472, eta: 'J+2' },
      ],
    },
    trackingSteps: makeSteps({
      transit: {
        status: 'done',
        title: 'Depot au point relais',
        description: 'Le colis a ete depose au point relais choisi.',
        time: '23 juin - 10:40',
      },
      received: {
        status: 'done',
        title: 'Reception confirmee',
        description: 'Le retrait a ete confirme par le client.',
        time: '23 juin - 18:05',
      },
    }),
  },
]

export const currentDelivery = deliveries[0]
export const trackingSteps = currentDelivery.trackingSteps
export const recentDeliveries = deliveries

export const weeklyStats = [
  { day: 'Lun', internal: 60, external: 40 },
  { day: 'Mar', internal: 90, external: 55 },
  { day: 'Mer', internal: 70, external: 80 },
  { day: 'Jeu', internal: 110, external: 60 },
  { day: 'Ven', internal: 85, external: 45 },
  { day: 'Sam', internal: 50, external: 30 },
  { day: 'Dim', internal: 30, external: 20 },
]

export const merchantActivity = [
  {
    id: '041-delivered',
    deliveryId: '041',
    text: '#041 livre en point relais',
    time: 'Il y a 12 min',
    tone: 'green',
  },
  {
    id: '042-assigned',
    deliveryId: '042',
    text: 'Lucas D. a pris en charge #042',
    time: 'Il y a 34 min',
    tone: 'blue',
  },
  {
    id: '040-pending',
    deliveryId: '040',
    text: '#040 en attente d affectation (465 km)',
    time: 'Il y a 1h08',
    tone: 'amber',
  },
  {
    id: '039-incident',
    deliveryId: '039',
    text: 'Incident signale sur #039',
    time: 'Il y a 2h15',
    tone: 'red',
  },
]

export function getAssigneeName(delivery) {
  if (!delivery.assignedId) return null
  const courier = internalCouriers.find((item) => item.id === delivery.assignedId)
  if (courier) return courier.name
  const carrier = carriers.find((item) => item.id === delivery.assignedId)
  return carrier?.name ?? null
}

export function formatMerchantMode(delivery) {
  return `${delivery.destinationLabel} · ${delivery.handlingLabel}`
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km >= 100) return `${km} km`
  return `${km.toFixed(1).replace('.0', '')} km`
}
