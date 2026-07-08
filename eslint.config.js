const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
  {
    // Ignore node_modules, uploads, locks, and this config file from browser rules
    ignores: [
      '**/node_modules/**',
      'backend/uploads/**',
      'package-lock.json',
      'backend/package-lock.json',
      'eslint.config.js',
    ],
  },
  js.configs.recommended,
  {
    // Backend Node.js files
    files: ['backend/**/*.js', 'backend/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Ignore unused vars/args/caught-errors when prefixed with underscore
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'no-undef': 'error',
    },
  },
  {
    // Frontend Browser JS files
    files: ['frontend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // Cross-file helpers defined in api.js but used in other files
        requireAuth: 'readonly',
        renderNavbar: 'readonly',
        renderSidebar: 'readonly',
        renderAvatar: 'readonly',
        timeAgo: 'readonly',
        api: 'readonly',
        showToast: 'readonly',
        // Cross-file helpers defined in directory.js / other page scripts
        renderPagination: 'readonly',
        getInitials: 'readonly',
        // Functions assigned to window.xxx or used in HTML onclick= attributes
        openChat: 'readonly',
        sendRequest: 'readonly',
        toggleMobile: 'readonly',
        logout: 'readonly',
        toggleTheme: 'readonly',
        goToPage: 'readonly',
      },
    },
    rules: {
      // Ignore unused vars/args/caught errors prefixed with _ OR functions called from HTML
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          // Functions defined in api.js and called from HTML onclick= are not "unused"
          // even though ESLint can't see HTML. Suppress those known globals.
          varsIgnorePattern:
            '^(_|showToast|timeAgo|requireAuth|renderNavbar|renderSidebar|renderAvatar|toggleMobile|logout|toggleTheme|getInitials|renderPagination|openChat|sendRequest|goToPage)',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      // Downgrade to warn — cross-file globals used in HTML onclick= can't be statically traced
      'no-undef': 'warn',
      // api.js defines globals that other files reference — no-redeclare would false-positive
      'no-redeclare': 'off',
    },
  },
];
