module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: { name: '@storybook/react-webpack5', options: {} },
  docs: { autodocs: 'tag' },
  features: { interactionsDebugger: true },
};
