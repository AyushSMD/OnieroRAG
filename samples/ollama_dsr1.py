from langchain.chains import SequentialChain, LLMChain
from langchain.prompts import PromptTemplate
from langchain_ollama.llms import OllamaLLM

## Initialize Model And Create Prompt Templates
# Initialize the Ollama model
llm = OllamaLLM(model="deepseek-r1:7b")

# Crisis Management Agent Prompt
crisis_prompt = PromptTemplate(
    input_variables=["issue"],
    template="""
    You are a crisis management expert.
    Draft a **short and professional statement for the press** addressing the crisis while maintaining trust in the company.
    Your response should:
    - Acknowledge the issue.
    - Reassure customers, stakeholders, and the public.
    - Briefly mention the steps being taken to resolve the situation.
    - Be concise, clear, and confident.

    Crisis Situation: {issue}

    Press Statement:
    """
)

# Legal Expert Agent Prompt
legal_prompt = PromptTemplate(
    input_variables=["crisis_response"],
    template="""
    You are a legal expert.
    Review the following short press statement and edit it to (1) deny direct culpability, and (2) remove any language that could put the company in legal liability.
    Ensure the statement remains professional and reassuring but avoids making admissions of fault or liability.
    In the final shared statement, please add a note about what you changed from the original statement and why, giving atleast 1 concrete example.

    Original Press Statement:
    {crisis_response}

    Legally Safe Press Statement:
    """
)

## Create Chains
# Define LLM Chains for each agent
crisis_chain = LLMChain(llm=llm, prompt=crisis_prompt, output_key="crisis_response")
legal_chain = LLMChain(llm=llm, prompt=legal_prompt, output_key="legal_response")

# Orchestrate using SequentialChain
crisis_management_chain = SequentialChain(
    chains=[crisis_chain, legal_chain],
    input_variables=["issue"],
    output_variables=["crisis_response", "legal_response"]
)

## Describe Crisis Scenario
# Example: Switch the issue description for any crisis scenario
issue_description = "Kia recalls 80,000 vehicles due to faulty wiring, improper air bag deployment"

## Run Workflow
# Run the multi-agent crisis response workflow
final_output = crisis_management_chain({"issue": issue_description})

# Print first response (Crisis Management Expert)
print("\n-------- 🟥 Crisis Management Statement 🟥 --------\n")
print(final_output["crisis_response"])

# Print final legally refined response
print("\n-------- 🟦 Final Legal-Safe Press Statement 🟦  --------\n")
print(final_output["legal_response"])
