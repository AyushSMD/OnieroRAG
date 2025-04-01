import json
import os
import time
import pytz
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime, timedelta
from flask import Flask, render_template, request, Response, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from scripts import the_big_dipper

load_dotenv()
app = Flask(__name__)
CORS(app)

# Configure the SQLite Database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///queries.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
IST = pytz.timezone("Asia/Kolkata")

# Database Model for Logging Queries, Responses, and Chart Data
class QueryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dream_text = db.Column(db.Text, nullable=False)
    response_data = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc).astimezone(IST))

class ChartData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chart_type = db.Column(db.String(50), nullable=False)
    data = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(pytz.utc).astimezone(IST))

# JSON Encoder for NumPy Types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

app.json_encoder = NumpyEncoder

def json_listify(data: dict) -> str:
    return json.dumps([{"_id_": key, "_text_": value} for key, value in data.items()])

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/llm", methods=["POST"])
def llm_():
    if "dream" not in request.form or not request.form["dream"].strip():
        return jsonify({"error": "Dream text is required"}), 400
    
    dream_text = request.form["dream"].strip()
    data = the_big_dipper.main(dream_text=dream_text)
    json_response = json_listify(data)

    new_entry = QueryLog(dream_text=dream_text, response_data=json_response)
    db.session.add(new_entry)
    db.session.commit()
    
    return Response(json_response, mimetype="application/json")

@app.route("/history/<date>", methods=["GET"])
def get_history_by_date(date):
    try:
        for format_string in ["%a %b %d %Y", "%Y-%m-%d", "%m/%d/%Y"]:
            try:
                date_obj = datetime.strptime(date, format_string).replace(tzinfo=IST)
                break
            except ValueError:
                continue
        else:
            return jsonify({"error": "Invalid date format"}), 400
        
        start_of_day = IST.localize(datetime(date_obj.year, date_obj.month, date_obj.day, 0, 0, 0))
        end_of_day = IST.localize(datetime(date_obj.year, date_obj.month, date_obj.day, 23, 59, 59))
        
        queries = QueryLog.query.filter(QueryLog.timestamp >= start_of_day, QueryLog.timestamp <= end_of_day).order_by(QueryLog.timestamp.desc()).all()
        
        return jsonify([{ "id": q.id, "preview": q.dream_text[:30] + "...", "timestamp": q.timestamp.strftime("%H:%M") } for q in queries])
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/query/<int:query_id>", methods=["GET"])
def get_query_by_id(query_id):
    query = QueryLog.query.get_or_404(query_id)
    return jsonify({
        "id": query.id,
        "dream_text": query.dream_text,
        "response_data": json.loads(query.response_data),
        "timestamp": query.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    })

# Chart Data Storage and Retrieval
@app.route('/get_bar_data')
def get_bar_data():
    df = pd.read_csv("static/assets/facebook_dream_archetypes.csv")
    counts = df['archetype'].value_counts()
    data = json.dumps({ 'labels': counts.index.tolist(), 'values': counts.values.tolist() })
    new_entry = ChartData(chart_type="bar", data=data)
    db.session.add(new_entry)
    db.session.commit()
    return jsonify(json.loads(data))

@app.route('/get_time_series_data')
def get_time_series_data():
    archetypes = ['explorer', 'everyman', 'hero', 'outlaw', 'sage']
    end_date = datetime.now()
    dates = [(end_date - timedelta(days=i*30)).strftime('%Y-%m') for i in range(6)][::-1]
    
    data = [{
        'archetype': archetype,
        'values': [max(1, np.random.randint(5, 15) + np.random.choice([-1, 0, 1]) * i + np.random.randint(-3, 4)) for i in range(len(dates))]
    } for archetype in archetypes]
    
    json_data = json.dumps({'dates': dates, 'data': data})
    new_entry = ChartData(chart_type="time_series", data=json_data)
    db.session.add(new_entry)
    db.session.commit()
    
    return jsonify(json.loads(json_data))

@app.route("/get_chart_history", methods=["GET"])
def get_chart_history():
    charts = ChartData.query.order_by(ChartData.timestamp.desc()).all()
    return jsonify([{ "id": c.id, "chart_type": c.chart_type, "timestamp": c.timestamp.strftime("%Y-%m-%d %H:%M:%S") } for c in charts])

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8000, debug=True)