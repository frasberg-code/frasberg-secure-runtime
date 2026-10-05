from __future__ import annotations

import argparse

from luchii import LuchiiModel
from utils.helpers import generate_api_key


def main() -> None:
    parser = argparse.ArgumentParser(prog="luchii-cli", description="FrasbergAI Luchii CLI")
    subcommands = parser.add_subparsers(dest="command", required=True)

    prompt_parser = subcommands.add_parser("generate", help="Generate text with a model")
    prompt_parser.add_argument("prompt", type=str, help="Input prompt")
    prompt_parser.add_argument("--model", type=str, default="genesis-prime", help="Model name")

    keys_parser = subcommands.add_parser("keys", help="Key management commands")
    keys_subcommands = keys_parser.add_subparsers(dest="keys_command", required=True)

    create_parser = keys_subcommands.add_parser("create", help="Create a new API key")
    create_parser.add_argument("kind", choices=["api"], help="Key type to create")
    create_parser.add_argument("--label", type=str, default=None, help="Optional key label")

    args = parser.parse_args()

    if args.command == "generate":
        model = LuchiiModel.load(args.model)
        output = model.generate(args.prompt)
        print(output)
        return

    if args.command == "keys" and args.keys_command == "create" and args.kind == "api":
        key = generate_api_key()
        print(key)
        return


if __name__ == "__main__":
    main()
