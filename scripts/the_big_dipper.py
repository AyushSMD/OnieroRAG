from pydantic import BaseModel, Field
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
import pickle
import json
import torch
import io
import os
from typing import List
import re
from dotenv import load_dotenv

load_dotenv()

llm = ChatOllama(
    model="llama3.2:3b",
    temperature=0,
    # other params...
)


## Use in case of loading from a CPU
## https://stackoverflow.com/a/68992197
class CPU_Unpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == "torch.storage" and name == "_load_from_bytes":
            return lambda b: torch.load(
                io.BytesIO(b), map_location="cpu", weights_only=True
            )
        else:
            return super().find_class(module, name)


class vector_store_reader:
    def __init__(self, load_dir_path: str, store_names: List[str], use_cpu=False):
        self.vector_store = {}

        print("loading vector stores from file...", end=" ", flush=True)
        for store in store_names:
            with open(os.path.join(load_dir_path, store), mode="rb") as f:
                if not use_cpu:
                    self.vector_store[store.split(".")[0]] = pickle.load(f)
                else:
                    self.vector_store[store.split(".")[0]] = CPU_Unpickler(f).load()
        print("done")


v_ = vector_store_reader(
    load_dir_path="scripts/pickles",
    store_names=["personality_types_store.dat", "jung_interpretations_store.dat"],
    use_cpu=int(os.getenv("USE_CPU", "1")),
)


class initialize_dream:
    def __init__(self, dream_text: str):
        print(f"Dream: {dream_text[:50]}...")

        print("performing similarity search...", end=" ", flush=True)
        jung_interpretations_results = v_.vector_store["jung_interpretations_store"].similarity_search(dream_text)
        personality_types_results = v_.vector_store["personality_types_store"].similarity_search(dream_text)
        print("done")

        def __parse__(result):
            return "\n\n".join(doc.page_content for doc in result)

        print("preparing context...", end=" ", flush=True)
        self.jung_interpretations_context = __parse__(jung_interpretations_results)
        self.personality_types_context = __parse__(personality_types_results)
        print("done")



def main(dream_text: str) -> dict:
    dream = initialize_dream(dream_text=dream_text)
    data = {}

    class archetype_classification(BaseModel):
        """Dream Analysis."""

        archetype: str = Field(
            description="Archetype based on Jungian personality interpretation and dream."
        )

    archetype = json.loads(
        llm.with_structured_output(archetype_classification)
        .invoke(
            f"Dream: {dream_text}\n\nJungian interpretation: {dream.personality_types_context}"
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

        Give your answer in a json.
        """
    )

    chain = prompt | llm
    descriptive_content = chain.invoke(
        {
            "dream_text": dream_text,
            "archetype": archetype,
            "context": f"{dream.jung_interpretations_context}",
            # "freud_interpretations": dream.freud_interpretations_context,
        }
    ).content

    _ = descriptive_content.split("```")[1]
    __ = re.sub("\}\n\n\{", ",", _)
    descriptive_content = json.loads(__)
    
    data["descriptive_content"] = descriptive_content
    del dream
    return data


if __name__ == "__main__":
    # with open("assets/input.txt") as f:
    #   dream_text = f.read()

    # print(main(dream_text="I was in bed with my girlfriend"))
    print(main(dream_text="I saved a dying nation"))
