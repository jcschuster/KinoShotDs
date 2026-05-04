defmodule KinoShotDs.MixProject do
  use Mix.Project

  @version "0.1.1"
  @source_url "https://github.com/jcschuster/KinoShotDs"

  def project do
    [
      app: :kino_shot_ds,
      description: "Provides a Smart Cell for parsing TPTP Syntax into ShotDs data structures.",
      version: @version,
      elixir: "~> 1.19",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      package: package(),
      name: "KinoShotDs",
      source_url: @source_url,
      docs: docs()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {KinoShotDs.Application, []}
    ]
  end

  defp deps do
    [
      {:kino, "~> 0.19"},
      {:shot_ds, "~> 1.1"},
      {:ex_doc, "~> 0.40", only: :dev, runtime: false}
    ]
  end

  defp package do
    [
      licenses: ["MIT"],
      links: %{"GitHub" => @source_url},
      files: ~w(lib mix.exs README* LICENSE*)
    ]
  end

  defp docs do
    [
      main: "KinoShotDs",
      extras: ["README.md", "examples/demo.livemd"],
      source_url: @source_url,
      source_ref: "v#{@version}"
    ]
  end
end
