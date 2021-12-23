export const RiskResponsesPropertiesOptions = {
  WHEN: {
    PRE_OCURRENCE: {label: 'preOcurrence', value: 'PRE_OCURRENCE'},
    POST_OCURRENCE: {label: 'postOcurrence', value: 'POST_OCURRENCE'}
  },
  STRATEGY: {
    NEGATIVE: {
      AVOIDANCE_ELIMINATION: {label: 'avoidanceElimination', value: 'AVOIDANCE_ELIMINATION'},
      TRANSFER: {label: 'transfer', value: 'TRANSFER'},
      MITIGATION: {label: 'mitigation', value: 'MITIGATION'},
      ACCEPTANCE: {label: 'acceptance', value: 'ACCEPTANCE'}
    },
    POSITIVE: {
      EXPLOIT: {label: 'exploite', value: 'EXPLOIT'},
      ENHANCE: {label: 'enhance', value: 'ENHANCE'},
      SHARE: {label: 'share', value: 'SHARE'},
      ACCEPT: {label: 'accept', value: 'ACCEPT'}
    }
  },
  STATUS: {
    WAITING_TRIGGER: {label: 'waitingTrigger', value: 'WAITING_TRIGGER'},
    RUNNING: {label: 'running', value: 'RUNNING'},
    DONE: {label: 'done', value: 'DONE'},
    CANCELLED: {label: 'cancelled', value: 'CANCELLED'},
  }
}
