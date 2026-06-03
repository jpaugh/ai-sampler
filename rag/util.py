def generate_embedding(
    cache_token,
    src_path,
    model=None,
    ):
    if model is None:
        model = Model()

    chunked_data = get_chunked_data(src_path)

    # Generate embeddings
    from tqdm import tqdm
    for chunk in tqdm(chunked_data, desc="Generating embeddings"):
        chunk["embedding"] = model.embedding.encode(chunk["sentence_chunk"])

    from pandas import DataFrame
    return DataFrame(chunked_data)

def select_device():
    import torch
    return "cuda" if torch.cuda.is_available() else "cpu"

def get_chunked_data(
        src_path,
    ):
    from input_processor import InputProcessor
    input_processor = InputProcessor.from_path(src_path)
    chunked_data = input_processor.run()

    return chunked_data

def week_number():
    from datetime import datetime
    return datetime.now().isocalendar()[1]

def create_prompt(query, semantic_search):
    import cache
    class Prompt:
        conversation = []

        def add(self, role, content):
            self.conversation.append({
                "role": role,
                "content": content,
            })

    prompt = Prompt()
    prompt.add("system", """Based on the following context items, please answer the query.
        Give yourself room to think by extracting relevant passages from the context before answering the query.
        Don't return the thinking, only return the answer.
        Make sure your answers are as explanatory as possible.
        Use the following examples as reference for the ideal answer style.
        \nExample 1:
        Query: What are the fat-soluble vitamins?
        Answer: The fat-soluble vitamins include Vitamin A, Vitamin D, Vitamin E, and Vitamin K. These vitamins are absorbed along with fats in the diet and can be stored in the body's fatty tissue and liver for later use. Vitamin A is important for vision, immune function, and skin health. Vitamin D plays a critical role in calcium absorption and bone health. Vitamin E acts as an antioxidant, protecting cells from damage. Vitamin K is essential for blood clotting and bone metabolism.
        \nExample 2:
        Query: What are the causes of type 2 diabetes?
        Answer: Type 2 diabetes is often associated with overnutrition, particularly the overconsumption of calories leading to obesity. Factors include a diet high in refined sugars and saturated fats, which can lead to insulin resistance, a condition where the body's cells do not respond effectively to insulin. Over time, the pancreas cannot produce enough insulin to manage blood sugar levels, resulting in type 2 diabetes. Additionally, excessive caloric intake without sufficient physical activity exacerbates the risk by promoting weight gain and fat accumulation, particularly around the abdomen, further contributing to insulin resistance.
        \nExample 3:
        Query: What is the importance of hydration for physical performance?
        Answer: Hydration is crucial for physical performance because water plays key roles in maintaining blood volume, regulating body temperature, and ensuring the transport of nutrients and oxygen to cells. Adequate hydration is essential for optimal muscle function, endurance, and recovery. Dehydration can lead to decreased performance, fatigue, and increased risk of heat-related illnesses, such as heat stroke. Drinking sufficient water before, during, and after exercise helps ensure peak physical performance and recovery.
        """)

    for document in semantic_search.run(query):
        context = f"The following content from the document \"{document["path"]}\" is relevant to the user's query:\n"
        context += "- " + "\n-".join(document["relevant_chunks"])
        prompt.add("system", context)

    prompt.add("user", query)
    cache_key = cache.insert_if_new([prompt.conversation], prompt.conversation)
    print(f"Prompt cache key {cache_key}")
    return prompt

def runtime(label, task):
    import time
    print(label+"... ", end='', flush=True)

    start_time = time.time()
    result = task()
    elapsed = time.time() - start_time

    print(elapsed)
    return result
