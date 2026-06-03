from abc import ABC, abstractmethod
from spacy.lang.en import English
from tqdm import tqdm
from pathlib import Path

import fitz
import re

class InputProcessor:
    def __init__(self, src_path):
        self.src_path = Path(src_path).resolve()

    @abstractmethod
    def get_data(self):
        pass

    @staticmethod
    def from_path(src_path):
        '''
        Guess the right input processor to use
        '''
        src_path = Path(src_path).resolve()

        if src_path.suffix == ".pdf":
            return PDF_Processor(src_path)

        return TextualProcessor(src_path)

    @staticmethod
    def split_list(input_list: list, slice_size: int) -> list[list[str]]:
        '''
        Chunk the the given list into lists of length slice_size
        '''
        return [
            input_list[i : i + slice_size]
                for i in range(0, len(input_list), slice_size)
        ]

    def run(self):
        import cache
        pages_data = cache.get(
            [self.src_path],
            self.get_data,
        )

        if pages_data is None:
            return []

        chunks = self._split_sentence(pages_data)
        relevant_chunks = [
            # Chunks with less than 120 chars are irrelevant
            chunk for chunk in chunks if chunk["chunk_token_count"] > 30
        ]

        return relevant_chunks

    def _split_sentence(self, pages_data: list, chunk_size: int = 10):
        nlp = English()
        nlp.add_pipe("sentencizer")
        chunks = []
        for page in tqdm(pages_data, desc="Text to sentence chunks"):
            sents = list(nlp(page["text"]).sents)
            str_sents = [str(sentence) for sentence in sents]
            page_chunks = self.split_list(str_sents, chunk_size)

            for sentence_chunk in page_chunks:
                chunk_dict = {}
                chunk_dict["page_number"] = page["page_number"]

                joined_sentence_chunk = (
                "".join(sentence_chunk).replace(" ", " ").strip()
                )

                joined_sentence_chunk = re.sub(
                    # Add a space after each sentence
                    r"\.([A-Z])", r". \1", joined_sentence_chunk
                )
                chunk_dict["sentence_chunk"] = joined_sentence_chunk

                chunk_dict["chunk_token_count"] = len(joined_sentence_chunk) / 4

                chunks.append(chunk_dict)

        return chunks

class TextualProcessor(InputProcessor):
    def get_data(self, src_path) -> list[dict]:
        text = None
        with open(src_path, 'r') as source:
            try:
                text = source.read()
            except UnicodeDecodeError as e:
                print(f"Skipping binary file {src_path}")
                return None

        if text is None:
            raise Exception("Can't open file for reading: "+src_path)

        page = {
            "page_number": 1,
            "text": text,
        }

        return [page]

class PDF_Processor(InputProcessor):
    def get_data(self, src_path) -> list[dict]:
        try:
            pdf_document = fitz.open(src_path)
        except fitz.FileDataError:
            print(f"Error: Unable to open PDF file '{src_path}'.")

        pages_data = []
        for page_number, page in tqdm(
            enumerate(pdf_document), total=len(pdf_document), desc="Reading PDF"
        ):
            text = page \
                    .get_text() \
                    .replace("\n", " ") \
                    .strip()

            pages_data.append({
                "page_number": page_number,
                "text": text,
            })
        return pages_data
