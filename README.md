# mini-project thingy

## Dependencies (local)
- [Git](https://git-scm.com/downloads/)
- [Ollama](https://ollama.com/)
- [miniconda](https://www.anaconda.com/download/success)


## Setup (local)

### Environment Setup

Create and activate your conda environment. The following setup creates one with `python 3.11`, which turns out to be pretty compatible for most use cases, along with `nvcc version 12.4`, if you use an Nvidia card.

```sh
conda env create -f env0.yml
conda activate langchain-demo
```
> Note: Adjust the `prefix` in the `env.yml` file accordingly

Create and acivate a python virtual environment, keeping the conda packages you installed earlier.
```
python -m venv env --system-site-packages
source env/bin/activate
```

Verify your python and nvcc (only for Nvidia users) version is as you'd expect with:
```
python --version
nvcc --version
```
This should return `Python 3.11.11`, and `12.4` respectively.

Finally, install the rest of the dependencies
```sh
pip install accelerate \
            beautifulsoup4 \
            black \
            huggingface_hub \
            iprogress \
            ipykernel \
            langchain \
            langchain-community \
            langchain-huggingface \
            langchain-ollama \
            ollama \
            python-dotenv \
            requests \
            sentence_transformers
```

### Ollama Setup
Make sure your Ollama client is up and running. Windows users simply need to download and install the client from [here](https://ollama.com/). Linux users will simply figure it out because they aren't crippled.

Next, get the [llama3.2:3b](https://ollama.com/library/llama3.2) model:
```sh
ollama run llama3.2:3b
```


## The fun part (not really): Execution

Clone this repository, and open your editor of choice in the cloned directory.
```sh
git clone https://github.com/BillyDoesDev/mini-project-thingy.git
cd mini-project-thingy
```

**VSCode users:**

Launch your editor in the current working directory.
```sh
code .
```

> **Note:** Make sure you have the [Jupyter Notebook extension pack](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) installed.

Navigate to the `samples/` directory and look for `main.ipynb`. Select your kernel to use the virtual python you created, and then you should be able to run it! Have fun!