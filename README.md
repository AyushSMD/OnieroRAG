# mini-project thingy

## Dependencies (local)
- [Git](https://git-scm.com/downloads/), for version control
- [Ollama](https://ollama.com/), for managing and running LLMs locally
- [miniconda](https://www.anaconda.com/download/success), for managing python environments


## Setup (local)

### Environment Setup

Create and activate your conda environment. The following setup creates one with `python 3.11`, which turns out to be pretty compatible for most use cases, along with `nvcc version 12.4`, if you use an Nvidia card.

> [!IMPORTANT]
> **Windows Users Only**
> 
> In case you aren't able to run `conda` from a regular terminal, you most likely need to launch conda from your start menu, or from a shortcut (such pain). Then, deactivate the base environment by doing:
> ```sh
> conda deactivate
> ```
> Once done, proceed accordingly.

```sh
conda create -n langchain-demo python=3.11 pytorch
conda activate langchain-demo
```
> Note: Adjust the `prefix` in the `env.yml` file accordingly, if you're planning to clone the environmrnt.


Clone this repository.
```sh
git clone https://github.com/BillyDoesDev/mini-project-thingy.git
cd mini-project-thingy
```

Create and acivate a python virtual environment in the current working directory, keeping the conda packages you installed earlier.
```sh
python -m venv env --system-site-packages
source env/bin/activate     # for Mac and Linux users
env\scripts\activate        # for Windows users
```

Verify your python and nvcc (only for Nvidia users) version is as you'd expect with:
```
python --version
nvcc --version
```
This should return `Python 3.11.11`, and `12.4` respectively.

Finally, install the rest of the dependencies
```sh
pip install accelerate beautifulsoup4 huggingface_hub langchain langchain-community langchain-huggingface python-dotenv requests sentence_transformers ipykernel iprogress
```

### Ollama Setup

Make sure your Ollama client is up and running. Windows users simply need to download and install the client from [here](https://ollama.com/). Linux users will simply figure it out because they aren't crippled.

Next, get the [llama3.2:3b](https://ollama.com/library/llama3.2) model. Run the following in your terminal:
```sh
ollama run llama3.2:3b
```


## The fun part (not really): Execution

Launch your editor of choice.

> **VSCode users:**
> 
> Launch your editor in the current working directory.
> ```sh
> code .
> ```
> 
> > **Note:** Make sure you have the [Jupyter Notebook extension pack](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) installed.

Navigate to the `samples/` directory and look for `main.ipynb`. Select your kernel to use the virtual python you created, and then you should be able to run it! Have fun!