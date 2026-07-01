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

@app.route("/sombath/laos")
def sombath():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )