## The present file is to help about useful commands, procedures for usual tasks:

### Checking missing keys in locales:

```
npx i18n-check -s en-US -l src/messages --format i18next --only missingKeys
```

### Checking wrong keys in locales:

```
npx i18n-check -s en-US -l src/messages --format i18next --only invalidKeys
```
