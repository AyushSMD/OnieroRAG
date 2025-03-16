# import torch
# print(torch.cuda.is_available())
# print(torch.cuda.get_device_name(0))

# Use a pipeline as a high-level helper
from transformers import pipeline

# allows you to wrap a huggingface model as a langchain model which then lets you connect it in a langchain chain
from langchain_huggingface import HuggingFacePipeline
from langchain.prompts import PromptTemplate

pipe = pipeline("summarization", model="facebook/bart-large-cnn", device=0)
llm = HuggingFacePipeline(pipeline=pipe)

template = PromptTemplate.from_template(
    "Summarize the following text in a way a {age} year old would understand:\n\n{text}"
)
summarizer_chain = template | llm

text_to_summarize = ""
with open("input.txt") as f:
    text_to_summarize = f.read()

age = 10


# Execute the summarization chain
summary = summarizer_chain.invoke(
    {
        "text": text_to_summarize,
        "age": age
    }
)

print("\n**Generated Summary:**")
print(summary)
