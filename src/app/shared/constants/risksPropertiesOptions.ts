export const RisksPropertiesOptions = {
  importance: {
    HIGH: { label: 'high', value: 'HIGH', color: '#C0504D'},
    MEDIUM: { label: 'medium', value: 'MEDIUM', color: '#ED7D31'},
    LOW: { label: 'low', value: 'LOW', color: 'FFC000'}
  },
  nature: {
    THREAT: {label: 'threat', value: 'THREAT'},
    OPPORTUNITY: {label: 'opportunity', value: 'OPPORTUNITY'}
  },
  status: {
    OPEN: { label: 'open', value: 'OPEN', icon: 'app-icon risk'},
    NOT_GONNA_HAPPEN: { label: 'notGonnaHappen', value: 'NOT_GONNA_HAPPEN', icon: 'app-icon not_gonna_happen'},
    HAPPENED: { label: 'happened', value: 'HAPPENED', icon: 'app-icon risk_happened'},
  }
}