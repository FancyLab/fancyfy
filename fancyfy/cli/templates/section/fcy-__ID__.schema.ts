import { defineSection, colorScheme } from '../../ds/schema/index.js';

export default defineSection({
  name: 'Fancyfy — __PASCAL__',
  class: 'fcy-__ID__',
  tag: 'section',
  settings: [
    { type: 'header', content: 'General' },
    colorScheme({ default: 'scheme-1' }),
    {
      type: 'text',
      id: 'heading',
      label: 'Heading',
      default: '__PASCAL__',
    },
  ],
  presets: [
    {
      name: 'Fancyfy — __PASCAL__',
      settings: { heading: '__PASCAL__' },
    },
  ],
});
