# Scénarios automatisés RelayFlow

Lancer tous les contrôles avec :

```text
npm test
```

Les scénarios couvrent actuellement :

- la validation des données d'inscription ;
- l'attribution au manager de la ville, avec visibilité par tous les managers lorsqu'aucun manager de ville n'existe ;
- le refus de connexion tant que le dossier n'est pas validé ;
- l'activation du compte après acceptation par un manager ;
- le retrait immédiat d'une demande de la liste après son traitement ;
- l'inscription d'un livreur, l'acceptation d'une livraison, le retrait puis la remise au destinataire ;
- le refus d'une remise tentée par un autre livreur ;
- l'actualisation des factures et bons dans les chiffres financiers ;
- le calcul détaillé du coût commerçant, du gain livreur et de la marge plateforme ;
- la gratuité des livraisons propres et le gel du tarif dans chaque livraison ;
- les lignes de facture et de bon de paiement, ainsi que le refus des périodes facturées deux fois ;
- l'envoi des notifications financières au commerçant et au livreur concernés ;
- l'obligation d'écrire un avis avec une note et l'interdiction des doublons ;
- la messagerie interne des incidents, ses destinataires autorisés et les réponses au manager ;
- l'isolation des conversations pour les comptes non concernés ;
- la lecture des messages et les notifications associées ;
- la cohérence du jeu de données : inscriptions, livraisons, statuts, modes et conversations ;
- les zones de livraison, partenariats et notifications persistantes.
- la ponctualité calculée avec l’heure réelle de remise et l’échéance prévue ;
- la persistance du rayon de recherche du livreur et l’unicité des références ;
- la cohérence des comptes rattachés aux demandes d’adhésion d’exemple.
- l’ordre chronologique des livraisons, incidents, messages et décisions ;
- l’émission des factures et bons uniquement après la période concernée.
- la prévisualisation financière sans écriture en base ;
- le contrôle du rôle et de la juridiction avant l’enregistrement d’un paiement.

Chaque régression métier doit recevoir un nouveau test dans ce dossier avant sa correction.
