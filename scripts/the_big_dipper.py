from typing import (
    Optional,
    List,
    Tuple,
)  # https://docs.python.org/3/library/typing.html
from pydantic import BaseModel, Field
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
import pickle
import json
import torch
import io


llm = ChatOllama(
    model="llama3.2:3b",
    temperature=0,
    # other params...
)

print("loading vector stores...", end=" ", flush=True)

## Use in case of loading from a CPU
## https://stackoverflow.com/a/68992197
class CPU_Unpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'torch.storage' and name == '_load_from_bytes':
            return lambda b: torch.load(io.BytesIO(b), map_location='cpu', weights_only=True)
        else: return super().find_class(module, name)

with open(
    "scripts/pickles/dream_dictionary_store.dat", mode="rb"
) as f_dream_dictionary_store, open(
    "scripts/pickles/jung_archetypes_store.dat", mode="rb"
) as f_jung_archetypes_store, open(
    "scripts/pickles/jung_interpretations_store.dat", mode="rb"
) as f_jung_interpretations_store, open(
    "scripts/pickles/personality_types_store.dat", mode="rb"
) as f_personality_types_store, open(
    "scripts/pickles/freud_interpretations_store.dat", mode="rb"
) as f_freud_interpretations_store:

    # if torch.cuda.is_available():
    # freud_interpretations_store = pickle.load(f_freud_interpretations_store)
    # dream_dictionary_store = pickle.load(f_dream_dictionary_store)
    # jung_archetypes_store = pickle.load(f_jung_archetypes_store)
    # jung_interpretations_store = pickle.load(f_jung_interpretations_store)
    # personality_types_store = pickle.load(f_personality_types_store)

    # else:
    freud_interpretations_store = CPU_Unpickler(f_freud_interpretations_store).load()
    dream_dictionary_store = CPU_Unpickler(f_dream_dictionary_store).load()
    jung_archetypes_store = CPU_Unpickler(f_jung_archetypes_store).load()
    jung_interpretations_store = CPU_Unpickler(f_jung_interpretations_store).load()
    personality_types_store = CPU_Unpickler(f_personality_types_store).load()

    print("done")


class initialize_dream:
    def __init__(self, dream_text):
        print(f"Dream: {dream_text[:50]}...")

        print("performing similarity search...", end=" ", flush=True)
        dream_dictionary_results = dream_dictionary_store.similarity_search(dream_text)
        jung_archetypes_results = jung_archetypes_store.similarity_search(dream_text)
        jung_interpretations_results = jung_interpretations_store.similarity_search(
            dream_text
        )
        personality_types_results = personality_types_store.similarity_search(
            dream_text
        )
        freud_interpretations_results = freud_interpretations_store.similarity_search(
            dream_text
        )
        print("done")

        def __parse__(result):
            return "\n\n".join(doc.page_content for doc in result)

        print("preparing context...", end=" ", flush=True)
        self.dream_dictionary_context = __parse__(dream_dictionary_results)
        self.jung_archetypes_context = __parse__(jung_archetypes_results)
        self.jung_interpretations_context = __parse__(jung_interpretations_results)
        self.personality_types_context = __parse__(personality_types_results)
        self.freud_interpretations_context = __parse__(freud_interpretations_results)
        print("done")


def main(dream_text:str) -> dict:
    dream = initialize_dream(dream_text=dream_text)
    data = {}

    class archetype_classification(BaseModel):
        """Dream Analysis."""

        archetype: str = Field(
            description="Archetype based on Jungian interpretation and dream. It should be one of Ruler, Creator/Artist, Sage, Innocent, Explorer, Rebel, Hero, Wizard, Jester, Everyman, Lover, Caregiver"
        )


    archetype = json.loads(
        llm.with_structured_output(archetype_classification)
        .invoke(
            f"Dream: {dream_text}\n\nJungian interpretation: {dream.jung_archetypes_context}"
        )
        .model_dump_json()
    )["archetype"]
    data["archetype"] = archetype


    prompt = ChatPromptTemplate.from_template(
        """
        Give an analysis of the given dream, with respect to the given Jungian archetype.

        Dream: {dream_text}
        Jungian Archetype: {archetype}

        Also tell the user how to interpret the dream, using the following context:
        Context: {context}

        Give some extra information as well, from Freud's interpretations: {freud_interpretations}

        Give your answer in a json.
        """
    )

    chain = prompt | llm
    descriptive_content = json.loads(
        (
            chain.invoke(
                {
                    "dream_text": dream_text,
                    "archetype": archetype,
                    "context": f"{dream.jung_interpretations_context}",
                    "freud_interpretations": dream.freud_interpretations_context
                }
            ).content
        ).split("```")[1]
    )

    data["descriptive_content"] = descriptive_content
    del dream
    return data


if __name__ == "__main__":
    # with open("assets/input.txt") as f:
    #   dream_text = f.read()
    
    print(main(dream_text="i had a dream where i fell off of a bridge"))
