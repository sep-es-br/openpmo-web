import { TypePropertyModelEnum } from './../enums/TypePropertyModelEnum';
export const FilterDataviewPropertiesEntity = {
  offices: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'fullName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
  ],
  plans: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'fullName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
    { label: 'start', apiValue: 'start', type: TypePropertyModelEnum.DateModel },
    { label: 'finish', apiValue: 'finish', type: TypePropertyModelEnum.DateModel },
  ],
  officePermissions: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'email', apiValue: 'email', type: TypePropertyModelEnum.TextModel },
    {
      label: 'level', apiValue: 'level', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [{ label: 'edit', value: 'EDIT' }, { label: 'read', value: 'READ' }]
    }
  ],
  planPermissions: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'email', apiValue: 'email', type: TypePropertyModelEnum.TextModel },
    {
      label: 'level', apiValue: 'level', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [{ label: 'edit', value: 'EDIT' }, { label: 'read', value: 'READ' }]
    }
  ],
  organizations: [
    {
      label: 'sector', apiValue: 'sector', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [{ label: 'public', value: 'public' }, { label: 'private', value: 'private' }, { label: 'third', value: 'third' }]
    },
    { label: 'businessName', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'socialName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
    { label: 'address', apiValue: 'address', type: TypePropertyModelEnum.TextModel },
    { label: 'contactEmail', apiValue: 'contactEmail', type: TypePropertyModelEnum.TextModel },
    { label: 'phoneNumber', apiValue: 'phoneNumber', type: TypePropertyModelEnum.TextModel },
    { label: 'website', apiValue: 'website', type: TypePropertyModelEnum.TextModel },
  ],
  strategies: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'fullName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
  ],
  stakeholders: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'fullName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
    {
      label: 'sector', apiValue: 'sector', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [{ label: 'public', value: 'public' }, { label: 'private', value: 'private' }, { label: 'third', value: 'third' }]
    },
    { label: 'address', apiValue: 'address', type: TypePropertyModelEnum.TextModel },
    { label: 'contactEmail', apiValue: 'contactEmail', type: TypePropertyModelEnum.TextModel },
    { label: 'phoneNumber', apiValue: 'phoneNumber', type: TypePropertyModelEnum.TextModel },
    { label: 'administrator', apiValue: 'administrator', type: TypePropertyModelEnum.ToggleModel },
    {
      label: 'level', apiValue: 'level', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [{ label: 'edit', value: 'edit' }, { label: 'read', value: 'read' }],
    },
    {
      label: 'role', apiValue: 'role', type: TypePropertyModelEnum.SelectionModel
    },
  ],
  domains: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'fullName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
  ],
  localities: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'fullName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
    { label: 'latitude', apiValue: 'latitude', type: TypePropertyModelEnum.TextModel },
    { label: 'longitude', apiValue: 'longitude', type: TypePropertyModelEnum.TextModel },
    {
      label: 'type', apiValue: 'type', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [
        { label: 'country', value: 'country' },
        { label: 'region', value: 'region' },
        { label: 'state', value: 'state' },
        { label: 'city', value: 'city' },
        { label: 'district', value: 'district' }
      ]
    }
  ],
  unitMeasures: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'fullName', apiValue: 'fullName', type: TypePropertyModelEnum.TextModel },
    { label: 'precistion', apiValue: 'precision', type: TypePropertyModelEnum.IntegerModel },
  ],
  risks: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'description', apiValue: 'description', type: TypePropertyModelEnum.TextModel },
    {
      label: 'importance', apiValue: 'importance', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [
        { label: 'high', value: 'high' },
        { label: 'medium', value: 'medium' },
        { label: 'low', value: 'low' }]
    },
    {
      label: 'nature', apiValue: 'nature', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [
        { label: 'threat', value: 'threat' },
        { label: 'opportunity', value: 'opportunity' }]
    },
    {
      label: 'status', apiValue: 'status', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [
        { label: 'open', value: 'open' },
        { label: 'happened', value: 'happened' },
        { label: 'notGonnaHappen', value: 'notGonnaHappen' }]
    },
    { label: 'likelyToHappenFrom', apiValue: 'likelyToHappenFrom', type: TypePropertyModelEnum.DateModel },
    { label: 'likelyToHappenTo', apiValue: 'likelyToHappenTo', type: TypePropertyModelEnum.DateModel },
  ],
  issues: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'description', apiValue: 'description', type: TypePropertyModelEnum.TextModel },
    {
      label: 'importance', apiValue: 'importance', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [
        { label: 'high', value: 'high' },
        { label: 'medium', value: 'medium' },
        { label: 'low', value: 'low' }]
    },
    {
      label: 'nature', apiValue: 'nature', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [
        { label: 'problem', value: 'problem' },
        { label: 'benefit', value: 'benefit' }]
    },
    {
      label: 'status', apiValue: 'status', type: TypePropertyModelEnum.SelectionModel,
      possibleValues: [
        { label: 'open', value: 'open' },
        { label: 'closed', value: 'closed' }]
    },
  ],
  processes: [
    { label: 'name', apiValue: 'name', type: TypePropertyModelEnum.TextModel },
    { label: 'subject', apiValue: 'subject', type: TypePropertyModelEnum.TextModel },
    { label: 'currentOrganization', apiValue: 'currentOrganization', type: TypePropertyModelEnum.TextModel },
    { label: 'note', apiValue: 'note', type: TypePropertyModelEnum.TextModel },
    { label: 'priority', apiValue: 'priority', type: TypePropertyModelEnum.ToggleModel },
  ],
};
