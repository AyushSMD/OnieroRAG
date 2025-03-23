from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface.embeddings import HuggingFaceEmbeddings  # local
from langchain_core.vectorstores import InMemoryVectorStore
import pickle


# https://python.langchain.com/docs/integrations/document_loaders/pypdfloader/#add-a-custom-pages_delimiter-to-identify-where-are-ends-of-pages-in-single-mode
def pdf_loader(pdf_path: str):
    return PyPDFLoader(
        pdf_path,
        mode="single",
        pages_delimiter="\n-------END OF PAGE-------\n",
    )

print("[Loading Docs...]", end=" ", flush=True)
dream_dictionary_docs = pdf_loader("assets/data/The_Dreamers_Dictionary.pdf").load()
jung_archetypes_docs = pdf_loader("assets/data/The_Archetypes_of_the_Collective_Unconscious_C.Jung.pdf").load()
jung_interpretations_docs = pdf_loader("assets/data/Symbols_and_the_Interpretation_of_Dreams_by_Carl_Jung.pdf").load()
personality_types_docs = pdf_loader("assets/data/Understanding Personality - The 12 Jungian Archetypes.pdf").load()
freud_interpretations_docs = pdf_loader("assets/data/The Interpretation of Dreams - Sigmund Freud (1900).pdf").load()
print("DONE")

print("[Splitting Docs...]", end=" ", flush=True)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,                # chunk size (characters)
    chunk_overlap=200,              # chunk overlap (characters)
    add_start_index=True,           # track index in original document
)
dream_dictionary_splits = text_splitter.split_documents(dream_dictionary_docs)
jung_archetypes_splits = text_splitter.split_documents(jung_archetypes_docs)
jung_interpretations_splits = text_splitter.split_documents(jung_interpretations_docs)
personality_types_splits = text_splitter.split_documents(personality_types_docs)
freud_interpretations_splits = text_splitter.split_documents(freud_interpretations_docs)
print("DONE")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2",
    model_kwargs={"device": "cuda"}, # use 'cpu' in case you don't have a gpu
)

print("[Creating Vector Stores...]", end=" ", flush=True)
# Create In-Memory Vector Stores
dream_dictionary_store = InMemoryVectorStore(embeddings)
jung_archetypes_store = InMemoryVectorStore(embeddings)
jung_interpretations_store = InMemoryVectorStore(embeddings)
personality_types_store = InMemoryVectorStore(embeddings)
freud_interpretations_store = InMemoryVectorStore(embeddings)
print("DONE")

print("*[Embedding...]", end=" ", flush=True)
dream_dictionary_store.add_documents(documents=dream_dictionary_splits)
jung_archetypes_store.add_documents(documents=jung_archetypes_splits)
jung_interpretations_store.add_documents(documents=jung_interpretations_splits)
personality_types_store.add_documents(documents=personality_types_splits)
freud_interpretations_store.add_documents(documents=freud_interpretations_splits)
print("DONE")


with open(
    "assets/pickles/dream_dictionary_store.dat", mode="wb"
) as f_dream_dictionary_store, open(
    "assets/pickles/jung_archetypes_store.dat", mode="wb"
) as f_jung_archetypes_store, open(
    "assets/pickles/jung_interpretations_store.dat", mode="wb"
) as f_jung_interpretations_store, open(
    "assets/pickles/personality_types_store.dat", mode="wb"
) as f_personality_types_store, open(
    "assets/pickles/freud_interpretations_store.dat", mode="wb"
) as f_freud_interpretations_store:
    pickle.dump(freud_interpretations_store, f_freud_interpretations_store)
    pickle.dump(dream_dictionary_store, f_dream_dictionary_store)
    pickle.dump(jung_archetypes_store, f_jung_archetypes_store)
    pickle.dump(jung_interpretations_store, f_jung_interpretations_store)
    pickle.dump(personality_types_store, f_personality_types_store)
    print("Stored Pickled Docs.")