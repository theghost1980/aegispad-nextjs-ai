## The present file is to help about useful commands, procedures for usual tasks:

### Checking missing keys in locales:

```
npx i18n-check -s en-US -l src/messages --format i18next --only missingKeys
```

### Checking wrong keys in locales:

```
npx i18n-check -s en-US -l src/messages --format i18next --only invalidKeys
```

### Cleanup process in vscode using regex in search:

```
^\s*//(?!(?:TODO|\sTODO)).*
```

This will find vene TODOs to manually do the cleanup process file by file.

```
\/\/(?!\s*TODO\b).*
```

This will search especifics like //[Comment] or // [Comments]

## Parameters app related

### comment_options:

- commentOptions.percent_hbd -> 100% HBD (50/50 HBD/HP) - esto es 10000 para 100%
- KeychainHelper.requestPost:
  - hiveUsername, -> author
  - articleTitle, -> title
  - articleContent, -> body
  - parentPermlink, -> parent_permlink (categoría principal)
  - "", -> parent_author (vacío para post principal)
  - JSON.stringify(jsonMetadata), -> json_metadata
  - permlink, -> permlink
  - commentOptions, -> comment_options
- posthog.capture:
  - transaction_id: response.result?.id, => Asumiendo que Keychain devuelve el ID de la tx
