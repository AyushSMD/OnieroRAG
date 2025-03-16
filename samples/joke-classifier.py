from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

# Define the Deepseek R1-inspired template
# prompt_template = ChatPromptTemplate.from_template(
#     """System: You are a grader, who rates a joke either 0, for bad, or 1, for good.
#     You do not show the thinking part, and give no additional remarks.
#     The output is a single integer.
#     <｜User｜>Here is the joke: {joke}.
#     <｜Assistant｜>
#     """
# )
joke_template = ChatPromptTemplate([
    ("system", """You are a grader, who rates a joke either 0, for bad, or 1, for good.
    You do not show the thinking part, and give no additional remarks.
    The output is a single integer."""),
    ("user", "Here is the joke: {joke}."),
    ("assistant")
])

number_template = ChatPromptTemplate([
    ("system", """You simply output whatever input the user gives you.
    You do not show the thinking part, and give no additional remarks."""),
    ("user", "Here is the input: {input}."),
    ("assistant")
])

# Initialize the Ollama LLM
llm = OllamaLLM(model="deepseek-r1:7b")

# Create the chain
chain = {"input": joke_template} | number_template | llm

# Example joke input
joke_input = {"joke": "What's an alligator in a vest called? An investigator."}

# Get binary classification output
result = chain.invoke(joke_input)
print(result)

