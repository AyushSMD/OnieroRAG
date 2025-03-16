from dotenv import load_dotenv
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface.embeddings import HuggingFaceEndpointEmbeddings # locally use embeddings
# embeddings = HuggingFaceEndpointEmbeddings()

from transformers import pipeline
from langchain_huggingface import HuggingFacePipeline
load_dotenv()

# pipe = pipeline(
#     task="text-generation",
#     model="meta-llama/Llama-3.2-1B",
#     pipeline_kwargs=dict(
#         max_new_tokens=512,
#         do_sample=False,
#         repetition_penalty=1.03,
#     ),
# )
# llm = HuggingFacePipeline()

llm = HuggingFaceEndpoint(
    repo_id="meta-llama/Llama-3.2-3B-Instruct",
    task="text-generation",
    max_new_tokens=512,
    do_sample=False,
    repetition_penalty=1.03,
)

chat_model = ChatHuggingFace(llm=llm)

# messages = [
#     SystemMessage(content="You're a helpful assistant"),
#     HumanMessage(
#         content="What happens when an unstoppable force meets an immovable object?"
#     ),
# ]

# ai_msg = chat_model.invoke(messages)
# print(ai_msg.content)

template = ChatPromptTemplate.from_template(
    "What happens when an unstoppable force meets an immovable object"
)

chain = template | chat_model
result = chain.invoke({})
print(result)