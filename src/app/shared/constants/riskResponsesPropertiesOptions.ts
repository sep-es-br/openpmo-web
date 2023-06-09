export const RiskResponsesPropertiesOptions = {
  WHEN: {
    PRE_OCURRENCE: {label: 'preOcurrence', value: 'PRE_OCURRENCE'},
    POST_OCURRENCE: {label: 'postOcurrence', value: 'POST_OCURRENCE'}
  },
  STRATEGY: {
    NEGATIVE: {
      MITIGATE: {label: 'mitigate', value: 'MITIGATE'},
      TRANSFER: {label: 'transfer', value: 'TRANSFER'},
      ACCEPT: {label: 'accept', value: 'ACCEPT'},
      ELIMINATE: {label: 'eliminate', value: 'ELIMINATE'},
      SCALE: {label: 'scale', value: 'SCALE'}

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
