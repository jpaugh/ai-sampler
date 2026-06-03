def main(src_path, *query_words):
    query = " ".join(query_words)
    if len(query) == 0:
        query = "Based on the context, what is the purpose of this paper?"
    print("Query: " + query)

    from rag import RAG
    rag = RAG(src_path)
    result = rag.run(query)
    print(result)

if __name__ == "__main__":
    import sys
    main(*sys.argv[1:])
