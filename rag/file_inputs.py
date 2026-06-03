from itertools import chain
from os import path, chdir, getcwd
from pathlib import Path

class InputPaths:
    sources: []
    def __init__(self, *sources):
        print(f"Sources {sources}")
        self.sources = [ Path(s).resolve() for s in sources ]

    def paths(self):
        paths = self._paths()
        for path in paths:
            yield path

    def _paths(self):
        '''
            Iterate the paths described in self.sources recursively
            Ignores files ignored by git, unless they're explicitly mentioned in self.sources
        '''
        files = filter(lambda p: p.is_file() and p.exists(), self.sources)
        roots = list(filter(lambda p: p.is_dir() and p.exists(), self.sources))

        return_dir = getcwd()
        try:
            for file in files:
                if not is_included(file):
                    continue
                yield file

            while any(roots):
                root = roots.pop()
                root = root.resolve()
                for path in root.iterdir():
                    path = path.resolve()
                    if not path.exists() or not is_included(path):
                        continue

                    if path.is_file():
                        yield path
                    elif path.is_dir():
                        if path.name == ".git":
                            raise Exception(f"Adding root {path}")
                        roots.append(path)
        finally:
            chdir(return_dir)


# TODO: Install this to ~/.local/lib
script_path = Path("assets/should-include-file.sh").resolve()

def is_included(path: Path):
    import sys
    #print(f"checking:{path}", out=sys.stderr, flush=True)
    import subprocess
    result = subprocess.run(
        [script_path, path],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        err = result.stderr.strip()
        raise Exception(f"Unexpected return code: {result.returncode}\n\n{err}")

    output = result.stdout.strip().lower()
    return output == "true"
