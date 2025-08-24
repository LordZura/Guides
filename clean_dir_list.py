#!/usr/bin/env python3
"""
clean_dir_list.py

Recursively list files in a project directory in a clean, sorted single-column format,
ignoring node_modules and other common cache/build dirs.

By default prints all found files (relative paths). Use --only-example to print only
the example set (and only the ones that exist).

Examples:
  # list everything (clean)
  python clean_dir_list.py

  # list everything under a specific directory
  python clean_dir_list.py --root /path/to/project

  # print only your example file list (only files that actually exist)
  python clean_dir_list.py --only-example

Author: Amanda (helpful, slightly sassy)
"""

import argparse
import os
from pathlib import Path
from typing import List, Set

# Example file list you showed earlier (posix style)
EXAMPLE_FILES = [
    "package.json",
    "src/main.tsx",
    "src/App.tsx",
    "src/lib/supabaseClient.ts",
    "src/contexts/AuthProvider.tsx",
    "src/components/Navbar.tsx",
    "src/components/AuthModal.tsx",
    "src/pages/Dashboard.tsx",
    "src/pages/Explore.tsx",
    "src/db/migrations/001_create_profiles.sql",
    "README_SUBTASK1.md",
]

DEFAULT_EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".vite",
    ".cache",
    ".parcel-cache",
    "__pycache__",
}


def gather_files(root: Path, exclude_dirs: Set[str]) -> List[str]:
    """
    Walk root and return a sorted list of relative file paths (posix style),
    excluding directories listed in exclude_dirs (directory name match).
    """
    root = root.resolve()
    results = []
    for dirpath, dirnames, filenames in os.walk(root, topdown=True, followlinks=False):
        # prune excluded directories so os.walk won't descend into them
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]

        rel_dir = Path(dirpath).relative_to(root)
        for f in filenames:
            # Build posix relative path
            if str(rel_dir) == ".":
                rel_path = f
            else:
                rel_path = (rel_dir / f).as_posix()
            results.append(rel_path)
    results.sort()
    return results


def print_all_files(root: Path, exclude_dirs: Set[str]):
    files = gather_files(root, exclude_dirs)
    for p in files:
        print(p)


def print_only_example(root: Path, exclude_dirs: Set[str]):
    """
    Print only the example files (from EXAMPLE_FILES) that actually exist under root.
    If a file from the example list does not exist, skip it silently.
    """
    found = set(gather_files(root, exclude_dirs))
    for p in EXAMPLE_FILES:
        if p in found:
            print(p)


def main():
    p = argparse.ArgumentParser(description="Clean directory listing (ignores node_modules).")
    p.add_argument("--root", default=".", help="Root directory to scan (default: current directory).")
    p.add_argument(
        "--only-example",
        action="store_true",
        help="Print only the built-in example file list (but only the files that exist).",
    )
    p.add_argument(
        "--ignore",
        nargs="*",
        default=[],
        help="Additional directory names to ignore (space separated). E.g. --ignore .cache mytmpdir",
    )
    args = p.parse_args()

    root = Path(args.root)
    if not root.exists() or not root.is_dir():
        print(f"[error] root path '{root}' does not exist or is not a directory.")
        raise SystemExit(2)

    exclude = set(DEFAULT_EXCLUDE_DIRS)
    exclude.update(args.ignore)

    if args.only_example:
        print_only_example(root, exclude)
    else:
        print_all_files(root, exclude)


if __name__ == "__main__":
    main()
