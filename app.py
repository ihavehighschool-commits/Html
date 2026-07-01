from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Income Tracker</title>
    </head>
    <body style="font-family:Arial;text-align:center;margin-top:100px;">
        <h1>Income Tracker</h1>
        <a href="/sombath/laos">Open Website</a>
    </body>
    </html>
    """

from flask import Flask, send_from_directory
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route("/sombath/laos")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/style.css")
def style():
    return send_from_directory(BASE_DIR, "style.css")

@app.route("/game.js")
def js():
    return send_from_directory(BASE_DIR, "game.js")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
