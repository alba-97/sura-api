module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', { allowDeclareFields: true }],
  ],
  env: {
    test: {
      plugins: [
        [
          'istanbul',
          { exclude: ['src/seeders/**', 'src/types/**', 'src/tests/**'] },
        ],
      ],
    },
  },
};
