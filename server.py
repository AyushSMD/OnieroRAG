from flask import Flask, jsonify, render_template
from scripts import scraper

app = Flask(__name__)


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


if __name__ == '__main__':
    app.run(port=8000, debug=True)
