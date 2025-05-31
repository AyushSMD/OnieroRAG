# Onerio RAG

## Dependencies
- [Git](https://git-scm.com/downloads/), for version control
- [Ollama](https://ollama.com/), for managing and running LLMs locally
- [miniconda](https://www.anaconda.com/download/success), for managing python environments


## Setup

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
> Note: Adjust the `prefix` in the `env.yml` file accordingly, if you're planning to clone the environment.


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

Verify your `python` (and `nvcc`, only for Nvidia users) version is as you'd expect with:
```
python --version
nvcc --version
```
This should return `Python 3.11.11`, and `12.4` respectively.

Finally, install the rest of the dependencies
```sh
pip install accelerate beautifulsoup4 huggingface_hub langchain langchain-community langchain-huggingface langchain-ollama ollama python-dotenv requests sentence_transformers ipykernel iprogress flask pypdf
```
<hr>

### Huggingface Setup [No Longer Needed]

> [!NOTE]
> [Gated Huggingface models](https://huggingface.co/docs/hub/en/models-gated#gated-models) require you to accept their terms and conditions before 
> you are able to use them, so make sure to check that for your use case. In this
> demonstration, the llama3.2:3b model that we use is indeed a "gated model".

Make sure you get your huggingface API key. You can do so by:
- Heading over to https://huggingface.co/settings/tokens
- Going to `Create new token`
- Choose type as `Read`, and assign any name of your choice
- Hit `Create token`

Once done, **in the current working directory**, create a `.env` file. It should look like so:
```sh
HUGGINGFACEHUB_API_TOKEN="hf_xxx"
```

Your directory structure should now look something like this:
```
.
├── .env
├── env
│   └── ...
├── env0.yml
├── env.yml
├── .git
│   └── ...
├── .gitignore
├── main.py
├── README.md
└── samples
    └── ...
```
<hr>

### Ollama Setup 

> [!TIP]
> Skip this step if you **do not wish** to run the `llama3.2:3b` model locally, and are okay with making API calls only. [Recommended for systems with low compute power]

Make sure your Ollama client is up and running. Windows users simply need to download and install the client from [here](https://ollama.com/). Linux users will simply figure it out because they aren't crippled. If you are a Linux user, and seem to be otherwise, kill yourself.

Next, get the [llama3.2:3b](https://ollama.com/library/llama3.2) model. Run the following in your terminal:
```sh
ollama run llama3.2:3b
```


## The fun part (not really): Execution

Download the pickled data from [here](https://drive.google.com/file/d/1LrHJkjxcl00hal7Bmih_jzStYyUNcKNi/view?usp=sharing), and extract it to `scripts/pickles/`

Start the python server with:
```sh
python server.py
```

Try it out by entering a dream prompt:
```
curl -X POST http://localhost:8000/llm -F dream="your dream text here"
```

## More Config Options

In your `.env` file, you can toggle the `USE_CPU` between `1` and `0` to choose whether you wish to use your CPU or GPU:
```
USE_CPU=1
```
> This defaults to `1`, which means `True`


## Data Sources

- https://dxelab.github.io/dreambank/api.html
- https://sleepanddreamdatabase.org/
- https://www.kaggle.com/datasets/sarikakv1221/dreams/data
- https://dreams.ucsc.edu/Library/domhoff_2008c.html
- https://www.researchgate.net/publication/330831711_JUNGIAN_AESTHETICS_SYMBOLS_AND_THE_UNCONSCIOUS#full-text
- https://www.jstor.org/ and https://github.com/sethsch/python-jstor-dfr, for data filtering
- https://conorneill.com/2018/04/21/understanding-personality-the-12-jungian-archetypes/
- THE COLLECTED WORKS OF C. G. JUNG VOLUME 9, PART 1
- SYMBOLS AND THE INTERPRETATION OF DREAMS BY CARL JUNG
- THE INTERPRETATIONS OF DREAMS BY SIGMUND FREUD
- THE DREAMER'S DICTIONARY BY  STEARN ROBINSON AND TOM CORBETT
<!-- - https://chatgpt.com/share/67d9a0d7-e2c4-8003-b12d-b9701cf702e6 -->

> **TODO:** Add the rest
