import { TypePropertModelEnum } from '../enums/TypePropertModelEnum';

/** Properties whose answers participate in weighted criterion scoring. */
export function hasPropertyWeight(type: string): boolean {
  return [
    TypePropertModelEnum.CriteriaSelectionModel,
    TypePropertModelEnum.ChallengeListModel,
    TypePropertModelEnum.SdgListModel
  ].includes(type as TypePropertModelEnum);
}
