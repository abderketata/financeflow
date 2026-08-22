/**
 * Rafraîchissement des données au clic sur un onglet.
 *
 * Portage de `apps/web/src/app/businessNavigation.ts` : sur le web, chaque clic
 * dans le menu commence par `queryClient.removeQueries()` sur les clés de la
 * route visée, ce qui garantit un appel réseau à chaque navigation plutôt qu'un
 * affichage du cache. Les données métier changent en permanence (échéances,
 * statuts, alertes), un cache servi silencieusement afficherait un état périmé.
 *
 * Une différence avec le web : là-bas `removeQueries` suffit parce que la route
 * est en plus remontée (`<Outlet key={businessRefreshKey}>`), et c'est ce remontage
 * qui relance la requête. Ici les écrans d'onglet restent montés, une simple
 * suppression du cache ne garantirait donc aucun appel réseau : on utilise
 * `resetQueries`, qui remet la requête à son état initial ET relance les
 * observateurs actifs. L'écran repart de son indicateur de chargement, comme
 * sur le web.
 */
export const tabRefreshQueries: Record<string, readonly unknown[][]> = {
  Dashboard: [['mobile-dashboard-dataset'], ['settings']],
  PaymentItemList: [['payment-items']],
  AlertList: [['mobile-alerts']],
  ClientList: [['clients']],
  // Onglet « Profil » : les informations viennent de la session, pas d'une requête.
  Profile: [],
};

/** Écrans de la pile, atteints hors barre d'onglets. */
export const stackRefreshQueries: Record<string, readonly unknown[][]> = {
  ClientList: [['clients']],
  PaymentItemList: [['payment-items']],
  TransactionList: [['transactions']],
  AlertList: [['mobile-alerts']],
  Settings: [['settings']],
};
