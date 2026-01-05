export enum ProjectStatus {
  ESTRUTURACAO = 'Estruturação',
  EXECUCAO = 'Execução',
  SUSPENSO = 'Suspenso',
  CANCELADO = 'Cancelado',
  CONCLUIDO = 'Concluído',
  PARALISADO = 'Paralisado',
  PLANEJAMENTO = 'Planejamento',
}

export enum DeliverableStatus {
  ACOES_PREPARATORIAS = 'Ações preparatórias',
  PROJETO_EM_ELABORACAO = 'Projeto em elaboração',
  PROJETO_ELABORADO = 'Projeto elaborado',
  CONVENIO_ASSINADO = 'Convênio assinado',
  EDITAL_PUBLICADO = 'Edital publicado',
  LICITACAO_CONCLUIDA = 'Licitação concluída',
  CONTRATO_ASSINADO = 'Contrato assinado',
  OBRA_EM_ANDAMENTO = 'Obra em andamento',
  SERVICO_EM_ANDAMENTO = 'Serviço em andamento',
  CONCLUIDA = 'Concluída',
  SUSPENSA = 'Suspensa',
  EM_EXECUCAO = 'Em execução',
  PARALISADO = 'Paralisado',
  EM_LICITACAO = 'Em licitação',
  CANCELADA = 'Cancelada',
  A_LICITAR = 'A licitar',
  A_CANCELAR = 'A cancelar',
}

export enum WorkpackStatusIcons {
  ESTRUTURACAO = 'Estruturação',
  EXECUCAO = 'Execução',
  CONCLUIDO = 'Concluído',
  PARALISADO = 'Paralisado',
  A_CANCELAR = 'A cancelar',
}

export interface WorkpackStatusConfig {
  icon: WorkpackStatusIcons;
  iconOrigin: 'img' | 'i';
  iconSrc: string;
  iconColor?: string;
}

export const WorkpackStatusMap = new Map<
  Array<ProjectStatus | DeliverableStatus>,
  WorkpackStatusConfig
>([
  [
    [
      ProjectStatus.ESTRUTURACAO,
      ProjectStatus.PLANEJAMENTO,
      DeliverableStatus.ACOES_PREPARATORIAS,
      DeliverableStatus.PROJETO_EM_ELABORACAO,
      DeliverableStatus.PROJETO_ELABORADO,
      DeliverableStatus.CONVENIO_ASSINADO,
      DeliverableStatus.EDITAL_PUBLICADO,
      DeliverableStatus.LICITACAO_CONCLUIDA,
      DeliverableStatus.CONTRATO_ASSINADO,
      DeliverableStatus.EM_LICITACAO,
      DeliverableStatus.A_LICITAR,
    ],
    {
      icon: WorkpackStatusIcons.ESTRUTURACAO,
      iconOrigin: 'img',
      iconSrc: '/assets/svg/cone.svg',
    },
  ],
  [
    [
      ProjectStatus.EXECUCAO,
      DeliverableStatus.OBRA_EM_ANDAMENTO,
      DeliverableStatus.SERVICO_EM_ANDAMENTO,
      DeliverableStatus.EM_EXECUCAO,
    ],
    {
      icon: WorkpackStatusIcons.EXECUCAO,
      iconOrigin: 'i',
      iconSrc: 'fas fa-play-circle',
      iconColor: '#00B89C',
    },
  ],
  [
    [ProjectStatus.CONCLUIDO, DeliverableStatus.CONCLUIDA],
    {
      icon: WorkpackStatusIcons.CONCLUIDO,
      iconOrigin: 'i',
      iconSrc: 'fas fa-check-circle',
      iconColor: '#0081C1',
    },
  ],
  [
    [
      ProjectStatus.PARALISADO,
      ProjectStatus.SUSPENSO,
      DeliverableStatus.PARALISADO,
      DeliverableStatus.SUSPENSA,
    ],
    {
      icon: WorkpackStatusIcons.PARALISADO,
      iconOrigin: 'i',
      iconSrc: 'fas fa-pause-circle',
      iconColor: '#FB7800',
    },
  ],
  [
    [
      ProjectStatus.CANCELADO,
      DeliverableStatus.CANCELADA,
      DeliverableStatus.A_CANCELAR,
    ],
    {
      icon: WorkpackStatusIcons.A_CANCELAR,
      iconOrigin: 'i',
      iconSrc: 'fas fa-times-circle',
      iconColor: '#FA4C4F',
    },
  ],
]);

type AnyStatus = ProjectStatus | DeliverableStatus;

const normalizeStatus = (status: AnyStatus | string): AnyStatus | undefined => {
  if (Object.values(ProjectStatus).includes(status as ProjectStatus)) {
    return status as ProjectStatus;
  }

  if (Object.values(DeliverableStatus).includes(status as DeliverableStatus)) {
    return status as DeliverableStatus;
  }

  if (status in ProjectStatus) {
    return ProjectStatus[status as keyof typeof ProjectStatus];
  }

  if (status in DeliverableStatus) {
    return DeliverableStatus[status as keyof typeof DeliverableStatus];
  }

  return undefined;
};

export const getWorkpackStatusConfigByStatus = (
  status: ProjectStatus | DeliverableStatus
): WorkpackStatusConfig => {
  const normalizedStatus = normalizeStatus(status);

  if (!normalizeStatus) return undefined;

  for (const [statusList, config] of WorkpackStatusMap.entries()) {
    if (statusList.includes(normalizedStatus)) {
      return config;
    }
  }

  return undefined;
};
