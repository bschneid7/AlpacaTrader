import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['dist'] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,js}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-console': 'off',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "CallExpression[callee.property.name=/^(get|post|put|delete|patch|use|all)$/] > Identifier[name='requireUser']",
                    message: 'requireUser must be called with parentheses: requireUser() or requireUser(roles)',
                },
            ],
        },
    },
)

