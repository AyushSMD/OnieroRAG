import json
import time
from datetime import datetime
from flask import Flask, render_template, request, Response, jsonify
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

# curl -X POST http://localhost:8000/llm -F dream="haha yes"
@app.route("/llm", methods=["POST"])
def llm_():
    if request.method == "POST":
        dream_text = request.form["dream"]

    data = the_big_dipper.main(dream_text=dream_text)
    json_response = json_listify(data)

    # Log query & response to database
    new_entry = QueryLog(dream_text=dream_text, response_data=json_response)
    db.session.add(new_entry)
    db.session.commit()

    response = Response(json_response, mimetype="application/json")
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# New endpoint to get chat history for a specific date
@app.route("/history/<date>", methods=["GET"])
def get_history_by_date(date):
    try:
        # Parse the date string into a datetime object
        date_obj = datetime.strptime(date, '%a %b %d %Y')
        
        # Query for all entries on this date
        start_of_day = datetime(date_obj.year, date_obj.month, date_obj.day, 0, 0, 0)
        end_of_day = datetime(date_obj.year, date_obj.month, date_obj.day, 23, 59, 59)
        
        queries = QueryLog.query.filter(
            QueryLog.timestamp >= start_of_day,
            QueryLog.timestamp <= end_of_day
        ).all()
        
        # Create a summary list with id and preview of each query
        history_items = []
        for query in queries:
            # Get the first 30 characters of the dream text as preview
            preview = query.dream_text[:30] + "..." if len(query.dream_text) > 30 else query.dream_text
            history_items.append({
                "id": query.id,
                "preview": preview,
                "timestamp": query.timestamp.strftime("%H:%M")
            })
        
        return jsonify(history_items)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# New endpoint to get a specific query by ID
@app.route("/query/<int:query_id>", methods=["GET"])
def get_query_by_id(query_id):
    query = QueryLog.query.get_or_404(query_id)
    return jsonify({
        "id": query.id,
        "dream_text": query.dream_text,
        "response_data": json.loads(query.response_data),
        "timestamp": query.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    })

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8000, debug=True)