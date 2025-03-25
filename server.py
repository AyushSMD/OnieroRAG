from flask import Flask, jsonify, render_template, request
from scripts import the_big_dipper
from flask_cors import CORS

app = Flask(__name__)
CORS(app)



@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route('/results.html')
def results():
    return render_template('results.html')

# curl -X POST http://localhost:8000/llm -F dream="haha yes"
@app.route("/llm", methods=["POST"])
def llm_():
    if request.method == "POST":
        # print(request.form)
        dream_text = request.form['dream']

    response = jsonify(the_big_dipper.main(dream_text=dream_text))
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response
    # return {"data": 1}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
