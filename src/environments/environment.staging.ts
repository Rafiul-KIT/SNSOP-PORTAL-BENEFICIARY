export const environment = {
  production: false,
  env: 'dev',
  useHash: true,
  domain: 'https://newmis.southsudansafetynet.info',
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://newmis.southsudansafetynet.info/trial/master',
    masterSettings: 'https://newmis.southsudansafetynet.info/trial/master/#/user-management/users',
    surveyCTO: 'https://newmis.southsudansafetynet.info/trial/master/#/cto-dashboard',
    mNe: 'https://newmis.southsudansafetynet.info/trial/master/#/monitoring-evaluation/beneficiary-enrolment-summary',
    beneficiary: 'https://newmis.southsudansafetynet.info/trial/beneficiary',
    payment: 'https://newmis.southsudansafetynet.info/trial/payment',
    grm: 'https://newmis.southsudansafetynet.info/trial/grm',
    report: 'https://newmis.southsudansafetynet.info/trial/report',
    economicOpportunities: 'https://newmis.southsudansafetynet.info/trial/master/#/economic-opportunities/dashboard'
  },
    authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  reportApi: 'https://devgwapp.southsudansafetynet.info/mis_report/',
  cookie_name:'mis_ta'
};
