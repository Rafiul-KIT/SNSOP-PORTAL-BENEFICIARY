export const environment = {
  production: false,
  env: 'dev',
  useHash: true,
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  modelApi: 'https://devmismodel.southsudansafetynet.info/',
  portals: {
    master: '/trial/master',
    UnderConstruction: '/trial/master/#/under-construction',
    masterSettings: '/trial/master/#/user-management/users',
    surveyCTO: '/trial/master/#/cto-dashboard',
    mNe: '/trial/master/#/monitoring-evaluation/beneficiary-enrolment-summary',
    beneficiary: '/trial/beneficiary',
    payment: '/trial/payment',
    grm: '/trial/grm',
    report: '/trial/master/#/home/metabase',
    economicOpportunities: '/trial/master/#/economic-opportunities/dashboard',
    dms: '/trial/dms/',

  },
    authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  reportApi: 'https://devgwapp.southsudansafetynet.info/mis_report/',
  cookie_name:'mis_ta'
};
