# KinoAtpClient

This package provides custom a custom Smart Cell for parsing TPTP syntax (raw
formulas or TH0 problems) into the data structures of `shot_ds`.

## Installation

Add `kino_shot_ds` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:kino_shot_ds, "~> 0.1"}
  ]
end
```

## Usage

Install the package with `Mix.install([{:kino_shot_ds, "~> 0.1"}])` in your
Livebook. After that, `TPTP Parser` will be available as a Smart Cell.
