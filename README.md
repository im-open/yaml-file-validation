# YAML File Validation

This action is used to validate a YAML file with a custom [schema](#schema-file).

## Index <!-- omit in toc -->

- [Inputs](#inputs)
  - [Output JSON Example](#output-json-example)
- [Outputs](#outputs)
- [Usage Examples](#usage-examples)
- [Schema File](#schema-file)
- [Contributing](#contributing)
  - [Recompiling](#recompiling-manually)
  - [Incrementing the Version](#incrementing-the-version)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Inputs

| Parameter                                                 | Is Required | Description                                                                                                                                    |
| --------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `yaml-file-path`                                          | true        | The path of the yaml file to validate.                                                                                                         |
| `schema-file-path`                                        | false       | The schema file used to validate yaml file.  If omitted or set to "SAM", the IM-OPEN SAM schema format will be used.                           |
| `log-level`                                               | false       | The severity level of information to include the action's logging. Accepted values are information, warning, and failure.                      |
| <font size="1" style="super">&dagger;</font>`output-json` | false       | Specify whether or not to output a json document with the results. Accepts true or false. It will only produce an output if no failures occur. |
<font size="1">&dagger;</font> _Output will always return a json document with a documents array attribute. (See [Output Example](#output-json-example))_

### Output JSON Example

```json
{
  documents: [<document1>, <document2>, <document3>, ...]
}
```

## Outputs

| Parameter            | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `validation-outcome` | The results of the file validation. Will be success, warning, or failed. |
| `json-output`        | A json conversion of the yaml file.                                      |

## Usage Examples

```yml
jobs:
  validate-files:
    runs-on: ubuntu-20.04
    steps:
      - uses: actions/checkout@v3

      - name: Test SAM YAML
        id: sam-test
        # You may also reference the major or major.minor version
        uses: im-open/yaml-file-validation@v1.2.3
        with:
          yaml-file-path: ./sam.yaml
          # schema-file-path: 'SAM' <-- If left undefined or set to 'SAM' the IM-OPEN SAM schema format will be used
        continue-on-error: true
        log-level: 'failure'

      - name: Output sam
        run: |
          echo "SAM Results: ${{ steps.sam-test.outputs.validation-outcome }}"
```

## Schema File

This action was designed to validate a yaml file particular to IM-OPEN's needs. The [`SAM.json`] schema file will be used when `SAM` or no `schema-file` is specified. This is a  [sample `SAM.YAML`] file that uses the `SAM.json` file for validation. This is a [minimal sample `SAM.YAML`] file that would bee needed to pass the 'SAM' validation.

The syntax for creating a custom schema file is essentially a json formatted file which minimally describes a field if it's `REQUIRED` and child elements, if any.  Possible required values are `required`, `warning`, and `info`. Elements that are lists can be built using the `LISTOF` field.

This is an example schema definition file:

```json
{
    "first": "required",
    "last": "required",
    "middle": "info",
    "ag": "warning",
    "akas": {
        "REQUIRED": "info",
        "LISTOF": {
            "name": "info"
        }
    }
}
```

This corresponding YAML file would validate successfully based on the definition file:

```yaml
first: 'John'
middle: 'Jacob'
last: 'Jingle-Heimer-Schmidt'
akas:
  - name: 'John'
  - name: 'Jake'
  - name: 'My name, too!'
  - name: 'Da-da-da-da-da-da-da'
```

For lists elements without name keys this specification could be made:

```json
...
  "groceries": {
    "REQUIRED": "required",
    "LISTOF": { }
  }
...
```

This YAML element would then become valid:

```yaml
...
  groceries:
    - eggs
    - milk
    - bacon
...
```

It is important to note that the validator will not be able to validate the list format or item count in an unstructured list. It will however ensure that the `groceries` node exists, but it can have zero or more items in the list.

## Contributing

When creating new PRs please ensure:

1. For major or minor changes, at least one of the commit messages contains the appropriate `+semver:` keywords listed under [Incrementing the Version](#incrementing-the-version).
1. The action code does not contain sensitive information.

When a pull request is created and there are changes to code-specific files and folders, the build workflow will run and it will recompile the action and push a commit to the branch if the PR author has not done so. The usage examples in the README.md will also be updated with the next version if they have not been updated manually. The following files and folders contain action code and will trigger the automatic updates:

- action.yml
- package.json
- package-lock.json
- src/\*\*
- dist/\*\*

There may be some instances where the bot does not have permission to push changes back to the branch though so these steps should be done manually for those branches. See [Recompiling Manually](#recompiling-manually) and [Incrementing the Version](#incrementing-the-version) for more details.

### Recompiling Manually

If changes are made to the action's code in this repository, or its dependencies, the action can be re-compiled by running the following command:

```sh
# Installs dependencies and bundles the code
npm run build

# Bundle the code (if dependencies are already installed)
npm run bundle
```

These commands utilize [esbuild](https://esbuild.github.io/getting-started/#bundling-for-node) to bundle the action and
its dependencies into a single file located in the `dist` folder.

### Incrementing the Version

Both the build and PR merge workflows will use the strategies below to determine what the next version will be.  If the build workflow was not able to automatically update the README.md action examples with the next version, the README.md should be updated manually as part of the PR using that calculated version.

This action uses [git-version-lite] to examine commit messages to determine whether to perform a major, minor or patch increment on merge.  The following table provides the fragment that should be included in a commit message to active different increment strategies.
| Increment Type | Commit Message Fragment                     |
| -------------- | ------------------------------------------- |
| major          | +semver:breaking                            |
| major          | +semver:major                               |
| minor          | +semver:feature                             |
| minor          | +semver:minor                               |
| patch          | _default increment type, no comment needed_ |

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/master/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2021, Extend Health, LLC. Code released under the [MIT license](LICENSE).

<!-- LINKS -->
[git-version-lite]: https://github.com/im-open/git-version-lite
[`SAM.json`]: ./src/sam.json
[sample `SAM.YAML`]: ./sample_sam.yaml
[minimal sample `SAM.YAML`]: ./sample_sam_minimal.yaml
