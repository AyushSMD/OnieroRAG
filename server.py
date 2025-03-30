import json
import time
from flask import Flask, render_template, request, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from scripts import the_big_dipper

app = Flask(__name__)
CORS(app)

# Configure the SQLite Database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///queries.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# Database Model for Logging Queries and Responses
class QueryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dream_text = db.Column(db.Text, nullable=False)
    response_data = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

    def __repr__(self):
        return f"<QueryLog {self.id}>"

def json_listify(data: dict) -> dict:
    spam = []
    for key in data:
        d = {}
        d["_id_"] = key
        d["_text_"] = data[key]
        spam.append(d)
    return json.dumps(spam)


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
        dream_text = request.form["dream"]

    data = the_big_dipper.main(dream_text=dream_text)
    json_response=json_listify(data)

    # time.sleep(2)
    # data = {
    #     "archetype": "caregiver",
    #     "descriptive_content": {
    #         "zzz": {"Content": "lmao what a jerk"},
    #         "dream": {
    #             "description": "I was my mother",
    #             "archetype": "The Caregiver",
    #         },
    #         "interpretation": {
    #             "context": "The assumption that what I think is also my partner's thought.",
    #             "compensation": "Our dreams are about compensation, which means they explain what we lack in the real world. In this case, the dream may be compensating for feelings of inadequacy or a lack of nurturing in your relationship with your partner.",
    #         },
    #         "analysis": {
    #             "insights": [
    #                 "The dream may be revealing an unconscious desire to take on a more caregiving role in your relationship.",
    #                 "It could also suggest that you're feeling overwhelmed or burdened by the responsibilities of being in a relationship, and your unconscious is trying to compensate by taking on a more nurturing role.",
    #             ],
    #             "questions": [
    #                 "What are my feelings about being in a relationship? Am I feeling overwhelmed or unfulfilled?",
    #                 "How do I feel about taking care of others? Is this something that comes naturally to me?",
    #             ],
    #         },
    #     },
    # }

        # Log query & response to database
    new_entry = QueryLog(dream_text=dream_text, response_data=json_response)
    db.session.add(new_entry)
    db.session.commit()

    response = Response(json_response, mimetype="application/json")
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8000, debug=True)