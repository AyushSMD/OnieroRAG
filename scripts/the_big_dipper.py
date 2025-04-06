from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
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

OFFLINE_MODE = int(os.getenv("OFFLINE_MODE", "0"))

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
) if not OFFLINE_MODE else ChatOllama(
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
        # facebook_dream_archetypes_results = v_.vector_store["facebook_dream_archetypes_store"].similarity_search(dream_text)
        print("done")

        def __parse__(result):
            return "\n\n".join(doc.page_content for doc in result)

        print("preparing context...", end=" ", flush=True)
        self.jung_interpretations_context = __parse__(jung_interpretations_results)
        self.personality_types_context = __parse__(personality_types_results)
        # self.facebook_dream_archetypes_context = __parse__(facebook_dream_archetypes_results)
        print("done")


def get_archetype(term):
    archetypes = {
        "ruler": ["boss", "leader", "aristocrat", "king", "queen", "politician", "role model", "manager", "administrator"],
        "creator": ["artist", "inventor", "innovator", "musician", "writer", "dreamer", "creator"],
        "sage": ["expert", "scholar", "detective", "advisor", "thinker", "philosopher", "academic", "researcher", "planner", "professional", "mentor", "teacher", "contemplative"],
        "innocent": ["utopian", "traditionalist", "naive", "mystic", "saint", "romantic", "dreamer"],
        "explorer": ["seeker", "iconoclast", "wanderer", "individualist", "pilgrim"],
        "rebel": ["outlaw", "revolutionary", "wild man", "misfit", "iconoclast"],
        "hero": ["warrior", "crusader", "rescuer", "superhero", "soldier", "dragon slayer", "winner", "team player"],
        "wizard": ["magician", "visionary", "catalyst", "inventor", "charismatic leader", "shaman", "healer", "medicine man"],
        "jester": ["fool", "trickster", "joker", "practical joker", "comedian"],
        "everyman": ["good old boy", "regular guy", "regular girl", "person next door", "realist", "working stiff", "solid citizen", "good neighbor", "silent majority"],
        "lover": ["partner", "friend", "intimate", "enthusiast", "sensualist", "spouse", "team-builder"],
        "caregiver": ["saint", "altruist", "parent", "helper", "supporter"]
    }
    
    for archetype, terms in archetypes.items():
        if term in terms or term == archetype:
            return archetype
    
    return "everyman"


def clean_dict(d, min_length=5):
    if isinstance(d, dict):
        return {
            k: clean_dict(v, min_length)
            for k, v in d.items()
            if isinstance(v, (dict, list)) or (isinstance(v, str) and len(v.strip()) >= min_length)
        }
    elif isinstance(d, list):
        return [clean_dict(item, min_length) for item in d if isinstance(item, (dict, list)) or (isinstance(item, str) and len(item.strip()) >= min_length)]
    return d


def fetch_archetype(dream_text:str, llm, dream:initialize_dream) -> str:
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
    )["archetype"].lower().strip().strip("the").strip()
    return get_archetype(archetype)


def main(dream_text: str, log_output=False) -> dict:
    dream = initialize_dream(dream_text=dream_text)
    data = {}

    archetype = fetch_archetype(dream_text, llm, dream)
    data["archetype"] = archetype

    if OFFLINE_MODE:
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
                "archetype": "The " + archetype,
                "context": f"{dream.jung_interpretations_context}",
                # "freud_interpretations": dream.freud_interpretations_context,
            }
        ).content

        try:
            _ = descriptive_content.split("```")[1]
            __ = re.sub("\}\n\n\{", ",", _)
            descriptive_content = json.loads(__)
            descriptive_content = clean_dict(descriptive_content)

        except (json.decoder.JSONDecodeError, IndexError) as e:
            print("[DECODE ERROR]", e)
            del dream
            return


    else:
        structured_llm = llm.with_structured_output(method="json_mode", include_raw=False)
        descriptive_content = structured_llm.invoke(
            f"""
            Give an analysis of the given dream, with respect to the given Jungian archetype.

            Dream: {dream_text}
            Jungian Archetype: {archetype}

            Also tell the user how to interpret the dream, using the following context:
            Context: {dream.jung_interpretations_context}

            Give your answer in a json.
            """
        )

    data["descriptive_content"] = descriptive_content

    del dream
    if log_output: print("\nData Sent:\n", data, "\n\n[TRANSACTION COMPLETE] sending over data, have fun :D\n")
    else: print("[TRANSACTION COMPLETE]")
    return data


if __name__ == "__main__":
    # with open("assets/input.txt") as f:
    #   dream_text = f.read()

    main(dream_text="I was my mother", log_output=True)
