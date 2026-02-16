# Code-line-deco Extension For Quarto

This is a plugin to decorate ranges in a line in a code block with:

- shade
- frame
- underline
- bold
- font color
- background color

## Installing

```bash
quarto add herosi/code-line-deco
```

This will install the extension under the `_extensions` subdirectory.
If you're using version control, you will want to check in this directory.

## Using

Include this plugin as shown below in the front matter of a qmd or `_quarto.yaml`.

```yaml
revealjs-plugins:
  - code-folder
```

Here is the source code for a minimal example: [example.qmd](example.qmd). View an example presentation at [example.html](demo/example.html).