# YAML File Validation

This action is used to validate a YAML file with a custom [schema](#schema-file).

## Index <!-- omit in toc -->

- [Inputs](#inputs)
- [Outputs](#outputs)
- [Usage Examples](#usage-examples)
- [Schema File](#schema-file)
- [Recompiling](#recompiling)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Inputs

| Parameter          | Is Required | Description                                                                                                          |
| ------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `yaml-file-path`   | true        | The path of the yaml file to validate.                                                                               |
| `schema-file-path` | true        | The schema file used to validate yaml file.  If omitted or set to "SAM", the IM-OPEN SAM schema format will be used. |

## Outputs

| Parameter            | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `validation-outcome` | The results of the file validation. Will be success, warning, or failed. |

## Usage Examples

```yml
jobs:
  validate-files:
    runs-on: ubuntu-20.04
    steps:
      - uses: actions/checkout@v2

      - name: Test SAM YAML
        id: sam-test
        uses: im-open/yaml-file-validation@v1.0.1
        with:
          yaml-file-path: ./sam.yaml
          # schema-file-path: 'SAM' <-- If left undefined or set to 'SAM' the IM-OPEN SAM schema format will be used
        continue-on-error: true

      - name: Output sam
        run: |
          echo "SAM Results: ${{ steps.sam-test.outputs.validation-outcome }}"
```

## Schema File

This action was designed to validate a yaml file particular to IM-OPEN's needs. The [SAM.json] schema file will be used when `SAM` or no `schema-file` is specified.

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

## Recompiling

If changes are made to the action's code in this repository, or its dependencies, you will need to re-compile the action.

```sh
# Installs dependencies and bundles the code
npm run build

# Bundle the code (if dependencies are already installed)
npm run bundle
```

These commands utilize [esbuild](https://esbuild.github.io/getting-started/#bundling-for-node) to bundle the action and
its dependencies into a single file located in the `dist` folder.

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/master/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2021, Extend Health, LLC. Code released under the [MIT license](LICENSE).

<!-- LINKS -->
[SAM.json]: ./src/sam.json