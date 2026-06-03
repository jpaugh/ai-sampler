from util import *
from file_inputs import InputPaths

class RAG:
    def __init__(self, *src_paths):
        self.sources = InputPaths(*src_paths)
        print("Paths right now:")
        for path in self.sources.paths():
            print(f"  {path}", flush=True)
        self.model = Model()
        self.llm_model = LLM_Model(self.model)

    def embeddings(self):
        import cache
        from tqdm import tqdm
        for path in tqdm(self.sources.paths(), desc="Compiling embeddings"): #tqdm
            result = cache.get(
                [
                    "embedding",
                    path,
                ],
                lambda label, src_path: generate_embedding(label, src_path, self.model),
                coding=cache.PandasDataFrame(),
            )
            yield {
                "path": path,
                "value": result,
            }

    def run(self, query):
        import cache
        print("Compiling RAG prompt...")
        prompt = create_prompt(
            query,
            SemanticSearch(self.embeddings(), self.model),
        )
        print(f"Generating results for query {prompt.conversation[-1]}...")
        results = cache.get([
                prompt.conversation,
                f"llm output {week_number()}",
            ],
            self.llm_model.run,
        )
        return results

class LLM_Model:
    def __init__(self, model=None):
        if model is None:
            model = Model()
        self.model = model

    def get_model_input(self, prompt):
        model_input = self.model.tokenizer.apply_chat_template(
            conversation=prompt,
            tokenize=False,
            add_generation_prompt=True
        )

        model_input = self.model.tokenizer(model_input, return_tensors="pt").to(select_device())
        return model_input

    def run(self, prompt, cache_label="unused"):
        print(f"Cache label: {cache_label}")
        model_input = runtime("  Tokenize input", lambda : self.get_model_input(prompt))
        output_vector = runtime("  Generate output", (lambda :
            self.model.primary.generate(
                input_ids=model_input["input_ids"],
                attention_mask=model_input["attention_mask"],
                pad_token_id=self.model.tokenizer.pad_token_id,
                max_new_tokens=2048,
            )
        ))
        response = runtime("  Decode output", (lambda :
            (self.model.tokenizer
                .decode(output_vector[0], skip_special_tokens=True)
                .split("<|assistant|>")[-1]
                .strip()
        )))
        return response

class SemanticSearch:
    def __init__(self, embeddings, model=None):
        if model is None:
            model = Model()
        self.model = model
        self.embeddings = embeddings

    def run(self, query):
        import cache
        for embedding in self.embeddings:
            relevant_chunks = cache.get(
                [
                    query,
                    embedding["value"],
                ],
                self.per_embedding,
            )
            yield {
                "path": embedding["path"],
                "relevant_chunks": relevant_chunks,
            }

    def per_embedding(self, query, embedding):
        import torch
        import numpy as np
        data = embedding.to_dict(orient="records")
        if not any(data):
            return []

        embeddings_tensor = torch.tensor(
            np.array(embedding["embedding"].tolist()),
            dtype=torch.float32
        ).to(select_device())

        relevant_chunks = self.get_top_results(
            query,
            embeddings_tensor,
            data,
        )

        return relevant_chunks

    def get_top_results(self, query, embeddings, data, count:int =5):
        relevant_chunks = []
        scores, indices = self._retrieve_relevant_resources(query, embeddings, count)

        for index in indices:
            sentence_chunk = data[index]["sentence_chunk"]
            relevant_chunks.append(sentence_chunk)

        return relevant_chunks

    def _retrieve_relevant_resources(
            self,
            query: str,
            embeddings,
            count: int = 5
        ):

        import torch
        query_embedding = self.model.embedding.encode(query, convert_to_tensor=True)
        from sentence_transformers import util
        dot_scores = util.dot_score(query_embedding, embeddings)[0]
        count = min(count, len(dot_scores))
        scores, indices = torch.topk(
            input=dot_scores, k=count
        )
        return scores, indices

class Model:
    '''
        Container for models. We can pass it around instead of rebuilding them every time
    '''
    __slots__ = "_primary", "_embedding", "_tokenizer", "primary_model_id"

    def __init__(self):
        self.primary_model_id = "tiiuae/Falcon3-3B-Instruct"
        self._primary = None
        self._tokenizer = None
        self._embedding = None

    @property
    def tokenizer(self):
        if self._tokenizer is not None:
            return self._tokenizer

        from transformers import AutoTokenizer

        self._tokenizer = AutoTokenizer.from_pretrained(self.primary_model_id)
        if self._tokenizer.pad_token_id is None:
            self._tokenizer.pad_token_id = self._tokenizer.eos_token_id
        return self._tokenizer

    @property
    def primary(self):
        print("Loading LM model...")

        if self._primary is not None:
            return self._primary

        import torch
        from transformers import AutoModelForCausalLM
        self._primary = AutoModelForCausalLM.from_pretrained(
                pretrained_model_name_or_path=self.primary_model_id,
                torch_dtype=torch.float16,
                low_cpu_mem_usage=False,
                device_map="auto",
        )
        return self._primary

    @property
    def embedding(self):
        if self._embedding is not None:
            return self._embedding

        from sentence_transformers import SentenceTransformer
        self._embedding = SentenceTransformer(
            model_name_or_path="all-MiniLM-L6-v2",
            device=select_device(),
        )

        return self._embedding
