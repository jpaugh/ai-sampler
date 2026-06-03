from abc import ABC, abstractmethod
from appdirs import AppDirs
from collections.abc import Iterable
from os import path
from pathlib import Path

import os
import sys

os_dirs = AppDirs("ry.abu.gy", "rovi")
cache_dir = os_dirs.user_cache_dir

class Coding(ABC):
    @abstractmethod
    def encode(self, data):
        pass

    @abstractmethod
    def decode(self, string):
        pass

class JsonCoding(Coding):
    import json

    def encode(self, data):
        return self.json.dumps(data)

    def decode(self, string):
        return self.json.loads(string)

class PandasDataFrame(Coding):
    import pandas as pd
    from io import StringIO

    def encode(self, data):
        if not isinstance(data, self.pd.DataFrame):
            data = self.pd.DataFrame(data)
        buffer = self.StringIO()
        data.to_json(buffer)
        return buffer.getvalue()

    def decode(self, string):
        import numpy as np
        buffer = self.StringIO(string)
        def munge(x):
            if isinstance(x,str):
                x = x.strip("[]")
                return np.fromstring(x, sep=" ")
            return x

        result = self.pd.read_json(buffer).apply(munge)
        return result

def get(inputs:list[str], operation, coding=None):
    _, result = get_with_key(inputs, operation, coding)
    return result

def get_with_key(inputs:list[str], operation, coding=None):
    if coding is None:
        coding = JsonCoding()

    cache_key = get_cache_key(inputs, strings_are_paths=True)
    cache_file = path.join(cache_dir, cache_key)
    printable_files = f"{[
        str(x)[:128] for x in inputs
    ]}"

    if path.isfile(cache_file):
        content = None
        with open(cache_file, 'r') as file:
            content = file.read()

        return cache_key, coding.decode(content)

    result = operation(*inputs)
    encoded = coding.encode(result)
    try:
        ensure_cache_dir()
        with open(cache_file, 'w') as file:
            file.write(encoded)
    except Exception as e:
        print(f"Exception: {e}", file=sys.stderr)

    return cache_key, result

def insert_if_new(inputs:list[str], content:str, coding=None):
    if coding is None:
        coding = JsonCoding()

    cache_key = get_cache_key(inputs, strings_are_paths=True)
    cache_file = path.join(cache_dir, cache_key)
    if path.exists(cache_file):
        return cache_key

    encoded = coding.encode(content)
    try:
        ensure_cache_dir()
        with open(cache_file, 'w') as file:
            file.write(encoded)

    except Exception as e:
        print(f"Exception: {e}", file=sys.stderr)

    return cache_key

def ensure_cache_dir():
    if not path.exists(cache_dir):
        os.makedirs(cache_dir)

def get_cache_key(item, strings_are_paths=False):
    if isinstance(item, str) and strings_are_paths and path.isfile(item):
        return get_file_hash(Path(item))

    if isinstance(item, str):
        return get_hash(item)

    if isinstance(item, Path):
        return get_file_hash(item)

    if isinstance(item, dict):
        keys = list([
            get_cache_key(elem) for elem in item.items()
        ])
        if len(keys) == 1:
            return keys[0]
        return get_multi_input_hash(keys)


    if isinstance(item, Iterable):
        keys = list([
            get_cache_key(elem) for elem in item
        ])
        if len(keys) == 1:
            return keys[0]
        return get_multi_input_hash(keys)

    raise Exception(f"Un-cachable item type for {item}")

def get_hash(string_literal:str):
    '''
        Hash a value from a string
    '''
    import hashlib
    return hashlib.sha256(string_literal.encode()).hexdigest()

file_hash_cache = {}

def get_file_hash(the_path:Path):
    '''
        Hash the contents of a file
    '''
    the_path = the_path.resolve()
    path_s = str(the_path)
    mtime = path.getmtime(the_path)
    key = (path_s, mtime)

    if key in file_hash_cache:
        return file_hash_cache[key]

    chunk_size = 4096
    import hashlib
    hash = hashlib.sha256()
    with open(the_path, 'rb') as file:
        for chunk in iter(lambda: file.read(chunk_size), b""):
            hash.update(chunk)

    file_hash_cache[key] = hash.hexdigest()
    return file_hash_cache[key]

def get_multi_input_hash(hash_strings:list[str]):
    '''
        Combine multiple hash strings into one
    '''
    import hashlib
    hash = hashlib.sha256()
    for hash_string in hash_strings:
        hash.update(hash_string.encode())
    return hash.hexdigest()

def abbrev_cache_key(key):
    width = 7
    abbrev = key[:width]
    collisions = []
    dir = Path(cache_dir)
    for path in dir.iterdir():
        name = path.name
        if name == key or not name.startswith(abbrev):
            continue
        collisions.append(name)
    for collision in collisions:
        while collision.startswith(abbrev):
            width += 1
            abbrev = key[:width]
    return abbrev
